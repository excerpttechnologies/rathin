// const mongoose = require('mongoose');

// const serviceRequestSchema = new mongoose.Schema({
//   serviceType: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high'],
//     default: 'medium'
//   },
//   description: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   address: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   preferredDate: {
//     type: Date
//   },
//   preferredTime: {
//     type: String
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'in-progress', 'completed', 'cancelled'],
//     default: 'pending'
//   },
//   customerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Customer',
//     required: true
//   },
//   customerName: {
//     type: String,
//     required: true
//   },
//   customerEmail: {
//     type: String,
//     required: true
//   },
//   assignedTo: {
//     type: String,
//     default: ''
//   },
//   notes: {
//     type: String,
//     default: ''
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);













const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  complaintImages: [{
    type: String
  }],
  assignedTo: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// The two list screens read by customer, and by newest first.
serviceRequestSchema.index({ customerId: 1, createdAt: -1 });
serviceRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
