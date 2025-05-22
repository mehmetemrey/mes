import api from './api';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  manager?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  parentDepartment?: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  location?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  workingHours?: {
    start?: string;
    end?: string;
  };
  type: 'production' | 'quality' | 'maintenance' | 'warehouse' | 'hr' | 'planning' | 'management' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentHierarchy extends Department {
  children: DepartmentHierarchy[];
}

export interface DepartmentDetail extends Department {
  employees: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: Array<{
      _id: string;
      name: string;
      description: string;
    }>;
  }>;
  roles: Array<{
    _id: string;
    name: string;
    description: string;
    permissions: Array<{
      _id: string;
      name: string;
      description: string;
    }>;
  }>;
}

const departmentService = {
  // Get all departments
  getDepartments: async (): Promise<Department[]> => {
    const response = await api.get('/departments');
    return response.data;
  },

  // Get department hierarchy
  getDepartmentHierarchy: async (): Promise<DepartmentHierarchy[]> => {
    const response = await api.get('/departments/hierarchy');
    return response.data;
  },

  // Get department by ID
  getDepartment: async (id: string): Promise<Department> => {
    const response = await api.get(`/departments/${id}`);
    return response.data.department;
  },

  // Create new department
  createDepartment: async (departmentData: Partial<Department>): Promise<Department> => {
    const response = await api.post('/departments', departmentData);
    return response.data.department;
  },

  // Update department
  updateDepartment: async (id: string, departmentData: Partial<Department>): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data.department;
  },

  // Delete department
  deleteDepartment: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  }
};

export default departmentService; 