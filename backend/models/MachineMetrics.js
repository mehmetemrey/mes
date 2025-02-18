const mongoose = require('mongoose');

const machineMetricsSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    index: true,
  },
  machineCode: {
    type: String,
    index: true,
  },
  machineName: {
    type: String,
    index: true,
  },
  machineType: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Running', 'Operational', 'Maintenance', 'Breakdown', 'Idle'],
    required: true,
    index: true,
  },
  temperature: {
    type: Number,
    required: true,
    min: -50,
    max: 200,
  },
  rpm: {
    type: Number,
    required: true,
    min: 0,
    max: 5000,
  },
  power: {
    type: Number,
    required: true,
    min: 0,
    max: 50,
  },
  cycleTime: {
    type: Number,
    required: true,
    min: 0,
    max: 1000,
  },
  totalProduced: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  rejectedCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  isAlarmActive: {
    type: Boolean,
    default: false,
    index: true,
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
  },
  rejectionRate: {
    type: Number,
    min: 0,
    max: 100,
  },
  // Performance indicators
  performanceData: {
    oee: Number, // Overall Equipment Effectiveness
    availability: Number,
    performance: Number,
    quality: Number,
  },
  // Anomaly detection
  anomalies: [{
    type: {
      type: String,
      enum: ['temperature', 'rpm', 'power', 'cycle_time', 'rejection_rate', 'alarm', 'breakdown'],
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    message: String,
    detectedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Shift information
  shift: {
    shiftId: String,
    shiftName: String,
    startTime: Date,
    endTime: Date,
  },
  // Raw timestamp from data source
  sourceTimestamp: {
    type: Date,
    index: true,
  },
  // Additional metadata
  metadata: {
    dataSource: {
      type: String,
      default: 'websocket',
    },
    recordedBy: String,
    notes: String,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
machineMetricsSchema.index({ machineId: 1, createdAt: -1 });
machineMetricsSchema.index({ machineType: 1, createdAt: -1 });
machineMetricsSchema.index({ status: 1, createdAt: -1 });
machineMetricsSchema.index({ 'anomalies.severity': 1, createdAt: -1 });
machineMetricsSchema.index({ sourceTimestamp: -1 });
machineMetricsSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup (optional - remove old data after 1 year)
machineMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for calculated fields
machineMetricsSchema.virtual('uptimePercentage').get(function() {
  if (this.status === 'Running' || this.status === 'Operational') {
    return 100;
  } else if (this.status === 'Idle') {
    return 50;
  } else {
    return 0;
  }
});

// Static methods for reporting
machineMetricsSchema.statics.getPerformanceReport = function(machineId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        machineId: machineId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        avgTemperature: { $avg: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        minTemperature: { $min: '$temperature' },
        avgRpm: { $avg: '$rpm' },
        avgPower: { $avg: '$power' },
        avgCycleTime: { $avg: '$cycleTime' },
        totalProduced: { $sum: '$totalProduced' },
        totalRejected: { $sum: '$rejectedCount' },
        totalRecords: { $sum: 1 },
        uptimeRecords: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Running', 'Operational']] },
              1,
              0
            ]
          }
        },
        anomalyCount: { $sum: { $size: '$anomalies' } }
      }
    },
    {
      $addFields: {
        uptimePercentage: {
          $multiply: [
            { $divide: ['$uptimeRecords', '$totalRecords'] },
            100
          ]
        },
        rejectionRate: {
          $cond: [
            { $gt: ['$totalProduced', 0] },
            {
              $multiply: [
                { $divide: ['$totalRejected', '$totalProduced'] },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ]);
};

// Static method for trend analysis
machineMetricsSchema.statics.getTrendData = function(machineId, startDate, endDate, interval = 'hour') {
  const groupBy = interval === 'hour' ? 
    { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } } :
    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  return this.aggregate([
    {
      $match: {
        machineId: machineId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        avgTemperature: { $avg: '$temperature' },
        avgRpm: { $avg: '$rpm' },
        avgPower: { $avg: '$power' },
        avgCycleTime: { $avg: '$cycleTime' },
        totalProduced: { $sum: '$totalProduced' },
        totalRejected: { $sum: '$rejectedCount' },
        recordCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('MachineMetrics', machineMetricsSchema); 