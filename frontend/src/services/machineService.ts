import api from './api';

export interface Machine {
  _id: string;
  name: string;
  code: string;
  type: string;
  status: 'Operational' | 'Maintenance' | 'Breakdown' | 'Idle';
  specifications?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  warrantyEnd?: string;
  createdBy?: { _id: string; name: string; email: string };
  updatedBy?: { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
  department?: string | { _id: string; name: string; code: string };
}

export const machineService = {
  getMachines: async (filters?: { status?: string; type?: string }): Promise<Machine[]> => {
    const response = await api.get('/machines', { params: filters });
    return response.data;
  },

  getMachine: async (id: string): Promise<Machine> => {
    const response = await api.get(`/machines/${id}`);
    return response.data;
  },

  createMachine: async (data: Partial<Machine>): Promise<Machine> => {
    const response = await api.post('/machines', data);
    return response.data;
  },

  updateMachine: async (id: string, data: Partial<Machine>): Promise<Machine> => {
    const response = await api.put(`/machines/${id}`, data);
    return response.data;
  },

  deleteMachine: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/machines/${id}`);
    return response.data;
  },

  updateMachineStatus: async (id: string, status: Machine['status']): Promise<Machine> => {
    const response = await api.patch(`/machines/${id}/status`, { status });
    return response.data;
  },
};
