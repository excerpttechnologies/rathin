// models/FormAutocomplete.js
const mongoose = require('mongoose');

/**
 * Stores the global autocomplete suggestions for the service form.
 * There is only ONE document in this collection (upserted by field name).
 */
const formAutocompleteSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },   // singleton

  outletName:          { type: [String], default: [] },
  outletAddress:       { type: [String], default: [] },
  contactPerson:       { type: [String], default: [] },
  contactNumber:       { type: [String], default: [] },
  machineType:         { type: [String], default: [] },
  machineModel:        { type: [String], default: [] },
  machineSerialNumber: { type: [String], default: [] },
  maintenanceType:     { type: [String], default: [] },
  electricalSupply:    { type: [String], default: [] },
  powerFluctuation:    { type: [String], default: [] },
  userName:            { type: [String], default: [] },
  engineeringName:     { type: [String], default: [] },
  serviceEngineerName: { type: [String], default: [] },

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FormAutocomplete', formAutocompleteSchema);