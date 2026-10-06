

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





// Combined / dual signature share
dualShareToken:  { type: String, unique: true, sparse: true },
dualShareStatus: { type: String, enum: ['pending', 'customer_signed', 'engineer_signed', 'both_signed'], default: 'pending' },
dualSharedAt:    { type: Date },



  
  // PDF File Path
  filePath: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});




// The billing list always sorts by newest first.
serviceReportSchema.index({ createdAt: -1 });

// ─── SL No allocation ──────────────────────────────────────────────────────
// The counter document can drift out of sync with the reports it numbers:
// reports imported or removed directly in the DB, a counter created after data
// already existed, or the old delete hook decrementing past the real maximum.
// When that happens the counter hands back an slNo that is already taken and,
// because slNo carries a unique index, EVERY new report fails to save with a
// duplicate-key error. nextSlNo() heals the counter whenever it has fallen
// behind the highest stored slNo, so a stale counter can never block saving.
async function highestSlNo() {
  const latest = await mongoose.model('ServiceReport')
    .findOne({ slNo: { $ne: null } })
    .sort({ slNo: -1 })
    .select('slNo')
    .lean();
  return latest && typeof latest.slNo === 'number' ? latest.slNo : 0;
}

// One round trip on the normal path. Checking the data for drift on every
// save cost an extra query per report; instead the caller resyncs and retries
// if the number it got turns out to be taken.
async function nextSlNo() {
  const counter = await Counter.findByIdAndUpdate(
    'slNo',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Point the counter back at the data. Called after a duplicate slNo, so the
// next attempt gets a free number.
async function resyncSlNoCounter() {
  const maxSlNo = await highestSlNo();
  const healed = await Counter.findByIdAndUpdate(
    'slNo',
    { $set: { seq: maxSlNo + 1 } },
    { new: true, upsert: true }
  );
  console.log(`slNo counter resynced to ${healed.seq} (highest stored: ${maxSlNo})`);
  return healed.seq;
}

serviceReportSchema.statics.nextSlNo          = nextSlNo;
serviceReportSchema.statics.highestSlNo       = highestSlNo;
serviceReportSchema.statics.resyncSlNoCounter = resyncSlNoCounter;

// Auto-increment hook (for saving)
serviceReportSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  try {
    this.slNo = await nextSlNo();
    return next();
  } catch (error) {
    console.error('Error allocating slNo:', error);
    return next(error);
  }
});

// Keep the counter in step with the data after a delete: resync it to the
// highest slNo still stored instead of blindly decrementing (a blind decrement
// drops the counter below the real maximum and causes duplicates later on).
serviceReportSchema.post('findOneAndDelete', async function (doc) {
  try {
    if (!doc || !doc.slNo) return;
    const maxSlNo = await highestSlNo();
    await Counter.findByIdAndUpdate('slNo', { $set: { seq: maxSlNo } }, { upsert: true });
    console.log(`Counter resynced to ${maxSlNo} after deleting SL No: ${doc.slNo}`);
  } catch (error) {
    console.error('Error resyncing counter after delete:', error);
  }
});

module.exports = mongoose.model('ServiceReport', serviceReportSchema);
