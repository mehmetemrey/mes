const mongoose = require('mongoose');

const productionLineSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Location and Department
  location: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },

  // Capacity and Performance Metrics
  capacity: {
    type: Number,
    min: 0,
    default: 0
  },
  capacityUnit: {
    type: String,
    enum: ['adet/saat', 'kg/saat', 'metre/saat', 'litre/saat'],
    default: 'adet/saat'
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },

  // Machines in the Production Line
  machines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  }],

  // Production Stages
  productionStages: [{
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionStage'
    },
    sequence: {
      type: Number,
      required: true
    }
  }],

  // Personnel
  personnel: [{
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
    },
    assignmentType: {
      type: String,
      enum: ['Tam Zamanlı', 'Yarı Zamanlı', 'Vardiyalı']
    }
  }],

  // Current Status
  status: {
    type: String,
    enum: [
      'Aktif', 
      'Bakımda', 
      'Kapalı', 
      'Planlı Duruş', 
      'Arıza'
    ],
    default: 'Aktif'
  },

  // Performance Tracking
  performanceMetrics: {
    totalRunTime: {
      type: Number,
      default: 0 // Total running time in minutes
    },
    totalStopTime: {
      type: Number,
      default: 0 // Total stopped time in minutes
    },
    totalProductionTime: {
      type: Number,
      default: 0 // Total production time in minutes
    },
    oee: { // Overall Equipment Effectiveness
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Current and Recent Job Orders
  currentJobOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOrder'
  },
  recentJobOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOrder'
  }],

  // Maintenance and Downtime
  maintenanceHistory: [{
    type: {
      type: String,
      enum: ['Planlı Bakım', 'Arıza Bakımı', 'Periyodik Bakım']
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Quality Control
  qualityMetrics: {
    totalProduced: {
      type: Number,
      default: 0
    },
    totalPassed: {
      type: Number,
      default: 0
    },
    defectRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Shift Information
  currentShift: {
    type: {
      shiftNumber: Number,
      startTime: Date,
      endTime: Date,
      assignedTeam: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  },

  // Audit and Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to calculate production line utilization
productionLineSchema.virtual('utilization').get(function() {
  const { totalRunTime, totalProductionTime } = this.performanceMetrics;
  return totalRunTime > 0 
    ? (totalProductionTime / totalRunTime * 100).toFixed(2) 
    : 0;
});

// Indexes for performance
productionLineSchema.index({ department: 1 });
productionLineSchema.index({ status: 1 });
productionLineSchema.index({ 'personnel.employee': 1 });
productionLineSchema.index({ currentJobOrder: 1 });

// Pre-save hook to update OEE
productionLineSchema.pre('save', function(next) {
  // Basic OEE calculation (simplified)
  // OEE = Availability * Performance * Quality
  const { totalRunTime, totalProductionTime } = this.performanceMetrics;
  const { totalProduced, totalPassed } = this.qualityMetrics;

  const availability = totalRunTime > 0 
    ? (totalProductionTime / totalRunTime * 100) 
    : 0;
  
  const performance = totalProductionTime > 0 
    ? (totalProduced / (totalProductionTime / 60) * 100) 
    : 0;
  
  const quality = totalProduced > 0
    ? (totalPassed / totalProduced * 100)
    : 0;

  this.performanceMetrics.oee = 
    (availability * performance * quality) / 10000;

  next();
});

module.exports = mongoose.model('ProductionLine', productionLineSchema); 