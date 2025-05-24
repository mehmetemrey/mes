import api from './api';
import Cookies from 'js-cookie';

export interface JobOrder {
  _id: string;
  orderNumber: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled' | 'Paused';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string | { _id: string; firstName: string; lastName: string; email: string };
  machine?: string | { _id: string; name: string; type: string };
  productionStage?: string | { _id: string; name: string; sequence: number };
  plannedStartTime?: string;
  plannedEndTime?: string;
  plannedDuration?: number; // dakika cinsinden
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number; // dakika cinsinden
  totalWorkingTime?: number; // dakika cinsinden
  totalPausedTime?: number; // dakika cinsinden
  workingTimeSegments?: Array<{
    startTime: string;
    endTime?: string;
    duration: number; // dakika cinsinden
  }>;
  pauseHistory?: Array<{
    startPauseTime: string;
    endPauseTime?: string;
    pauseDuration: number; // dakika cinsinden
  }>;
  delays?: Array<{
    reason: string;
    duration: number; // dakika cinsinden
    timestamp: string;
  }>;
  createdBy?: { _id: string; firstName: string; lastName: string; email: string };
  updatedBy?: { _id: string; firstName: string; lastName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
  department?: string | { _id: string; name: string; code: string };
  productionTarget?: {
    quantity: number;
    unit: 'adet' | 'metre' | 'kg' | 'ton' | 'litre' | 'cm' | 'm2' | 'm3' | 'paket' | 'kutu';
  };
  producedQuantity?: {
    quantity: number;
    unit: 'adet' | 'metre' | 'kg' | 'ton' | 'litre' | 'cm' | 'm2' | 'm3' | 'paket' | 'kutu';
  };
  targetQuantity?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface JobOrderListResponse {
  jobOrders: JobOrder[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const jobOrderService = {
  getJobOrders: async (params?: {
    status?: string;
    assignedTo?: string;
    machine?: string;
    productionStage?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<JobOrderListResponse> => {
    const response = await api.get('/job-orders', { params });
    return response.data;
  },

  // Tekil iş emri getir
  getJobOrder: async (id: string): Promise<JobOrder> => {
    try {
      const response = await api.get(`/job-orders/${id}`);
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(error.response.data.message || 'İş emri bulunamadı.');
      }
      throw error;
    }
  },

  // Yeni iş emri oluştur
  createJobOrder: async (data: Partial<JobOrder>): Promise<JobOrder> => {
    const response = await api.post('/job-orders', data);
    return response.data;
  },

  // İş emrini güncelle
  updateJobOrder: async (id: string, data: Partial<JobOrder>): Promise<JobOrder> => {
    const response = await api.put(`/job-orders/${id}`, data);
    return response.data;
  },

  // İş emrini sil
  deleteJobOrder: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/job-orders/${id}`);
    return response.data;
  },

  // İş emri durumunu güncelle
  updateJobStatus: async (id: string, status: JobOrder['status']) => {
    const response = await api.patch(`/job-orders/${id}/status`, { status });
    return response.data;
  },

  // Gecikme ekle
  addDelay: async (id: string, reason: string, duration: number): Promise<JobOrder> => {
    const response = await api.post(
      `/job-orders/${id}/delays`,
      { reason, duration }
    );
    return response.data;
  },

  startJob: async (id: string) => {
    const response = await api.patch(`/job-orders/${id}/status`, { status: 'In Progress' });
    return response.data;
  },

  stopJob: async (id: string) => {
    const response = await api.patch(`/job-orders/${id}/stop`);
    return response.data;
  },

  pauseJob: async (id: string) => {
    const response = await api.patch(`/job-orders/${id}/status`, { 
      status: 'Paused'
    });
    return response.data;
  },
};
