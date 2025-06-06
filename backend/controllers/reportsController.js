const MachineMetrics = require('../models/MachineMetrics');
const Machine = require('../models/Machine');
const metricsCollectionService = require('../services/metricsCollectionService');

// Get performance report for a specific machine
const getMachinePerformanceReport = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get machine info
    const machine = await Machine.findById(machineId).populate('department');
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Get performance report using static method
    const performanceReport = await MachineMetrics.getPerformanceReport(machineId, start, end);
    
    // Get trend data
    const trendData = await MachineMetrics.getTrendData(machineId, start, end, 'hour');
    
    // Get anomaly summary
    const anomalySummary = await MachineMetrics.aggregate([
      {
        $match: {
          machineId: machineId,
          createdAt: { $gte: start, $lte: end },
          anomalies: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$anomalies' },
      {
        $group: {
          _id: {
            type: '$anomalies.type',
            severity: '$anomalies.severity'
          },
          count: { $sum: 1 },
          latestOccurrence: { $max: '$anomalies.detectedAt' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          severities: {
            $push: {
              severity: '$_id.severity',
              count: '$count',
              latestOccurrence: '$latestOccurrence'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        machine: {
          id: machine._id,
          name: machine.name,
          code: machine.code,
          type: machine.type,
          department: machine.department?.name || 'Unassigned'
        },
        dateRange: {
          startDate: start,
          endDate: end
        },
        performance: performanceReport[0] || {},
        trends: trendData,
        anomalies: anomalySummary
      }
    });

  } catch (error) {
    console.error('Error generating machine performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get overall factory performance report
const getFactoryPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get overall metrics for all machines
    const overallMetrics = await MachineMetrics.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalMachines: { $addToSet: '$machineId' },
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgPower: { $avg: '$power' },
          totalProduced: { $sum: '$totalProduced' },
          totalRejected: { $sum: '$rejectedCount' },
          totalRecords: { $sum: 1 },
          operationalRecords: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Running', 'Operational']] },
                1,
                0
              ]
            }
          },
          avgOee: { $avg: '$performanceData.oee' },
          totalAnomalies: { $sum: { $size: '$anomalies' } }
        }
      },
      {
        $addFields: {
          machineCount: { $size: '$totalMachines' },
          overallUptime: {
            $multiply: [
              { $divide: ['$operationalRecords', '$totalRecords'] },
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

    // Get machine-wise performance summary
    const machinePerformance = await MachineMetrics.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            machineId: '$machineId',
            machineName: '$machineName',
            machineType: '$machineType'
          },
          avgTemperature: { $avg: '$temperature' },
          avgPower: { $avg: '$power' },
          totalProduced: { $sum: '$totalProduced' },
          totalRejected: { $sum: '$rejectedCount' },
          avgOee: { $avg: '$performanceData.oee' },
          uptimeRecords: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Running', 'Operational']] },
                1,
                0
              ]
            }
          },
          totalRecords: { $sum: 1 },
          anomaliesCount: { $sum: { $size: '$anomalies' } }
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
      },
      { $sort: { '_id.machineName': 1 } }
    ]);

    // Get shift-wise performance
    const shiftPerformance = await MachineMetrics.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$shift.shiftName',
          totalProduced: { $sum: '$totalProduced' },
          totalRejected: { $sum: '$rejectedCount' },
          avgOee: { $avg: '$performanceData.oee' },
          machineCount: { $addToSet: '$machineId' },
          anomaliesCount: { $sum: { $size: '$anomalies' } }
        }
      },
      {
        $addFields: {
          machineCount: { $size: '$machineCount' },
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
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        dateRange: {
          startDate: start,
          endDate: end
        },
        overall: overallMetrics[0] || {},
        machinePerformance,
        shiftPerformance
      }
    });

  } catch (error) {
    console.error('Error generating factory performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get anomaly report
const getAnomalyReport = async (req, res) => {
  try {
    const { startDate, endDate, severity, machineId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const matchCriteria = {
      createdAt: { $gte: start, $lte: end },
      anomalies: { $exists: true, $ne: [] }
    };

    if (machineId) {
      matchCriteria.machineId = machineId;
    }

    const pipeline = [
      { $match: matchCriteria },
      { $unwind: '$anomalies' }
    ];

    if (severity) {
      pipeline.push({
        $match: { 'anomalies.severity': severity }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            machineId: '$machineId',
            machineName: '$machineName',
            type: '$anomalies.type',
            severity: '$anomalies.severity'
          },
          count: { $sum: 1 },
          latestOccurrence: { $max: '$anomalies.detectedAt' },
          firstOccurrence: { $min: '$anomalies.detectedAt' },
          messages: { $addToSet: '$anomalies.message' }
        }
      },
      {
        $group: {
          _id: {
            machineId: '$_id.machineId',
            machineName: '$_id.machineName'
          },
          anomalies: {
            $push: {
              type: '$_id.type',
              severity: '$_id.severity',
              count: '$count',
              latestOccurrence: '$latestOccurrence',
              firstOccurrence: '$firstOccurrence',
              messages: '$messages'
            }
          },
          totalAnomalies: { $sum: '$count' }
        }
      },
      { $sort: { totalAnomalies: -1 } }
    );

    const anomalyReport = await MachineMetrics.aggregate(pipeline);

    // Get summary statistics
    const summary = await MachineMetrics.aggregate([
      { $match: matchCriteria },
      { $unwind: '$anomalies' },
      severity ? { $match: { 'anomalies.severity': severity } } : null,
      {
        $group: {
          _id: '$anomalies.severity',
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ].filter(Boolean));

    res.json({
      success: true,
      data: {
        dateRange: {
          startDate: start,
          endDate: end
        },
        filters: {
          severity: severity || 'all',
          machineId: machineId || 'all'
        },
        summary,
        anomalies: anomalyReport
      }
    });

  } catch (error) {
    console.error('Error generating anomaly report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get real-time metrics collection status
const getCollectionStatus = async (req, res) => {
  try {
    const status = metricsCollectionService.getStatus();
    
    // Get latest metrics count from database
    const latestMetricsCount = await MachineMetrics.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    res.json({
      success: true,
      data: {
        collection: status,
        database: {
          recordsLast24Hours: latestMetricsCount,
          totalRecords: await MachineMetrics.countDocuments()
        }
      }
    });

  } catch (error) {
    console.error('Error getting collection status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Start metrics collection
const startMetricsCollection = async (req, res) => {
  try {
    await metricsCollectionService.startCollection();
    res.json({
      success: true,
      message: 'Metrics collection started successfully'
    });
  } catch (error) {
    console.error('Error starting metrics collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start metrics collection',
      error: error.message
    });
  }
};

// Stop metrics collection
const stopMetricsCollection = async (req, res) => {
  try {
    metricsCollectionService.stopCollection();
    res.json({
      success: true,
      message: 'Metrics collection stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping metrics collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop metrics collection',
      error: error.message
    });
  }
};

// Get machine list for reporting
const getMachinesForReporting = async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate('department', 'name')
      .select('name code type status department')
      .sort('name');

    res.json({
      success: true,
      data: machines
    });

  } catch (error) {
    console.error('Error getting machines for reporting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getMachinePerformanceReport,
  getFactoryPerformanceReport,
  getAnomalyReport,
  getCollectionStatus,
  startMetricsCollection,
  stopMetricsCollection,
  getMachinesForReporting
}; 