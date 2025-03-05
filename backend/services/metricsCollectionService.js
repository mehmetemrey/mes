const MachineMetrics = require('../models/MachineMetrics');

class MetricsCollectionService {
  constructor() {
    this.isCollecting = false;
    this.collectionInterval = null;
    this.lastMetricsData = new Map();
  }

  async startCollection() {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      this.saveCurrentMetrics();
    }, 10000);
  }

  stopCollection() {
    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  processMetricsData(data) {
    if (Array.isArray(data)) {
      data.forEach(machineData => this.updateMachineMetrics(machineData));
    } else if (data && data.machineId) {
      this.updateMachineMetrics(data);
    }
  }

  updateMachineMetrics(machineData) {
    if (!machineData || (!machineData.machineId && !machineData.machineCode)) return;
    const processedData = this.enrichMetricsData(machineData);
    this.lastMetricsData.set(machineData.machineId, processedData);
  }

  enrichMetricsData(data) {
    const enriched = { ...data };

    if (enriched.totalProduced > 0) {
      enriched.rejectionRate = (enriched.rejectedCount / enriched.totalProduced) * 100;
      enriched.efficiency = Math.max(0, 100 - enriched.rejectionRate);
    } else {
      enriched.rejectionRate = 0;
      enriched.efficiency = 0;
    }

    const availability = this.calculateAvailability(enriched.status);
    const performance = this.calculatePerformance(enriched);
    const quality = this.calculateQuality(enriched);

    enriched.performanceData = {
      oee: (availability * performance * quality) / 10000,
      availability,
      performance,
      quality
    };

    enriched.anomalies = this.detectAnomalies(enriched);
    enriched.shift = this.getCurrentShiftInfo();
    enriched.sourceTimestamp = new Date(enriched.timestamp || Date.now());

    return enriched;
  }

  calculateAvailability(status) {
    switch (status) {
      case 'Running':
      case 'Operational':
        return 100;
      case 'Idle':
        return 50;
      case 'Maintenance':
        return 25;
      case 'Breakdown':
        return 0;
      default:
        return 75;
    }
  }

  calculatePerformance(data) {
    if (data.cycleTime > 0) {
      const idealCycleTime = 60;
      return Math.min(100, (idealCycleTime / data.cycleTime) * 100);
    }
    return 100;
  }

  calculateQuality(data) {
    if (data.totalProduced > 0) {
      const goodParts = data.totalProduced - data.rejectedCount;
      return (goodParts / data.totalProduced) * 100;
    }
    return 100;
  }

  detectAnomalies(data) {
    const anomalies = [];

    if (data.temperature > 85) {
      anomalies.push({
        type: 'temperature',
        severity: data.temperature > 95 ? 'critical' : 'high',
        message: `High temperature: ${data.temperature}°C`,
        detectedAt: new Date()
      });
    } else if (data.temperature < 10) {
      anomalies.push({
        type: 'temperature',
        severity: 'medium',
        message: `Low temperature: ${data.temperature}°C`,
        detectedAt: new Date()
      });
    }

    if (data.rpm > 2800) {
      anomalies.push({
        type: 'rpm',
        severity: 'high',
        message: `High RPM: ${data.rpm}`,
        detectedAt: new Date()
      });
    } else if (data.rpm < 100 && data.status === 'Running') {
      anomalies.push({
        type: 'rpm',
        severity: 'medium',
        message: `Low RPM: ${data.rpm}`,
        detectedAt: new Date()
      });
    }

    if (data.power > 9.5) {
      anomalies.push({
        type: 'power',
        severity: 'high',
        message: `High power consumption: ${data.power}kW`,
        detectedAt: new Date()
      });
    }

    if (data.cycleTime > 120) {
      anomalies.push({
        type: 'cycle_time',
        severity: 'medium',
        message: `Long cycle time: ${data.cycleTime}s`,
        detectedAt: new Date()
      });
    }

    if (data.rejectionRate > 15) {
      anomalies.push({
        type: 'rejection_rate',
        severity: data.rejectionRate > 25 ? 'high' : 'medium',
        message: `High rejection rate: ${data.rejectionRate.toFixed(1)}%`,
        detectedAt: new Date()
      });
    }

    if (data.isAlarmActive) {
      anomalies.push({
        type: 'alarm',
        severity: 'high',
        message: 'Machine alarm is active',
        detectedAt: new Date()
      });
    }

    if (data.status === 'Breakdown') {
      anomalies.push({
        type: 'breakdown',
        severity: 'critical',
        message: 'Machine is in breakdown state',
        detectedAt: new Date()
      });
    }

    return anomalies;
  }

  getCurrentShiftInfo() {
    const now = new Date();
    const hour = now.getHours();

    let shiftInfo = {
      shiftId: '',
      shiftName: '',
      startTime: new Date(),
      endTime: new Date()
    };

    if (hour >= 6 && hour < 14) {
      shiftInfo.shiftId = 'morning';
      shiftInfo.shiftName = 'Sabah Vardiyası';
      shiftInfo.startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
      shiftInfo.endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
    } else if (hour >= 14 && hour < 22) {
      shiftInfo.shiftId = 'afternoon';
      shiftInfo.shiftName = 'Öğleden Sonra Vardiyası';
      shiftInfo.startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
      shiftInfo.endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0);
    } else {
      shiftInfo.shiftId = 'night';
      shiftInfo.shiftName = 'Gece Vardiyası';
      shiftInfo.startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0);
      shiftInfo.endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0);
    }

    return shiftInfo;
  }

  async saveCurrentMetrics() {
    if (this.lastMetricsData.size === 0) return;

    const promises = [];
    for (const [, data] of this.lastMetricsData) {
      promises.push(this.saveMachineMetrics(data));
    }

    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
      if (failed.length > 0) {
        const errorMsgs = failed.map(r => r.value?.error?.message || r.value?.error || r.reason);
        console.warn(`Metrics save warning: ${failed.length} machine metrics failed to save:`, errorMsgs[0]);
      }
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  async saveMachineMetrics(data) {
    try {
      const metricsRecord = new MachineMetrics({
        machineId: data.machineId,
        machineCode: data.machineCode,
        machineName: data.machineName,
        machineType: data.machineType,
        status: data.status,
        temperature: data.temperature,
        rpm: data.rpm,
        power: data.power,
        cycleTime: data.cycleTime,
        totalProduced: data.totalProduced,
        rejectedCount: data.rejectedCount,
        isAlarmActive: data.isAlarmActive,
        efficiency: data.efficiency,
        rejectionRate: data.rejectionRate,
        performanceData: data.performanceData,
        anomalies: data.anomalies,
        shift: data.shift,
        sourceTimestamp: data.sourceTimestamp,
        metadata: {
          dataSource: 'websocket',
          recordedBy: 'metrics-collector'
        }
      });

      await metricsRecord.save();
      return { success: true, machineId: data.machineId };
    } catch (error) {
      return { success: false, machineId: data.machineId, error };
    }
  }

  getStatus() {
    return {
      isCollecting: this.isCollecting,
      machinesTracked: this.lastMetricsData.size,
      lastUpdate: Array.from(this.lastMetricsData.values())[0]?.sourceTimestamp || null
    };
  }
}

const metricsCollectionService = new MetricsCollectionService();

module.exports = metricsCollectionService;
