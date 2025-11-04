// signature-routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Signature = require('../models/Signature');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/signatures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = 'admin-signature-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// GET - Fetch current admin signature
router.get('/admin-signature', async (req, res) => {
  try {
    const signature = await Signature.findOne().sort({ uploadedAt: -1 });
    
    if (signature) {
      res.json({
        id: signature._id.toString(),
        filename: signature.filename,
        filepath: signature.filepath,
        url: `/api/uploads/signatures/${signature.filename}`, // Full URL
        uploadedAt: signature.uploadedAt
      });
    } else {
      res.status(404).json({ message: 'No signature found' });
    }
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({ message: 'Failed to fetch signature' });
  }
});

// POST - Upload new admin signature
router.post('/admin-signature/upload', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const currentSignature = await Signature.findOne().sort({ uploadedAt: -1 });
    
    if (currentSignature && currentSignature.filepath) {
      if (fs.existsSync(currentSignature.filepath)) {
        fs.unlinkSync(currentSignature.filepath);
      }
      await Signature.findByIdAndDelete(currentSignature._id);
    }

    const signatureData = new Signature({
      filename: req.file.filename,
      filepath: req.file.path,
      url: `/api/uploads/signatures/${req.file.filename}`, // Full URL
      uploadedAt: new Date()
    });

    await signatureData.save();

    res.status(200).json({
      id: signatureData._id.toString(),
      filename: signatureData.filename,
      filepath: signatureData.filepath,
      url: signatureData.url,
      uploadedAt: signatureData.uploadedAt
    });
  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ message: 'Failed to upload signature' });
  }
});

// DELETE - Delete admin signature
router.delete('/admin-signature/:id', async (req, res) => {
  try {
    const signatureId = req.params.id;
    
    if (!signatureId || signatureId === 'undefined') {
      return res.status(400).json({ message: 'Invalid signature ID' });
    }

    const signature = await Signature.findById(signatureId);
    
    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    if (signature.filepath && fs.existsSync(signature.filepath)) {
      fs.unlinkSync(signature.filepath);
    }

    await Signature.findByIdAndDelete(signatureId);

    res.status(200).json({ message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({ message: 'Failed to delete signature' });
  }
});

module.exports = router;