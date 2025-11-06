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

// GET - Fetch all three admin signatures
router.get('/admin-signature', async (req, res) => {
  try {
    const signatures = await Signature.find().sort({ signatureType: 1 });
    
    // Create response with all three signature types
    const signatureData = {
      primary: null,
      secondary: null,
      tertiary: null
    };

    signatures.forEach(sig => {
      signatureData[sig.signatureType] = {
        id: sig._id.toString(),
        filename: sig.filename,
        filepath: sig.filepath,
        url: `/uploads/signatures/${sig.filename}`,
        uploadedAt: sig.uploadedAt
      };
    });

    res.json(signatureData);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ message: 'Failed to fetch signatures' });
  }
});

// POST - Upload admin signature (specify type in query parameter)
router.post('/admin-signature/upload', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { signatureType } = req.query; // Get signature type from query params

    if (!signatureType || !['primary', 'secondary', 'tertiary'].includes(signatureType)) {
      return res.status(400).json({ message: 'Invalid signature type. Use primary, secondary, or tertiary' });
    }

    // Check if signature of this type already exists
    const existingSignature = await Signature.findOne({ signatureType });
    
    if (existingSignature && existingSignature.filepath) {
      if (fs.existsSync(existingSignature.filepath)) {
        fs.unlinkSync(existingSignature.filepath);
      }
      await Signature.findByIdAndDelete(existingSignature._id);
    }

    const signatureData = new Signature({
      filename: req.file.filename,
      filepath: req.file.path,
      url: `/uploads/signatures/${req.file.filename}`,
      signatureType: signatureType,
      uploadedAt: new Date()
    });

    await signatureData.save();

    res.status(200).json({
      id: signatureData._id.toString(),
      filename: signatureData.filename,
      filepath: signatureData.filepath,
      url: signatureData.url,
      signatureType: signatureData.signatureType,
      uploadedAt: signatureData.uploadedAt
    });
  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ message: 'Failed to upload signature' });
  }
});

// DELETE - Delete specific signature by type
router.delete('/admin-signature/:type', async (req, res) => {
  try {
    const signatureType = req.params.type;
    
    if (!signatureType || !['primary', 'secondary', 'tertiary'].includes(signatureType)) {
      return res.status(400).json({ message: 'Invalid signature type' });
    }

    const signature = await Signature.findOne({ signatureType });
    
    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    if (signature.filepath && fs.existsSync(signature.filepath)) {
      fs.unlinkSync(signature.filepath);
    }

    await Signature.findByIdAndDelete(signature._id);

    res.status(200).json({ message: 'Signature deleted successfully' });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({ message: 'Failed to delete signature' });
  }
});

module.exports = router;