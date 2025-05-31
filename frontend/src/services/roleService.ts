import api from './api';

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: {
    _id: string;
    name: string;
    description: string;
  }[];
  level: number;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  parentRole?: {
    _id: string;
    name: string;
    description: string;
  };
  scope: 'global' | 'department' | 'team';
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  level: number;
  department?: string;
  parentRole?: string;
  scope: 'global' | 'department' | 'team';
  isActive: boolean;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  isActive?: boolean;
}

// Rol servisi
export const roleService = {
  // Tüm rolleri getir
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },

  // Rol detayı getir
  getRole: async (id: string): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  // Yeni rol oluştur
  createRole: async (roleData: CreateRoleData): Promise<Role> => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },

  // Rol güncelle
  updateRole: async (id: string, roleData: UpdateRoleData): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },

  // Rol sil
  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  // Role izin ekle
  addPermissionToRole: async (roleId: string, permissionId: string): Promise<Role> => {
    const response = await api.post(`/roles/${roleId}/permissions`, { permissionId });
    return response.data;
  },

  // Rolden izin kaldır
  removePermissionFromRole: async (roleId: string, permissionId: string): Promise<Role> => {
    const response = await api.delete(`/roles/${roleId}/permissions`, { data: { permissionId } });
    return response.data;
  }
};

export default roleService; 