const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Operational', 'Maintenance', 'Breakdown', 'Idle'],
    default: 'Operational',
  },
  specifications: {
    type: String,
  },
  manufacturer: {
    type: String,
  },
  model: {
    type: String,
  },
  serialNumber: {
    type: String,
  },
  purchaseDate: {
    type: Date,
  },
  lastMaintenance: {
    type: Date,
  },
  nextMaintenance: {
    type: Date,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
machineSchema.index({ status: 1 });
machineSchema.index({ type: 1 });
machineSchema.index({ code: 1 });
machineSchema.index({ department: 1 });

module.exports = mongoose.model('Machine', machineSchema); 