


// const ServiceReport = require('../models/ServiceReport');
// const fs = require('fs');
// const path = require('path');
// const PDFDocument = require('pdfkit');

// // Create Service Report
// exports.createReport = async (req, res) => {
//   try {
//     console.log('Incoming request body keys:', Object.keys(req.body));
//     console.log('Files received:', req.files ? req.files.length : 0);

//     const { 
//       slNo, date, billDate, billNo, maintenanceType, outletName, outletAddress,
//       contactPerson, contactNumber, machineType, machineModel, machineSerialNumber,
//       complaintDate, installationDate, waterInputTDS, waterPressure, waterSource,
//       electricalSupply, powerFluctuation, customerComplaint, actualFault, actionTaken,
//       spareParts, equipments, serviceRemarks, customerRemarks, userName, userDate,
//       userSignature, engineeringName, engineeringDate, engineeringSignature,
//       serviceEngineerName, serviceEngineerDate
//     } = req.body;

//     // Parse arrays
//     let parsedSpareParts = [];
//     let parsedEquipments = [];

//     try {
//       parsedSpareParts = typeof spareParts === 'string' ? JSON.parse(spareParts) : (Array.isArray(spareParts) ? spareParts : []);
//       parsedEquipments = typeof equipments === 'string' ? JSON.parse(equipments) : (Array.isArray(equipments) ? equipments : []);
//     } catch (parseError) {
//       console.log('Array parsing error, using defaults:', parseError.message);
//       parsedSpareParts = [];
//       parsedEquipments = [];
//     }

//     parsedSpareParts = parsedSpareParts.filter(p => p && String(p).trim());
//     parsedEquipments = parsedEquipments.filter(e => e && String(e).trim());

//     // Process uploaded images
//     const images = req.files ? req.files.map(file => ({
//       filename: file.filename,
//       path: file.path,
//       mimetype: file.mimetype
//     })) : [];

//     console.log('Creating report with SL No:', slNo);

//     const newReport = new ServiceReport({
//       slNo: parseInt(slNo) || 1,
//       date: date ? new Date(date) : new Date(),
//       billDate: billDate ? new Date(billDate) : null,
//       billNo: billNo || '',
//       maintenanceType: maintenanceType || '',
//       outletName: outletName || '',
//       outletAddress: outletAddress || '',
//       contactPerson: contactPerson || '',
//       contactNumber: contactNumber || '',
//       machineType: machineType || '',
//       machineModel: machineModel || '',
//       machineSerialNumber: machineSerialNumber || '',
//       complaintDate: complaintDate ? new Date(complaintDate) : null,
//       installationDate: installationDate ? new Date(installationDate) : null,
//       waterInputTDS: waterInputTDS || '',
//       waterPressure: waterPressure || '',
//       waterSource: waterSource || '',
//       electricalSupply: electricalSupply || '',
//       powerFluctuation: powerFluctuation || '',
//       customerComplaint: customerComplaint || '',
//       actualFault: actualFault || '',
//       actionTaken: actionTaken || '',
//       spareParts: parsedSpareParts,
//       equipments: parsedEquipments,
//       serviceRemarks: serviceRemarks || '',
//       customerRemarks: customerRemarks || '',
//       userName: userName || '',
//       userDate: userDate ? new Date(userDate) : null,
//       userSignature: userSignature || null,
//       engineeringName: engineeringName || '',
//       engineeringDate: engineeringDate ? new Date(engineeringDate) : null,
//       engineeringSignature: engineeringSignature || null,
//       serviceEngineerName: serviceEngineerName || '',
//       serviceEngineerDate: serviceEngineerDate ? new Date(serviceEngineerDate) : null,
//       images
//     });

//     await newReport.save();

//     // Generate PDF after saving
//     try {
//       await generatePDF(newReport);
//       console.log('PDF generated successfully for report:', newReport._id);
//     } catch (pdfError) {
//       console.error('Error generating PDF:', pdfError);
//       // Continue even if PDF generation fails
//     }

//     console.log('Report saved successfully with ID:', newReport._id);

//     res.status(201).json({
//       success: true,
//       message: 'Service report created successfully',
//       data: newReport
//     });

//   } catch (error) {
//     console.error('ERROR in createReport:', error);
//     console.error('Error stack:', error.stack);
    
//     res.status(500).json({
//       success: false,
//       message: 'Error creating service report',
//       error: error.message,
//       details: error.errors ? Object.values(error.errors).map(e => e.message) : []
//     });
//   }
// };

// // Get All Reports
// exports.getAllReports = async (req, res) => {
//   try {
//     const reports = await ServiceReport.find().sort({ createdAt: -1 });
//     res.status(200).json({
//       success: true,
//       count: reports.length,
//       data: reports
//     });
//   } catch (error) {
//     console.error('Error fetching reports:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching reports',
//       error: error.message
//     });
//   }
// };

// // Get Report by ID
// exports.getReportById = async (req, res) => {
//   try {
//     const report = await ServiceReport.findById(req.params.id);
//     if (!report) {
//       return res.status(404).json({
//         success: false,
//         message: 'Report not found'
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: report
//     });
//   } catch (error) {
//     console.error('Error fetching report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching report',
//       error: error.message
//     });
//   }
// };

// // Update Report
// exports.updateReport = async (req, res) => {
//   try {
//     const report = await ServiceReport.findById(req.params.id);
//     if (!report) {
//       return res.status(404).json({
//         success: false,
//         message: 'Report not found'
//       });
//     }

//     Object.assign(report, req.body);

//     if (req.files && req.files.length > 0) {
//       const newImages = req.files.map(file => ({
//         filename: file.filename,
//         path: file.path,
//         mimetype: file.mimetype
//       }));
//       report.images = [...report.images, ...newImages];
//     }

//     report.updatedAt = new Date();
//     await report.save();

//     // Regenerate PDF
//     try {
//       await generatePDF(report);
//     } catch (pdfError) {
//       console.error('Error regenerating PDF:', pdfError);
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Report updated successfully',
//       data: report
//     });
//   } catch (error) {
//     console.error('Error updating report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating report',
//       error: error.message
//     });
//   }
// };

// // Delete Report
// exports.deleteReport = async (req, res) => {
//   try {
//     const report = await ServiceReport.findById(req.params.id);
//     if (!report) {
//       return res.status(404).json({
//         success: false,
//         message: 'Report not found'
//       });
//     }

//     // Delete associated images
//     report.images.forEach(img => {
//       const filePath = path.join(__dirname, '..', img.path);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     });

//     // Delete PDF file
//     if (report.filePath) {
//       const pdfPath = path.join(__dirname, '..', report.filePath);
//       if (fs.existsSync(pdfPath)) {
//         fs.unlinkSync(pdfPath);
//         console.log('Deleted PDF:', pdfPath);
//       }
//     }

//     await ServiceReport.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Report deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error deleting report',
//       error: error.message
//     });
//   }
// };

// // Download PDF
// exports.downloadPDF = async (req, res) => {
//   try {
//     const report = await ServiceReport.findById(req.params.id);
    
//     if (!report) {
//       console.log('Report not found:', req.params.id);
//       return res.status(404).json({
//         success: false,
//         message: 'Report not found'
//       });
//     }

//     console.log('Report found:', report._id);
//     console.log('File path in DB:', report.filePath);

//     // If no PDF file path, generate it now
//     if (!report.filePath) {
//       console.log('No PDF file path, generating now...');
//       await generatePDF(report);
//       // Refresh report to get updated filePath
//       await report.save();
//     }

//     const filePath = path.join(__dirname, '..', report.filePath);
//     console.log('Full file path:', filePath);

//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       console.log('PDF file not found, regenerating...');
//       await generatePDF(report);
//       await report.save();
//     }

//     // Verify file exists after generation
//     if (!fs.existsSync(filePath)) {
//       console.error('Failed to generate PDF file');
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to generate PDF file'
//       });
//     }

//     const stat = fs.statSync(filePath);
//     console.log('File size:', stat.size, 'bytes');

//     if (stat.size === 0) {
//       console.error('PDF file is empty');
//       return res.status(500).json({
//         success: false,
//         message: 'PDF file is empty'
//       });
//     }

//     const filename = `Service-Report-${report.slNo}-${report.date.toISOString().split('T')[0]}.pdf`;
    
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-Length', stat.size);
//     res.setHeader('Cache-Control', 'no-cache');

//     const fileStream = fs.createReadStream(filePath);
    
//     fileStream.on('error', (error) => {
//       console.error('Error streaming file:', error);
//       if (!res.headersSent) {
//         res.status(500).json({
//           success: false,
//           message: 'Error streaming PDF file',
//           error: error.message
//         });
//       }
//     });

//     fileStream.pipe(res);

//   } catch (error) {
//     console.error('Error in downloadPDF:', error);
//     if (!res.headersSent) {
//       res.status(500).json({
//         success: false,
//         message: 'Error downloading PDF',
//         error: error.message
//       });
//     }
//   }
// };

// // Helper function to generate PDF
// async function generatePDF(report) {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create pdfs directory if it doesn't exist
//       const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
//       if (!fs.existsSync(pdfDir)) {
//         fs.mkdirSync(pdfDir, { recursive: true });
//       }

//       const filename = `service-report-${report.slNo}-${Date.now()}.pdf`;
//       const filePath = path.join(pdfDir, filename);
      
//       console.log('Generating PDF at:', filePath);

//       const doc = new PDFDocument({ margin: 50 });
//       const stream = fs.createWriteStream(filePath);

//       doc.pipe(stream);

//       // Header
//       doc.fontSize(20).text('SERVICE REPORT', { align: 'center' });
//       doc.moveDown();
//       doc.fontSize(12).text(`SL No: SR-${report.slNo}`, { align: 'right' });
//       doc.text(`Date: ${report.date.toLocaleDateString()}`, { align: 'right' });
//       doc.moveDown();

//       // Outlet Information
//       doc.fontSize(14).text('Outlet Information', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Outlet Name: ${report.outletName || 'N/A'}`);
//       doc.text(`Address: ${report.outletAddress || 'N/A'}`);
//       doc.text(`Contact Person: ${report.contactPerson || 'N/A'}`);
//       doc.text(`Contact Number: ${report.contactNumber || 'N/A'}`);
//       doc.moveDown();

//       // Machine Details
//       doc.fontSize(14).text('Machine Details', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Type: ${report.machineType || 'N/A'}`);
//       doc.text(`Model: ${report.machineModel || 'N/A'}`);
//       doc.text(`Serial Number: ${report.machineSerialNumber || 'N/A'}`);
//       doc.text(`Maintenance Type: ${report.maintenanceType || 'N/A'}`);
//       doc.moveDown();

//       // Technical Specifications
//       doc.fontSize(14).text('Technical Specifications', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Water Input TDS: ${report.waterInputTDS || 'N/A'}`);
//       doc.text(`Water Pressure: ${report.waterPressure || 'N/A'}`);
//       doc.text(`Water Source: ${report.waterSource || 'N/A'}`);
//       doc.text(`Electrical Supply: ${report.electricalSupply || 'N/A'}`);
//       doc.text(`Power Fluctuation: ${report.powerFluctuation || 'N/A'}`);
//       doc.moveDown();

//       // Fault Analysis
//       doc.fontSize(14).text('Fault Analysis', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Customer Complaint: ${report.customerComplaint || 'N/A'}`);
//       doc.text(`Actual Fault: ${report.actualFault || 'N/A'}`);
//       doc.text(`Action Taken: ${report.actionTaken || 'N/A'}`);
//       doc.moveDown();

//       // Spare Parts
//       if (report.spareParts && report.spareParts.length > 0) {
//         doc.fontSize(14).text('Spare Parts Used', { underline: true });
//         doc.fontSize(10);
//         report.spareParts.forEach((part, index) => {
//           doc.text(`${index + 1}. ${part}`);
//         });
//         doc.moveDown();
//       }

//       // Equipments
//       if (report.equipments && report.equipments.length > 0) {
//         doc.fontSize(14).text('Equipments', { underline: true });
//         doc.fontSize(10);
//         report.equipments.forEach((equip, index) => {
//           doc.text(`${index + 1}. ${equip}`);
//         });
//         doc.moveDown();
//       }

//       // Remarks
//       doc.fontSize(14).text('Remarks', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Service Remarks: ${report.serviceRemarks || 'N/A'}`);
//       doc.text(`Customer Remarks: ${report.customerRemarks || 'N/A'}`);
//       doc.moveDown();

//       // Signatures
//       doc.fontSize(14).text('Signatures', { underline: true });
//       doc.fontSize(10);
//       doc.text(`Service Engineer: ${report.serviceEngineerName || 'N/A'}`);
//       if (report.serviceEngineerDate) {
//         doc.text(`Date: ${new Date(report.serviceEngineerDate).toLocaleDateString()}`);
//       }
//       doc.moveDown();
//       doc.text(`Customer: ${report.userName || 'N/A'}`);
//       if (report.userDate) {
//         doc.text(`Date: ${new Date(report.userDate).toLocaleDateString()}`);
//       }

//       doc.end();

//       stream.on('finish', async () => {
//         console.log('PDF generated successfully');
//         // Update report with file path
//         report.filePath = `uploads/pdfs/${filename}`;
//         try {
//           await report.save();
//           console.log('Report updated with file path:', report.filePath);
//           resolve(filePath);
//         } catch (saveError) {
//           console.error('Error saving file path to report:', saveError);
//           reject(saveError);
//         }
//       });

//       stream.on('error', (error) => {
//         console.error('Error writing PDF:', error);
//         reject(error);
//       });

//     } catch (error) {
//       console.error('Error in generatePDF:', error);
//       reject(error);
//     }
//   });
// }









const ServiceReport = require('../models/ServiceReport');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create Service Report
exports.createReport = async (req, res) => {
  try {
    console.log('Incoming request body keys:', Object.keys(req.body));
    console.log('Files received:', req.files);

    const { 
      slNo, date, billDate, billNo, maintenanceType, outletName, outletAddress,
      contactPerson, contactNumber, machineType, machineModel, machineSerialNumber,
      complaintDate, installationDate, waterInputTDS, waterPressure, waterSource,
      electricalSupply, powerFluctuation, customerComplaint, actualFault, actionTaken,
      spareParts, equipments, serviceRemarks, customerRemarks, userName, userDate,
      userSignature, engineeringName, engineeringDate, engineeringSignature,
      serviceEngineerName, serviceEngineerDate,
      // NEW: Add these fields
      selectedServiceSignatureType, selectedServiceSignatureUrl, selectedServiceSignatureId
    } = req.body;

    // Parse arrays
    let parsedSpareParts = [];
    let parsedEquipments = [];

    try {
      parsedSpareParts = typeof spareParts === 'string' ? JSON.parse(spareParts) : (Array.isArray(spareParts) ? spareParts : []);
      parsedEquipments = typeof equipments === 'string' ? JSON.parse(equipments) : (Array.isArray(equipments) ? equipments : []);
    } catch (parseError) {
      console.log('Array parsing error, using defaults:', parseError.message);
      parsedSpareParts = [];
      parsedEquipments = [];
    }

    parsedSpareParts = parsedSpareParts.filter(p => p && String(p).trim());
    parsedEquipments = parsedEquipments.filter(e => e && String(e).trim());

    // Process uploaded images
    let beforeServiceImages = [];
    let afterServiceImages = [];

    if (req.files) {
      // Process before service images
      if (req.files.beforeServiceImages) {
        beforeServiceImages = req.files.beforeServiceImages.map(file => ({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          type: 'before'
        }));
        console.log('Before service images processed:', beforeServiceImages.length);
      }

      // Process after service images
      if (req.files.afterServiceImages) {
        afterServiceImages = req.files.afterServiceImages.map(file => ({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          type: 'after'
        }));
        console.log('After service images processed:', afterServiceImages.length);
      }
    }

    console.log('Creating report with SL No:', slNo);
    console.log('Selected service signature type:', selectedServiceSignatureType);

    const newReport = new ServiceReport({
      slNo: parseInt(slNo) || 1,
      date: date ? new Date(date) : new Date(),
      billDate: billDate ? new Date(billDate) : null,
      billNo: billNo || '',
      maintenanceType: maintenanceType || '',
      outletName: outletName || '',
      outletAddress: outletAddress || '',
      contactPerson: contactPerson || '',
      contactNumber: contactNumber || '',
      machineType: machineType || '',
      machineModel: machineModel || '',
      machineSerialNumber: machineSerialNumber || '',
      complaintDate: complaintDate ? new Date(complaintDate) : null,
      installationDate: installationDate ? new Date(installationDate) : null,
      waterInputTDS: waterInputTDS || '',
      waterPressure: waterPressure || '',
      waterSource: waterSource || '',
      electricalSupply: electricalSupply || '',
      powerFluctuation: powerFluctuation || '',
      customerComplaint: customerComplaint || '',
      actualFault: actualFault || '',
      actionTaken: actionTaken || '',
      spareParts: parsedSpareParts,
      equipments: parsedEquipments,
      serviceRemarks: serviceRemarks || '',
      customerRemarks: customerRemarks || '',
      userName: userName || '',
      userDate: userDate ? new Date(userDate) : null,
      userSignature: userSignature || null,
      engineeringName: engineeringName || '',
      engineeringDate: engineeringDate ? new Date(engineeringDate) : null,
      engineeringSignature: engineeringSignature || null,
      serviceEngineerName: serviceEngineerName || '',
      serviceEngineerDate: serviceEngineerDate ? new Date(serviceEngineerDate) : null,
      // NEW: Store selected signature information
      selectedServiceSignatureType: selectedServiceSignatureType || null,
      selectedServiceSignatureUrl: selectedServiceSignatureUrl || null,
      selectedServiceSignatureId: selectedServiceSignatureId || null,
      beforeServiceImages,
      afterServiceImages
    });

    await newReport.save();

    // Generate PDF after saving
    try {
      await generatePDF(newReport);
      console.log('PDF generated successfully for report:', newReport._id);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // Continue even if PDF generation fails
    }

    console.log('Report saved successfully with ID:', newReport._id);
    console.log('Selected signature stored:', newReport.selectedServiceSignatureType);

    res.status(201).json({
      success: true,
      message: 'Service report created successfully',
      data: newReport
    });

  } catch (error) {
    console.error('ERROR in createReport:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error creating service report',
      error: error.message,
      details: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
};

// Get All Reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await ServiceReport.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Get Report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// Update Report
exports.updateReport = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    Object.assign(report, req.body);

    // Process new images if uploaded
    if (req.files) {
      if (req.files.beforeServiceImages) {
        const newBeforeImages = req.files.beforeServiceImages.map(file => ({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          type: 'before'
        }));
        report.beforeServiceImages = [...report.beforeServiceImages, ...newBeforeImages];
      }

      if (req.files.afterServiceImages) {
        const newAfterImages = req.files.afterServiceImages.map(file => ({
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          type: 'after'
        }));
        report.afterServiceImages = [...report.afterServiceImages, ...newAfterImages];
      }
    }

    report.updatedAt = new Date();
    await report.save();

    // Regenerate PDF
    try {
      await generatePDF(report);
    } catch (pdfError) {
      console.error('Error regenerating PDF:', pdfError);
    }

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};

// Delete Report
exports.deleteReport = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Delete associated before service images
    if (report.beforeServiceImages) {
      report.beforeServiceImages.forEach(img => {
        const filePath = path.join(__dirname, '..', img.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Delete associated after service images
    if (report.afterServiceImages) {
      report.afterServiceImages.forEach(img => {
        const filePath = path.join(__dirname, '..', img.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Delete PDF file
    if (report.filePath) {
      const pdfPath = path.join(__dirname, '..', report.filePath);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        console.log('Deleted PDF:', pdfPath);
      }
    }

    await ServiceReport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// Download PDF
exports.downloadPDF = async (req, res) => {
  try {
    const report = await ServiceReport.findById(req.params.id);
    
    if (!report) {
      console.log('Report not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('Report found:', report._id);
    console.log('File path in DB:', report.filePath);

    // If no PDF file path, generate it now
    if (!report.filePath) {
      console.log('No PDF file path, generating now...');
      await generatePDF(report);
      await report.save();
    }

    const filePath = path.join(__dirname, '..', report.filePath);
    console.log('Full file path:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('PDF file not found, regenerating...');
      await generatePDF(report);
      await report.save();
    }

    // Verify file exists after generation
    if (!fs.existsSync(filePath)) {
      console.error('Failed to generate PDF file');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF file'
      });
    }

    const stat = fs.statSync(filePath);
    console.log('File size:', stat.size, 'bytes');

    if (stat.size === 0) {
      console.error('PDF file is empty');
      return res.status(500).json({
        success: false,
        message: 'PDF file is empty'
      });
    }

    const filename = `Service-Report-${report.slNo}-${report.date.toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');

    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming PDF file',
          error: error.message
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error in downloadPDF:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error downloading PDF',
        error: error.message
      });
    }
  }
};

// Helper function to generate PDF with images support
async function generatePDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `service-report-${report.slNo}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, filename);
      
      console.log('Generating PDF at:', filePath);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('SERVICE REPORT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`SL No: SR-${report.slNo}`, { align: 'right' });
      doc.text(`Date: ${report.date.toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Outlet Information
      doc.fontSize(14).text('Outlet Information', { underline: true });
      doc.fontSize(10);
      doc.text(`Outlet Name: ${report.outletName || 'N/A'}`);
      doc.text(`Address: ${report.outletAddress || 'N/A'}`);
      doc.text(`Contact Person: ${report.contactPerson || 'N/A'}`);
      doc.text(`Contact Number: ${report.contactNumber || 'N/A'}`);
      doc.moveDown();

      // Machine Details
      doc.fontSize(14).text('Machine Details', { underline: true });
      doc.fontSize(10);
      doc.text(`Type: ${report.machineType || 'N/A'}`);
      doc.text(`Model: ${report.machineModel || 'N/A'}`);
      doc.text(`Serial Number: ${report.machineSerialNumber || 'N/A'}`);
      doc.text(`Maintenance Type: ${report.maintenanceType || 'N/A'}`);
      doc.moveDown();

      // Technical Specifications
      doc.fontSize(14).text('Technical Specifications', { underline: true });
      doc.fontSize(10);
      doc.text(`Water Input TDS: ${report.waterInputTDS || 'N/A'}`);
      doc.text(`Water Pressure: ${report.waterPressure || 'N/A'}`);
      doc.text(`Water Source: ${report.waterSource || 'N/A'}`);
      doc.text(`Electrical Supply: ${report.electricalSupply || 'N/A'}`);
      doc.text(`Power Fluctuation: ${report.powerFluctuation || 'N/A'}`);
      doc.moveDown();

      // Fault Analysis
      doc.fontSize(14).text('Fault Analysis', { underline: true });
      doc.fontSize(10);
      doc.text(`Customer Complaint: ${report.customerComplaint || 'N/A'}`);
      doc.text(`Actual Fault: ${report.actualFault || 'N/A'}`);
      doc.text(`Action Taken: ${report.actionTaken || 'N/A'}`);
      doc.moveDown();

      // Spare Parts
      if (report.spareParts && report.spareParts.length > 0) {
        doc.fontSize(14).text('Spare Parts Used', { underline: true });
        doc.fontSize(10);
        report.spareParts.forEach((part, index) => {
          doc.text(`${index + 1}. ${part}`);
        });
        doc.moveDown();
      }

      // Equipments
      if (report.equipments && report.equipments.length > 0) {
        doc.fontSize(14).text('Equipments', { underline: true });
        doc.fontSize(10);
        report.equipments.forEach((equip, index) => {
          doc.text(`${index + 1}. ${equip}`);
        });
        doc.moveDown();
      }

      // Before Service Images
      if (report.beforeServiceImages && report.beforeServiceImages.length > 0) {
        doc.addPage();
        doc.fontSize(14).text('Before Service Images', { underline: true });
        doc.moveDown();
        
        let yPos = doc.y;
        report.beforeServiceImages.forEach((img, index) => {
          const imagePath = path.join(__dirname, '..', img.path);
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
              console.error('Error adding image to PDF:', imgError);
            }
          }
        });
      }

      // After Service Images
      if (report.afterServiceImages && report.afterServiceImages.length > 0) {
        doc.addPage();
        doc.fontSize(14).text('After Service Images', { underline: true });
        doc.moveDown();
        
        let yPos = doc.y;
        report.afterServiceImages.forEach((img, index) => {
          const imagePath = path.join(__dirname, '..', img.path);
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
              console.error('Error adding image to PDF:', imgError);
            }
          }
        });
      }

      // Remarks
      doc.addPage();
      doc.fontSize(14).text('Remarks', { underline: true });
      doc.fontSize(10);
      doc.text(`Service Remarks: ${report.serviceRemarks || 'N/A'}`);
      doc.text(`Customer Remarks: ${report.customerRemarks || 'N/A'}`);
      doc.moveDown();

      // Signatures
      doc.fontSize(14).text('Signatures', { underline: true });
      doc.fontSize(10);
      doc.text(`Service Engineer: ${report.serviceEngineerName || 'N/A'}`);
      if (report.serviceEngineerDate) {
        doc.text(`Date: ${new Date(report.serviceEngineerDate).toLocaleDateString()}`);
      }
      doc.moveDown();
      doc.text(`Customer: ${report.userName || 'N/A'}`);
      if (report.userDate) {
        doc.text(`Date: ${new Date(report.userDate).toLocaleDateString()}`);
      }

      doc.end();

      stream.on('finish', async () => {
        console.log('PDF generated successfully');
        report.filePath = `uploads/pdfs/${filename}`;
        try {
          await report.save();
          console.log('Report updated with file path:', report.filePath);
          resolve(filePath);
        } catch (saveError) {
          console.error('Error saving file path to report:', saveError);
          reject(saveError);
        }
      });

      stream.on('error', (error) => {
        console.error('Error writing PDF:', error);
        reject(error);
      });

    } catch (error) {
      console.error('Error in generatePDF:', error);
      reject(error);
    }
  });
}