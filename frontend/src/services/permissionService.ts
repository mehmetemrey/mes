import api from './api';

export interface Permission {
  _id: string;
  name: string;
  description: string;
  module: 'production' | 'quality' | 'maintenance' | 'warehouse' | 'hr' | 'planning' | 'reports' | 'system';
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage';
  createdAt: string;
  updatedAt: string;
}

export const permissionService = {
  getPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/permissions');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'İzinler alınamadı');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'İzinler alınamadı');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  }
};

export default permissionService; 