import api from './api';

export interface ProductionStage {
  _id: string;
  name: string;
  description: string;
  sequence: number;
  isActive: boolean;
  requiredRoles: string[] | { _id: string; name: string }[];
  createdBy?: { _id: string; name: string; email: string };
  updatedBy?: { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
  estimatedDuration?: number;
  department?: string | { _id: string; name: string; code: string };
}

export const productionStageService = {
  getProductionStages: async (isActive?: boolean): Promise<ProductionStage[]> => {
    const params = isActive !== undefined ? { isActive } : undefined;
    const response = await api.get('/production-stages', { params });
    return response.data;
  },

  getProductionStage: async (id: string): Promise<ProductionStage> => {
    const response = await api.get(`/production-stages/${id}`);
    return response.data;
  },

  createProductionStage: async (data: Partial<ProductionStage>): Promise<ProductionStage> => {
    const response = await api.post('/production-stages', data);
    return response.data;
  },

  updateProductionStage: async (id: string, data: Partial<ProductionStage>): Promise<ProductionStage> => {
    const response = await api.put(`/production-stages/${id}`, data);
    return response.data;
  },

  deleteProductionStage: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/production-stages/${id}`);
    return response.data;
  },

  updateProductionStageStatus: async (id: string, isActive: boolean): Promise<ProductionStage> => {
    const response = await api.patch(`/production-stages/${id}/status`, { isActive });
    return response.data;
  },
};
