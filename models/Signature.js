const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  signatureType: {
    type: String,
    required: true,
    enum: ['primary', 'secondary', 'tertiary'] // Three signature types
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Signature', signatureSchema);