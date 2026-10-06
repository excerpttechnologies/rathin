const ServiceReport = require("../models/ServiceReport");
const FormAutocomplete = require("../models/FormAutocomplete");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// ─── Shared helpers ────────────────────────────────────────────────────────
// Multipart form fields always arrive as strings, so `undefined`/`null` values
// reach us as the literal text. Strip those so they are never stored.
const text = (value) => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  return str === "undefined" || str === "null" ? "" : str;
};

const toDate = (value) => {
  const str = text(value);
  if (!str) return null;
  const parsed = new Date(str);
  return isNaN(parsed.valueOf()) ? null : parsed;
};

const toArray = (value) => {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      list = [value];
    }
  }
  return list.map((item) => text(item)).filter(Boolean);
};

// Images are served as `<host>/<path>`, so the stored path has to stay
// relative to the backend root with forward slashes, whatever the OS or the
// working directory the process was started from.
const toStoredImage = (file, type) => ({
  filename: file.filename,
  path: `uploads/${file.filename}`,
  mimetype: file.mimetype,
  type,
});

const collectImages = (files, field, type) =>
  (files && files[field] ? files[field] : []).map((file) =>
    toStoredImage(file, type),
  );

const isDuplicateSlNo = (error) =>
  !!error &&
  error.code === 11000 &&
  JSON.stringify(error.keyPattern || error.keyValue || {}).includes("slNo");

// A duplicate slNo must never cost the engineer their report: the model
// resyncs the counter on each attempt, so a retry picks a free number.
const saveWithUniqueSlNo = async (doc, attempts = 5) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await doc.save();
    } catch (error) {
      if (!isDuplicateSlNo(error) || attempt >= attempts) throw error;
      console.warn(
        `Duplicate SL No on attempt ${attempt}, resyncing the counter and retrying`,
      );
      // The counter had drifted behind the stored data; put it back in step so
      // the retry (and every save after it) gets a free number first time.
      await ServiceReport.resyncSlNoCounter().catch((err) =>
        console.error("Could not resync the slNo counter:", err),
      );
    }
  }
};

// ─── Cache for the read-heavy list endpoints ───────────────────────────────
// The billing list, the outlet selector and the SL No poll keep asking the
// same questions, and each one costs a round trip to a database that may be
// on another continent. Answers are held briefly in memory and thrown away
// the instant anything is written, so a page load is usually served without
// touching the database and can still never show a list that is out of date
// after a save, an edit, a delete or a signature.
const listCache = new Map();
const LIST_CACHE_TTL_MS = 20000;

const cacheGet = (key) => {
  const hit = listCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    listCache.delete(key);
    return null;
  }
  return hit.value;
};

const cacheSet = (key, value) => {
  listCache.set(key, { value, expires: Date.now() + LIST_CACHE_TTL_MS });
  return value;
};

const invalidateListCache = () => {
  if (listCache.size)
    console.log("List cache cleared (" + listCache.size + " entries)");
  listCache.clear();
};

// 'no-cache' lets the browser keep its copy but still check in: when nothing
// has changed Express answers 304 with no body at all, on its own ETag.
const sendList = (res, payload) => {
  res.set("Cache-Control", "no-cache");
  res.status(200).json(payload);
};

const DATE_FIELDS = [
  "date",
  "billDate",
  "complaintDate",
  "installationDate",
  "userDate",
  "engineeringDate",
  "serviceEngineerDate",
];

const TEXT_FIELDS = [
  "billNo",
  "maintenanceType",
  "outletName",
  "outletAddress",
  "contactPerson",
  "contactNumber",
  "machineType",
  "machineModel",
  "machineSerialNumber",
  "waterInputTDS",
  "waterPressure",
  "waterSource",
  "electricalSupply",
  "powerFluctuation",
  "customerComplaint",
  "actualFault",
  "actionTaken",
  "serviceRemarks",
  "customerRemarks",
  "userName",
  "userSignature",
  "engineeringName",
  "engineeringSignature",
  "serviceEngineerName",
  "selectedServiceSignatureType",
  "selectedServiceSignatureUrl",
  "selectedServiceSignatureId",
];
const crypto = require("crypto");

// ─── Create Service Report ─────────────────────────────────────────────────
exports.createReport = async (req, res) => {
  try {
    console.log("Incoming request body keys:", Object.keys(req.body));
    console.log("Files received:", req.files && Object.keys(req.files));

    const beforeServiceImages = collectImages(
      req.files,
      "beforeServiceImages",
      "before",
    );
    const afterServiceImages = collectImages(
      req.files,
      "afterServiceImages",
      "after",
    );
    console.log(
      "Images processed — before:",
      beforeServiceImages.length,
      "after:",
      afterServiceImages.length,
    );

    const payload = {
      // slNo is assigned by the model's counter so two engineers saving at the
      // same moment can never land on the same number.
      spareParts: toArray(req.body.spareParts),
      equipments: toArray(req.body.equipments),
      beforeServiceImages,
      afterServiceImages,
    };

    TEXT_FIELDS.forEach((field) => {
      payload[field] = text(req.body[field]);
    });
    DATE_FIELDS.forEach((field) => {
      payload[field] = toDate(req.body[field]);
    });
    // `date` is required by the schema — fall back to today rather than failing.
    if (!payload.date) payload.date = new Date();

    console.log(
      "Selected service signature type:",
      payload.selectedServiceSignatureType || "(none)",
    );

    const newReport = new ServiceReport(payload);
    await saveWithUniqueSlNo(newReport);
    invalidateListCache();

    console.log(
      "Report saved successfully ID:",
      newReport._id,
      "SL No:",
      newReport.slNo,
    );

    res.status(201).json({
      success: true,
      message: "Service report created successfully",
      data: newReport,
    });
  } catch (error) {
    console.error("ERROR in createReport:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: isDuplicateSlNo(error)
        ? "Could not allocate a free SL No. Please try saving again."
        : "Error creating service report",
      error: error.message,
      details: error.errors
        ? Object.values(error.errors).map((e) => e.message)
        : [],
    });
  }
};

// ─── Next SL No ────────────────────────────────────────────────────────────
// The form polls for the number the next report will get. It used to pull
// every report, with every stored signature, to work that out.
exports.getNextSlNo = async (req, res) => {
  try {
    const cached = cacheGet("next-slno");
    if (cached) return sendList(res, cached);

    const highest = await ServiceReport.highestSlNo();
    sendList(
      res,
      cacheSet("next-slno", { success: true, nextSlNo: highest + 1 }),
    );
  } catch (error) {
    console.error("Error reading next SL No:", error);
    res.status(500).json({
      success: false,
      message: "Error reading next SL No",
      error: error.message,
    });
  }
};

// ─── Outlet templates ──────────────────────────────────────────────────────
// The form's outlet selector needs the most recent report for each outlet, to
// prefill a new one. It used to download every report ever written and work
// that out in the browser; the grouping belongs in the database, where it is
// one indexed pass and a fraction of the bytes.
exports.getOutletTemplates = async (req, res) => {
  try {
    const cached = cacheGet("outlets");
    if (cached) return sendList(res, cached);

    const outlets = await ServiceReport.aggregate([
      { $match: { outletName: { $nin: [null, ""] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$outletName", report: { $first: "$$ROOT" } } },
      { $project: { _id: 0, outletName: "$_id", report: 1 } },
      // Dropped in a separate stage: $project cannot mix renaming a field with
      // excluding others. A previous report's signatures must never be carried
      // into a new one, and they are the bulk of a document.
      {
        $unset: [
          "report.userSignature",
          "report.engineeringSignature",
          "report.beforeServiceImages",
          "report.afterServiceImages",
          "report.shareToken",
          "report.engineerShareToken",
          "report.dualShareToken",
        ],
      },
      { $sort: { outletName: 1 } },
    ]);

    sendList(
      res,
      cacheSet("outlets", {
        success: true,
        count: outlets.length,
        data: outlets,
      }),
    );
  } catch (error) {
    console.error("Error building outlet templates:", error);
    res.status(500).json({
      success: false,
      message: "Error building outlet templates",
      error: error.message,
    });
  }
};

// ─── Get All Reports ───────────────────────────────────────────────────────
// Exactly what the billing cards and their search, type and outlet filters
// read — nothing else. Everything a report page needs beyond this is fetched
// per report, when one is actually opened.
const LIST_FIELDS = [
  "_id",
  "slNo",
  "date",
  "billDate",
  "billNo",
  "maintenanceType",
  "outletName",
  "machineSerialNumber",
  "shareStatus",
  "engineerShareStatus",
  "createdAt",
].join(" ");

// ?fields=list  → just the columns above (smallest)
// ?summary=1    → everything except the drawn-signature data URLs, which
//                 dominate the payload (used to prefill a new report)
// no parameter  → the full documents, unchanged
exports.getAllReports = async (req, res) => {
  try {
    const projection =
      req.query.fields === "list"
        ? LIST_FIELDS
        : req.query.summary
          ? "-userSignature -engineeringSignature"
          : null;

    const cacheKey = `reports:${req.query.fields || ""}:${req.query.summary || ""}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendList(res, cached);

    const reports = await ServiceReport.find({}, projection)
      .sort({ createdAt: -1 })
      .lean();
    sendList(
      res,
      cacheSet(cacheKey, {
        success: true,
        count: reports.length,
        data: reports,
      }),
    );
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
      error: error.message,
    });
  }
};

// ─── Get Report by ID ──────────────────────────────────────────────────────
exports.getReportById = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching report",
      error: error.message,
    });
  }
};

// ─── Update Report ─────────────────────────────────────────────────────────
exports.updateReport = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Only copy the fields the form owns. A blanket Object.assign(report,
    // req.body) wrote the raw multipart strings over typed paths (turning the
    // spare-parts array into one JSON string) and let a request overwrite
    // internals such as share tokens, _id or createdAt.
    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) report[field] = text(req.body[field]);
    });
    DATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined)
        report[field] = toDate(req.body[field]);
    });
    if (req.body.spareParts !== undefined)
      report.spareParts = toArray(req.body.spareParts);
    if (req.body.equipments !== undefined)
      report.equipments = toArray(req.body.equipments);

    // A changed SL No is honoured only when it is still free, so an edit can
    // never fail on the unique index.
    if (req.body.slNo !== undefined) {
      const slNo = parseInt(req.body.slNo, 10);
      if (!isNaN(slNo) && slNo !== report.slNo) {
        const taken = await ServiceReport.exists({
          slNo,
          _id: { $ne: report._id },
        });
        if (taken)
          console.warn(`SL No ${slNo} already in use; keeping ${report.slNo}`);
        else report.slNo = slNo;
      }
    }

    const newBeforeImages = collectImages(
      req.files,
      "beforeServiceImages",
      "before",
    );
    const newAfterImages = collectImages(
      req.files,
      "afterServiceImages",
      "after",
    );
    if (newBeforeImages.length) {
      report.beforeServiceImages = [
        ...(report.beforeServiceImages || []),
        ...newBeforeImages,
      ];
    }
    if (newAfterImages.length) {
      report.afterServiceImages = [
        ...(report.afterServiceImages || []),
        ...newAfterImages,
      ];
    }

    report.updatedAt = new Date();
    dropStoredPDF(report); // rebuilt on demand by the download route
    await report.save();
    invalidateListCache();

    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Error updating report",
      error: error.message,
    });
  }
};

// ─── Delete Report ─────────────────────────────────────────────────────────
exports.deleteReport = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (report.beforeServiceImages) {
      report.beforeServiceImages.forEach((img) => {
        const filePath = path.join(__dirname, "..", img.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    if (report.afterServiceImages) {
      report.afterServiceImages.forEach((img) => {
        const filePath = path.join(__dirname, "..", img.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    if (report.filePath) {
      const pdfPath = path.join(__dirname, "..", report.filePath);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log("Deleted PDF:", pdfPath);
      }
    }

    await ServiceReport.findByIdAndDelete(req.params.id);
    invalidateListCache();

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting report",
      error: error.message,
    });
  }
};

// ─── Download PDF ──────────────────────────────────────────────────────────
exports.downloadPDF = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);

    if (!report) {
      console.log("Report not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    console.log("Report found:", report._id);
    console.log("File path in DB:", report.filePath);

    if (!report.filePath) {
      console.log("No PDF file path, generating now...");
      await generatePDF(report);
      await report.save();
    }

    const filePath = path.join(__dirname, "..", report.filePath);
    console.log("Full file path:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("PDF file not found, regenerating...");
      await generatePDF(report);
      await report.save();
    }

    if (!fs.existsSync(filePath)) {
      console.error("Failed to generate PDF file");
      return res.status(500).json({
        success: false,
        message: "Failed to generate PDF file",
      });
    }

    const stat = fs.statSync(filePath);
    console.log("File size:", stat.size, "bytes");

    if (stat.size === 0) {
      console.error("PDF file is empty");
      return res.status(500).json({
        success: false,
        message: "PDF file is empty",
      });
    }

    const filename = `Service-Report-${report.slNo}-${report.date.toISOString().split("T")[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Cache-Control", "no-cache");

    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error streaming PDF file",
          error: error.message,
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error in downloadPDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error downloading PDF",
        error: error.message,
      });
    }
  }
};

// ─── Generate Share Link ───────────────────────────────────────────────────
exports.generateShareLink = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    if (!report.shareToken) {
      report.shareToken = crypto.randomBytes(32).toString("hex");
      report.shareStatus = "pending";
      await report.save();
    }

    const shareLink = `https://service.rathin.in/sign/${report.shareToken}`;

    res.status(200).json({
      success: true,
      shareLink,
      token: report.shareToken,
      shareStatus: report.shareStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Generate Engineer Share Link ──────────────────────────────────────────
exports.generateEngineerShareLink = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    if (!report.engineerShareToken) {
      report.engineerShareToken = crypto.randomBytes(32).toString("hex");
      report.engineerShareStatus = "pending";
      await report.save();
    }

    const shareLink = `https://service.rathin.in/engineer-sign/${report.engineerShareToken}`;

    res.status(200).json({
      success: true,
      shareLink,
      token: report.engineerShareToken,
      engineerShareStatus: report.engineerShareStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Report by Engineer Token ─────────────────────────────────────────
exports.getReportByEngineerToken = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      engineerShareToken: req.params.token,
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Engineer Submits Signature ────────────────────────────────────────────
exports.submitEngineerSignature = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      engineerShareToken: req.params.token,
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    }

    if (report.engineerShareStatus === "signed") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Already signed. Cannot submit again.",
        });
    }

    const {
      engineeringName,
      engineeringDate,
      engineeringSignature,
      engineerRemarks,
    } = req.body;

    report.engineeringName = engineeringName || report.engineeringName;
    report.engineeringDate = engineeringDate
      ? new Date(engineeringDate)
      : report.engineeringDate;
    report.engineeringSignature =
      engineeringSignature || report.engineeringSignature;
    report.serviceRemarks = engineerRemarks || report.serviceRemarks; // saves to serviceRemarks field
    report.engineerShareStatus = "signed";
    report.engineerSignedAt = new Date();

    dropStoredPDF(report); // rebuilt on demand by the download route
    await report.save();
    invalidateListCache();

    res.status(200).json({
      success: true,
      message: "Engineering signature submitted successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get Report by Token (customer view) ──────────────────────────────────
exports.getReportByToken = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      shareToken: req.params.token,
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Customer Submits Signature ────────────────────────────────────────────
exports.submitCustomerSignature = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      shareToken: req.params.token,
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    }

    if (report.shareStatus === "signed") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Already signed. Cannot submit again.",
        });
    }

    const { customerRemarks, userSignature, userName, userDate } = req.body;

    report.customerRemarks = customerRemarks || report.customerRemarks;
    report.userSignature = userSignature || report.userSignature;
    report.userName = userName || report.userName;
    report.userDate = userDate ? new Date(userDate) : report.userDate;
    report.shareStatus = "signed";
    report.customerSignedAt = new Date();

    dropStoredPDF(report); // rebuilt on demand by the download route
    await report.save();
    invalidateListCache();

    res.status(200).json({
      success: true,
      message: "Signature submitted successfully! Thank you.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate dual share link
exports.generateDualShareLink = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    const token = require("crypto").randomBytes(32).toString("hex");
    report.dualShareToken = token;
    report.dualShareStatus = "pending";
    report.dualSharedAt = new Date();
    await report.save();

    const shareLink = `https://service.rathin.in/dual-sign/${token}`;
    res.json({ success: true, shareLink, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get report by dual token
exports.getReportByDualToken = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      dualShareToken: req.params.token,
    });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit dual signature (body: { role: 'customer'|'engineer', name, signature, date, remarks })
exports.submitDualSignature = async (req, res) => {
  try {
    const report = await ServiceReport.findOne({
      dualShareToken: req.params.token,
    });
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });

    const { role, name, signature, date, remarks } = req.body;

    if (role === "customer") {
      report.userName = name;
      report.userDate = date;
      report.userSignature = signature;
      // Update status
      report.dualShareStatus =
        report.dualShareStatus === "engineer_signed"
          ? "both_signed"
          : "customer_signed";
      // Keep existing share fields in sync
      report.shareStatus = "signed";
      report.customerSignedAt = new Date();
    } else if (role === "engineer") {
      report.engineeringName = name;
      report.engineeringDate = date;
      report.engineeringSignature = signature;
      report.engineerRemarks = remarks || "";
      report.dualShareStatus =
        report.dualShareStatus === "customer_signed"
          ? "both_signed"
          : "engineer_signed";
      // Keep existing engineer share fields in sync
      report.engineerShareStatus = "signed";
      report.engineerSignedAt = new Date();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "role must be customer or engineer" });
    }

    await report.save();
    invalidateListCache();
    res.json({ success: true, status: report.dualShareStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAutocomplete = async (req, res) => {
  try {
    let doc = await FormAutocomplete.findById("global");
    if (!doc) {
      doc = await FormAutocomplete.create({ _id: "global" });
    }
    return res.json({ success: true, autocomplete: doc.toObject() });
  } catch (err) {
    console.error("getAutocomplete error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const saveAutocomplete = async (req, res) => {
  try {
    const incoming = req.body?.autocomplete;
    if (!incoming || typeof incoming !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Missing autocomplete payload" });
    }

    const FIELDS = [
      "outletName",
      "outletAddress",
      "contactPerson",
      "contactNumber",
      "machineType",
      "machineModel",
      "machineSerialNumber",
      "maintenanceType",
      "electricalSupply",
      "powerFluctuation",
      "userName",
      "engineeringName",
      "serviceEngineerName",
    ];

    // Fetch the existing document (or an empty object if it doesn't exist yet)
    const existing =
      (await FormAutocomplete.findById("global"))?.toObject() || {};

    const $set = { updatedAt: new Date() };

    FIELDS.forEach((field) => {
      const incomingValues = Array.isArray(incoming[field])
        ? incoming[field]
        : [];
      const existingValues = Array.isArray(existing[field])
        ? existing[field]
        : [];

      // Merge: incoming first (newest), then existing, deduplicate, cap at 15
      const merged = [...new Set([...incomingValues, ...existingValues])].slice(
        0,
        15,
      );
      $set[field] = merged;
    });

    await FormAutocomplete.findByIdAndUpdate(
      "global",
      { $set },
      { upsert: true, new: true },
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("saveAutocomplete error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAutocomplete = getAutocomplete;
exports.saveAutocomplete = saveAutocomplete;

// ─── Helper: Generate PDF ──────────────────────────────────────────────────
// Drops the stored PDF instead of rebuilding it.
//
// That file is only ever read by the download route, which regenerates it
// when it is missing. Rebuilding it on every save and every signature ran
// pdfkit — which decodes and re-deflates each embedded image — on the single
// thread that also answers every other request, so one save with photos made
// the whole site crawl for several seconds. Clearing the path costs nothing
// and the next download rebuilds an up-to-date copy.
//
// Call this BEFORE the report.save() that follows it, so the cleared path is
// persisted by that same write and no extra round trip is needed.
function dropStoredPDF(report) {
  const stale = report.filePath;
  report.filePath = undefined;
  if (!stale) return;
  // Unlinked asynchronously: the request never waits on the disk.
  fs.unlink(path.join(__dirname, "..", stale), () => {});
}

async function generatePDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, "..", "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `service-report-${report.slNo}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, filename);

      console.log("Generating PDF at:", filePath);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text("SERVICE REPORT", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`SL No: SR-${report.slNo}`, { align: "right" });
      doc.text(`Date: ${report.date.toLocaleDateString()}`, { align: "right" });
      doc.moveDown();

      // Outlet Information
      doc.fontSize(14).text("Outlet Information", { underline: true });
      doc.fontSize(10);
      doc.text(`Outlet Name: ${report.outletName || "N/A"}`);
      doc.text(`Address: ${report.outletAddress || "N/A"}`);
      doc.text(`Contact Person: ${report.contactPerson || "N/A"}`);
      doc.text(`Contact Number: ${report.contactNumber || "N/A"}`);
      doc.moveDown();

      // Machine Details
      doc.fontSize(14).text("Machine Details", { underline: true });
      doc.fontSize(10);
      doc.text(`Type: ${report.machineType || "N/A"}`);
      doc.text(`Model: ${report.machineModel || "N/A"}`);
      doc.text(`Serial Number: ${report.machineSerialNumber || "N/A"}`);
      doc.text(`Maintenance Type: ${report.maintenanceType || "N/A"}`);
      doc.moveDown();

      // Technical Specifications
      doc.fontSize(14).text("Technical Specifications", { underline: true });
      doc.fontSize(10);
      doc.text(`Water Input TDS: ${report.waterInputTDS || "N/A"}`);
      doc.text(`Water Pressure: ${report.waterPressure || "N/A"}`);
      doc.text(`Water Source: ${report.waterSource || "N/A"}`);
      doc.text(`Electrical Supply: ${report.electricalSupply || "N/A"}`);
      doc.text(`Power Fluctuation: ${report.powerFluctuation || "N/A"}`);
      doc.moveDown();

      // Fault Analysis
      doc.fontSize(14).text("Fault Analysis", { underline: true });
      doc.fontSize(10);
      doc.text(`Customer Complaint: ${report.customerComplaint || "N/A"}`);
      doc.text(`Actual Fault: ${report.actualFault || "N/A"}`);
      doc.text(`Action Taken: ${report.actionTaken || "N/A"}`);
      doc.moveDown();

      // Spare Parts
      if (report.spareParts && report.spareParts.length > 0) {
        doc.fontSize(14).text("Spare Parts Used", { underline: true });
        doc.fontSize(10);
        report.spareParts.forEach((part, index) => {
          doc.text(`${index + 1}. ${part}`);
        });
        doc.moveDown();
      }

      // Equipments
      if (report.equipments && report.equipments.length > 0) {
        doc.fontSize(14).text("Equipments", { underline: true });
        doc.fontSize(10);
        report.equipments.forEach((equip, index) => {
          doc.text(`${index + 1}. ${equip}`);
        });
        doc.moveDown();
      }

      // Before Service Images
      if (report.beforeServiceImages && report.beforeServiceImages.length > 0) {
        doc.addPage();
        doc.fontSize(14).text("Before Service Images", { underline: true });
        doc.moveDown();

        let yPos = doc.y;
        report.beforeServiceImages.forEach((img, index) => {
          const imagePath = path.join(__dirname, "..", img.path);
          if (fs.existsSync(imagePath)) {
            if (yPos > 650) {
              doc.addPage();
              yPos = 50;
            }
            try {
              doc.image(imagePath, 50, yPos, { width: 200 });
              doc.fontSize(8).text(`Image ${index + 1}`, 50, yPos + 160);
              yPos += 180;
            } catch (imgError) {
              console.error("Error adding image to PDF:", imgError);
            }
          }
        });
      }

      // After Service Images
      if (report.afterServiceImages && report.afterServiceImages.length > 0) {
        doc.addPage();
        doc.fontSize(14).text("After Service Images", { underline: true });
        doc.moveDown();

        let yPos = doc.y;
        report.afterServiceImages.forEach((img, index) => {
          const imagePath = path.join(__dirname, "..", img.path);
          if (fs.existsSync(imagePath)) {
            if (yPos > 650) {
              doc.addPage();
              yPos = 50;
            }
            try {
              doc.image(imagePath, 50, yPos, { width: 200 });
              doc.fontSize(8).text(`Image ${index + 1}`, 50, yPos + 160);
              yPos += 180;
            } catch (imgError) {
              console.error("Error adding image to PDF:", imgError);
            }
          }
        });
      }

      // Remarks
      doc.addPage();
      doc.fontSize(14).text("Remarks", { underline: true });
      doc.fontSize(10);
      doc.text(`Service Remarks: ${report.serviceRemarks || "N/A"}`);
      doc.text(`Customer Remarks: ${report.customerRemarks || "N/A"}`);
      doc.moveDown();

      // Signatures
      doc.fontSize(14).text("Signatures", { underline: true });
      doc.fontSize(10);
      doc.text(`Service Engineer: ${report.serviceEngineerName || "N/A"}`);
      if (report.serviceEngineerDate) {
        doc.text(
          `Date: ${new Date(report.serviceEngineerDate).toLocaleDateString()}`,
        );
      }
      doc.moveDown();
      doc.text(`Customer: ${report.userName || "N/A"}`);
      if (report.userDate) {
        doc.text(`Date: ${new Date(report.userDate).toLocaleDateString()}`);
      }

      doc.end();

      stream.on("finish", async () => {
        console.log("PDF generated successfully");
        report.filePath = `uploads/pdfs/${filename}`;
        try {
          await report.save();
          console.log("Report updated with file path:", report.filePath);
          resolve(filePath);
        } catch (saveError) {
          console.error("Error saving file path to report:", saveError);
          reject(saveError);
        }
      });

      stream.on("error", (error) => {
        console.error("Error writing PDF:", error);
        reject(error);
      });
    } catch (error) {
      console.error("Error in generatePDF:", error);
      reject(error);
    }
  });
}
