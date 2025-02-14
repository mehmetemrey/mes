const mongoose = require('mongoose');

const productionStageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  sequence: {
    type: Number,
    required: true,
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true,
  },
  requiredRoles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  }],
  isActive: {
    type: Boolean,
    default: true,
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
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
productionStageSchema.index({ sequence: 1 });
productionStageSchema.index({ isActive: 1 });
productionStageSchema.index({ department: 1 });

module.exports = mongoose.model('ProductionStage', productionStageSchema); 