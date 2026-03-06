// const mongoose = require('mongoose');

// // Counter schema for auto-incrementing slNo
// const counterSchema = new mongoose.Schema({
//   _id: { type: String, required: true },
//   seq: { type: Number, default: 0 }
// });

// const Counter = mongoose.model('Counter', counterSchema);

// const serviceReportSchema = new mongoose.Schema({
//   slNo: { type: Number, unique: true, sparse: true },
//   date: { type: Date, required: true },
//   billDate: Date,
//   billNo: String,
//   maintenanceType: String,
  
//   // Outlet Details
//   outletName: String,
//   outletAddress: String,
//   contactPerson: String,
//   contactNumber: String,
  
//   // Machine Details
//   machineType: String,
//   machineModel: String,
//   machineSerialNumber: String,
//   complaintDate: Date,
//   installationDate: Date,
  
//   // Technical Specifications
//   waterInputTDS: String,
//   waterPressure: String,
//   waterSource: String,
//   electricalSupply: String,
//   powerFluctuation: String,
  
//   // Fault Analysis
//   customerComplaint: String,
//   actualFault: String,
//   actionTaken: String,
  
//   // Spare Parts & Equipment
//   spareParts: [String],
//   equipments: [String],
  
//   // Remarks
//   serviceRemarks: String,
//   customerRemarks: String,
  
//   // Signatures
//   userName: String,
//   userDate: Date,
//   userSignature: String,
//   engineeringName: String,
//   engineeringDate: Date,
//   engineeringSignature: String,
//   serviceEngineerName: String,
//   serviceEngineerDate: Date,
  
//   // Images
//   images: [{ 
//     filename: String,
//     path: String,
//     mimetype: String
//   }],
//   beforeServiceImages: [{
//     filename: String,
//     path: String,
//     mimetype: String,
//     type: { type: String, default: 'before' }
//   }],
//   afterServiceImages: [{
//     filename: String,
//     path: String,
//     mimetype: String,
//     type: { type: String, default: 'after' }
//   }],
  
//   // PDF File Path - ADDED THIS
//   filePath: { type: String },
  
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // Auto-increment hook
// serviceReportSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         'slNo',
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//       );
//       this.slNo = counter.seq;
//     } catch (error) {
//       console.error('Error incrementing slNo:', error);
//       next(error);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model('ServiceReport', serviceReportSchema);








// const mongoose = require('mongoose');

// // Counter schema for auto-incrementing slNo
// const counterSchema = new mongoose.Schema({
//   _id: { type: String, required: true },
//   seq: { type: Number, default: 0 }
// });

// const Counter = mongoose.model('Counter', counterSchema);

// const serviceReportSchema = new mongoose.Schema({
//   slNo: { type: Number, unique: true, sparse: true },
//   date: { type: Date, required: true },
//   billDate: Date,
//   billNo: String,
//   maintenanceType: String,
  
//   // Outlet Details
//   outletName: String,
//   outletAddress: String,
//   contactPerson: String,
//   contactNumber: String,
  
//   // Machine Details
//   machineType: String,
//   machineModel: String,
//   machineSerialNumber: String,
//   complaintDate: Date,
//   installationDate: Date,
  
//   // Technical Specifications
//   waterInputTDS: String,
//   waterPressure: String,
//   waterSource: String,
//   electricalSupply: String,
//   powerFluctuation: String,
  
//   // Fault Analysis
//   customerComplaint: String,
//   actualFault: String,
//   actionTaken: String,
  
//   // Spare Parts & Equipment
//   spareParts: [String],
//   equipments: [String],
  
//   // Remarks
//   serviceRemarks: String,
//   customerRemarks: String,
  
//   // Signatures
//   userName: String,
//   userDate: Date,
//   userSignature: String,
//   engineeringName: String,
//   engineeringDate: Date,
//   engineeringSignature: String,
//   serviceEngineerName: String,
//   serviceEngineerDate: Date,
  
//   // NEW: Store selected service engineer signature information
//   selectedServiceSignatureType: String, // 'primary', 'secondary', 'tertiary'
//   selectedServiceSignatureUrl: String,
//   selectedServiceSignatureId: String,
  
//   // Images
//   images: [{ 
//     filename: String,
//     path: String,
//     mimetype: String
//   }],
//   beforeServiceImages: [{
//     filename: String,
//     path: String,
//     mimetype: String,
//     type: { type: String, default: 'before' }
//   }],
//   afterServiceImages: [{
//     filename: String,
//     path: String,
//     mimetype: String,
//     type: { type: String, default: 'after' }
//   }],
  
//   // PDF File Path
//   filePath: { type: String },
  
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// // Auto-increment hook
// serviceReportSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     try {
//       const counter = await Counter.findByIdAndUpdate(
//         'slNo',
//         { $inc: { seq: 1 } },
//         { new: true, upsert: true }
//       );
//       this.slNo = counter.seq;
//     } catch (error) {
//       console.error('Error incrementing slNo:', error);
//       next(error);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model('ServiceReport', serviceReportSchema);




const mongoose = require('mongoose');

// Counter schema for auto-incrementing slNo
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const serviceReportSchema = new mongoose.Schema({
  slNo: { type: Number, unique: true, sparse: true },
  date: { type: Date, required: true },
  billDate: Date,
  billNo: String,
  maintenanceType: String,


  
  
  // Outlet Details
  outletName: String,
  outletAddress: String,
  contactPerson: String,
  contactNumber: String,
  
  // Machine Details
  machineType: String,
  machineModel: String,
  machineSerialNumber: String,
  complaintDate: Date,
  installationDate: Date,
  
  // Technical Specifications
  waterInputTDS: String,
  waterPressure: String,
  waterSource: String,
  electricalSupply: String,
  powerFluctuation: String,
  
  // Fault Analysis
  customerComplaint: String,
  actualFault: String,
  actionTaken: String,
  
  // Spare Parts & Equipment
  spareParts: [String],
  equipments: [String],
  
  // Remarks
  serviceRemarks: String,
  customerRemarks: String,
  
  // Signatures
  userName: String,
  userDate: Date,
  userSignature: String,
  engineeringName: String,
  engineeringDate: Date,
  engineeringSignature: String,
  serviceEngineerName: String,
  serviceEngineerDate: Date,
  
  // NEW: Store selected service engineer signature information
  selectedServiceSignatureType: String, // 'primary', 'secondary', 'tertiary'
  selectedServiceSignatureUrl: String,
  selectedServiceSignatureId: String,
  
  // Images
  images: [{ 
    filename: String,
    path: String,
    mimetype: String
  }],
  beforeServiceImages: [{
    filename: String,
    path: String,
    mimetype: String,
    type: { type: String, default: 'before' }
  }],
  afterServiceImages: [{
    filename: String,
    path: String,
    mimetype: String,
    type: { type: String, default: 'after' }
  }],
  
// Add these fields to your existing serviceReportSchema
shareToken: { type: String, unique: true, sparse: true },
shareStatus: { type: String, enum: ['pending', 'signed'], default: 'pending' },
customerSignedAt: { type: Date },





// Engineer share fields
engineerShareToken:  { type: String, unique: true, sparse: true },
engineerShareStatus: { type: String, enum: ['pending', 'signed'], default: 'pending' },
engineerRemarks: { type: String, default: '' },
engineerSignedAt:    { type: Date },





  
  // PDF File Path
  filePath: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});




// Auto-increment hook (for saving)
serviceReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'slNo',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.slNo = counter.seq;
    } catch (error) {
      console.error('Error incrementing slNo:', error);
      next(error);
    }
  }
  next();
});






// ✅ NEW: Auto-decrement hook (when deleted)
serviceReportSchema.post('findOneAndDelete', async function (doc) {
  try {
    if (doc && doc.slNo) {
      // Find highest slNo after deletion
      const latest = await mongoose.model('ServiceReport').findOne().sort({ slNo: -1 });

      // If deleted document had the highest slNo, decrement counter
      if (!latest || doc.slNo > latest.slNo) {
        await Counter.findByIdAndUpdate('slNo', { $inc: { seq: -1 } });
        console.log(`Counter decremented after deleting SL No: ${doc.slNo}`);
      }
    }
  } catch (error) {
    console.error('Error decrementing counter after delete:', error);
  }
});







module.exports = mongoose.model('ServiceReport', serviceReportSchema);
