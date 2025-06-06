import api from './api';

interface Machine {
  _id: string;
  name: string;
  code: string;
  type: string;
  department?: {
    name: string;
  };
}

interface ReportData {
  machine?: any;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  performance?: any;
  trends?: any[];
  anomalies?: any[];
}

interface FactoryReportData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  overall: any;
  machinePerformance: any[];
  shiftPerformance: any[];
}

interface AnomalyReportData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    severity: string;
    machineId: string;
  };
  summary: any[];
  anomalies: any[];
}

interface CollectionStatus {
  collection: {
    isCollecting: boolean;
    connectedToWebSocket: boolean;
    machinesTracked: number;
    reconnectAttempts: number;
    lastUpdate: string | null;
  };
  database: {
    recordsLast24Hours: number;
    totalRecords: number;
  };
}

class ReportsService {
  async getMachines(): Promise<Machine[]> {
    const response = await api.get('/reports/machines');
    return response.data.data;
  }

  async getMachinePerformanceReport(
    machineId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ReportData> {
    const response = await api.get(`/reports/machine/${machineId}/performance`, {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getFactoryPerformanceReport(
    startDate: string, 
    endDate: string
  ): Promise<FactoryReportData> {
    const response = await api.get('/reports/factory/performance', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getAnomalyReport(
    startDate: string, 
    endDate: string,
    severity?: string,
    machineId?: string
  ): Promise<AnomalyReportData> {
    const params: Record<string, string> = { startDate, endDate };
    if (severity) params.severity = severity;
    if (machineId) params.machineId = machineId;
    
    const response = await api.get('/reports/anomalies', { params });
    return response.data.data;
  }

  async getCollectionStatus(): Promise<CollectionStatus> {
    const response = await api.get('/reports/collection/status');
    return response.data.data;
  }

  async startMetricsCollection(): Promise<{ message: string }> {
    const response = await api.post('/reports/collection/start');
    return response.data;
  }

  async stopMetricsCollection(): Promise<{ message: string }> {
    const response = await api.post('/reports/collection/stop');
    return response.data;
  }
}

const reportsService = new ReportsService();
export default reportsService;