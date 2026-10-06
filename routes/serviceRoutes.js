
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const serviceController = require('../controllers/serviceController');

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Absolute: a relative 'uploads/' resolves against the process working
    // directory, so uploads failed with ENOENT whenever the server was started
    // from anywhere other than this folder.
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing file:', file.fieldname, file.originalname, file.mimetype);
    // Phone cameras send heic/heif and some browsers send a generic type for a
    // perfectly valid picture, so fall back to the file extension before
    // rejecting an upload and failing the whole save.
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/avif', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
      'image/jfif', 'image/pjpeg', 'image/svg+xml'
    ];
    const allowedExt = /\.(jpe?g|jfif|png|gif|webp|avif|heic|heif|bmp|tiff?|svg)$/i;
    if (allowedMimes.includes((file.mimetype || '').toLowerCase()) || allowedExt.test(file.originalname || '')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      message: `Image upload failed: ${err.message}`,
      error: err.message
    });
  }
  next();
};

// Routes
router.post('/api/service-reports', 
  upload.fields([
    { name: 'beforeServiceImages', maxCount: 20 },
    { name: 'afterServiceImages', maxCount: 20 }
  ]),
  handleMulterError,
  serviceController.createReport
);



router.get('/api/service-reports', serviceController.getAllReports);
// Must stay above '/:id' or they would be read as a report id.
router.get('/api/service-reports/next-slno', serviceController.getNextSlNo);
router.get('/api/service-reports/outlets',   serviceController.getOutletTemplates);
router.get('/api/service-reports/:id', serviceController.getReportById);

router.put('/api/service-reports/:id', 
  upload.fields([
    { name: 'beforeServiceImages', maxCount: 20 },
    { name: 'afterServiceImages', maxCount: 20 }
  ]),
  handleMulterError,
  serviceController.updateReport
);

router.delete('/api/service-reports/:id', serviceController.deleteReport);
router.get('/api/service-reports/download/:id', serviceController.downloadPDF);




// Customer share routes (no file upload needed)
router.post('/api/service-reports/:id/generate-share-link', serviceController.generateShareLink);
router.get('/api/sign/:token', serviceController.getReportByToken);
router.post('/api/sign/:token', serviceController.submitCustomerSignature);



// ─── Engineer Share Routes ─────────────────────────────────────────────────
router.post('/api/service-reports/:id/generate-engineer-share-link', serviceController.generateEngineerShareLink);
router.get('/api/engineer-sign/:token', serviceController.getReportByEngineerToken);
router.post('/api/engineer-sign/:token', serviceController.submitEngineerSignature);

// Dual share routes
router.post('/api/service-reports/:id/generate-dual-share-link', serviceController.generateDualShareLink);
router.get('/api/dual-sign/:token', serviceController.getReportByDualToken);
router.post('/api/dual-sign/:token', serviceController.submitDualSignature);

router.get('/api/form-autocomplete',  serviceController.getAutocomplete);
router.post('/api/form-autocomplete', serviceController.saveAutocomplete);

module.exports = router;