// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const serviceController = require('../controllers/serviceController');

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   }
// });

// // Routes
// router.post('/api/service-reports', upload.array('images', 10), serviceController.createReport);
// router.get('/api/service-reports', serviceController.getAllReports);
// router.get('/api/service-reports/:id', serviceController.getReportById);
// router.put('/api/service-reports/:id', upload.array('images', 10), serviceController.updateReport);
// router.delete('/api/service-reports/:id', serviceController.deleteReport);
// router.get('/api/service-reports/download/:id', serviceController.downloadPDF);

// module.exports = router;




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
    cb(null, 'uploads/');
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
    console.log('Processing file:', file.fieldname, file.originalname);
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
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
      message: 'Internal server error',
      error: err.message
    });
  }
  next();
};

// Routes
router.post('/api/service-reports', 
  upload.fields([
    { name: 'beforeServiceImages', maxCount: 10 },
    { name: 'afterServiceImages', maxCount: 10 }
  ]),
  handleMulterError,
  serviceController.createReport
);

router.get('/api/service-reports', serviceController.getAllReports);
router.get('/api/service-reports/:id', serviceController.getReportById);

router.put('/api/service-reports/:id', 
  upload.fields([
    { name: 'beforeServiceImages', maxCount: 10 },
    { name: 'afterServiceImages', maxCount: 10 }
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



module.exports = router;