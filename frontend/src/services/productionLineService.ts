import api from './api';

// Type definitions for Production Line
export interface ProductionLinePersonnel {
  employee: string;
  role: 'Operatör' | 'Teknisyen' | 'Vardiya Amiri' | 'Kalite Kontrol' | 'Bakım Sorumlusu' | 'Üretim Planlayıcısı';
  assignmentType: 'Tam Zamanlı' | 'Yarı Zamanlı' | 'Vardiyalı';
}

export interface ProductionLineQualityMetrics {
  totalProduced: number;
  totalPassed: number;
  defectRate?: number;
}

export interface ProductionLinePerformanceMetrics {
  totalRunTime: number;
  totalStopTime: number;
  totalProductionTime: number;
  oee: number;
}

export interface ProductionLine {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  department: string;
  capacity?: number;
  capacityUnit?: 'adet/saat' | 'kg/saat' | 'metre/saat' | 'litre/saat';
  efficiency?: number;
  status?: 'Aktif' | 'Bakımda' | 'Kapalı' | 'Planlı Duruş' | 'Arıza';
  machines?: string[];
  personnel?: ProductionLinePersonnel[];
  qualityMetrics?: ProductionLineQualityMetrics;
  performanceMetrics?: ProductionLinePerformanceMetrics;
  currentJobOrder?: string;
}

export interface ProductionLineFilter {
  department?: string;
  status?: string;
  machines?: string | string[];
}

export interface ProductionLinePagination {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductionLinesResponse {
  success: boolean;
  productionLines: ProductionLine[];
  total: number;
  page: number;
  totalPages: number;
  message?: string;
}

class ProductionLineService {
  // Create a new production line
  async createProductionLine(data: ProductionLine) {
    try {
      const response = await api.post('/production-lines', data, {
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 400;
        }
      });

      if (!response.data.success) {
        const errorMessage = response.data.message || 
                             response.data.error || 
                             'Failed to create production line';
        
        throw new Error(errorMessage);
      }

    return response.data;
    } catch (error: any) {
      console.error('Production Line Creation Error:', error);
      
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error Request:', error.request);
      } else {
        console.error('Error Message:', error.message);
      }

      throw error;
    }
  }

  // Get all production lines with optional filtering and pagination
  async getProductionLines(
    filters?: ProductionLineFilter, 
    pagination?: ProductionLinePagination
  ): Promise<ProductionLinesResponse> {
    try {
    const params = {
      ...filters,
      ...pagination
    };

      if (params.machines && Array.isArray(params.machines)) {
        params.machines = params.machines.join(',');
      }

      const response = await api.get('/production-lines', { 
        params,
        validateStatus: function (status) {
          return (status >= 200 && status < 300) || status === 400;
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch production lines');
      }

      return {
        success: true,
        productionLines: response.data.productionLines || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Production Lines Fetch Error:', error);
      
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error Request:', error.request);
      } else {
        console.error('Error Message:', error.message);
      }

      throw error;
    }
  }

  // Get a single production line by ID
  async getProductionLineById(id: string) {
    const response = await api.get(`/production-lines/${id}`);
    const productionLine = response.data;

    if (productionLine.department && typeof productionLine.department === 'object') {
      productionLine.department = productionLine.department._id;
    }

    if (productionLine.machines) {
      productionLine.machines = productionLine.machines.map((machine: any) => 
        typeof machine === 'object' ? machine._id : machine
      );
    }

    return productionLine;
  }

  // Update a production line
  async updateProductionLine(id: string, data: Partial<ProductionLine>) {
    const response = await api.put(`/production-lines/${id}`, data);
    return response.data;
  }

  // Delete a production line
  async deleteProductionLine(id: string) {
    const response = await api.delete(`/production-lines/${id}`);
    return response.data;
  }

  // Assign job order to production line
  async assignJobOrder(id: string, jobOrderId: string) {
    const response = await api.post(`/production-lines/${id}/job-order`, { jobOrderId });
    return response.data;
  }

  // Assign personnel to production line
  async assignPersonnel(id: string, personnel: ProductionLinePersonnel[]) {
    const response = await api.post(`/production-lines/${id}/personnel`, { personnel });
    return response.data;
  }

  // Record maintenance
  async recordMaintenance(id: string, maintenanceData: any) {
    const response = await api.post(`/production-lines/${id}/maintenance`, maintenanceData);
    return response.data;
  }

  // Update quality metrics
  async updateQualityMetrics(id: string, metricsData: ProductionLineQualityMetrics) {
    const response = await api.post(`/production-lines/${id}/quality-metrics`, metricsData);
    return response.data;
  }

  // Start shift
  async startShift(id: string, shiftData: any) {
    const response = await api.post(`/production-lines/${id}/start-shift`, shiftData);
    return response.data;
  }
}

// Export a singleton instance of the service
const productionLineService = new ProductionLineService();
export default productionLineService; 