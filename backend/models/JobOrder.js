const mongoose = require('mongoose');

const jobOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  jobNumber: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Paused'],
    default: 'Planned',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
  },
  productionStage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionStage',
  },
  plannedStartTime: {
    type: Date,
  },
  plannedEndTime: {
    type: Date,
  },
  actualStartTime: {
    type: Date,
  },
  actualEndTime: {
    type: Date,
  },
  plannedDuration: {
    type: Number, // in minutes
  },
  actualDuration: {
    type: Number, // in minutes
  },
  delays: [{
    reason: String,
    duration: Number, // in minutes
    timestamp: Date,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  totalWorkingTime: {
    type: Number, // dakika cinsinden
    default: 0
  },
  totalPausedTime: {
    type: Number, // dakika cinsinden
    default: 0
  },
  pauseHistory: [{
    startPauseTime: Date,
    endPauseTime: Date,
    pauseDuration: Number // dakika cinsinden
  }],
  workingTimeSegments: [{
    startTime: Date,
    endTime: Date,
    duration: Number // dakika cinsinden
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  productionTarget: {
    quantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['adet', 'metre', 'kg', 'ton', 'litre', 'cm', 'm2', 'm3', 'paket', 'kutu'],
      default: 'adet'
    }
  },
  producedQuantity: {
    quantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['adet', 'metre', 'kg', 'ton', 'litre', 'cm', 'm2', 'm3', 'paket', 'kutu'],
      default: 'adet'
    }
  },
  productionLine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine',
    default: null
  },
  productionLineDetails: {
    assignedMachines: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    }],
    assignedPersonnel: [{
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: [
          'Operatör', 
          'Teknisyen', 
          'Vardiya Amiri', 
          'Kalite Kontrol', 
          'Bakım Sorumlusu', 
          'Üretim Planlayıcısı'
        ]
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
jobOrderSchema.index({ status: 1 });
jobOrderSchema.index({ priority: 1 });
jobOrderSchema.index({ assignedTo: 1 });
jobOrderSchema.index({ machine: 1 });
jobOrderSchema.index({ productionStage: 1 });
jobOrderSchema.index({ orderNumber: 1 });
jobOrderSchema.index({ jobNumber: 1 });
jobOrderSchema.index({ department: 1 });

// Indexes for production target and produced quantity
jobOrderSchema.index({ 'productionTarget.quantity': 1 });
jobOrderSchema.index({ 'productionTarget.unit': 1 });
jobOrderSchema.index({ 'producedQuantity.quantity': 1 });
jobOrderSchema.index({ 'producedQuantity.unit': 1 });

// Add indexes for performance
jobOrderSchema.index({ productionLine: 1 });
jobOrderSchema.index({ 'productionLineDetails.assignedMachines': 1 });
jobOrderSchema.index({ 'productionLineDetails.assignedPersonnel.employee': 1 });

module.exports = mongoose.model('JobOrder', jobOrderSchema); 