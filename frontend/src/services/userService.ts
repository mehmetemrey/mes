import api from './api';

export interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  roles: any[];
  isActive: boolean;
  lastLogin: string;
  department?: { _id: string; name: string; code: string };
}

export const userService = {
  // Tüm kullanıcıları getir
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      if (response.data.success) {
        return response.data.data.users.map((user: User) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`
        }));
      }
      throw new Error(response.data.message || 'Kullanıcılar alınamadı');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Kullanıcılar alınamadı');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  },

  // Kullanıcı ekle
  createUser: async (userData: Partial<User>) => {
    try {
      const response = await api.post('/auth/register-without-password', userData);
      if (response.data.user) {
        return response.data.user;
      }
      throw new Error(response.data.message || 'Kullanıcı eklenemedi');
    } catch (error: any) {
      if (error.response?.data) {
        // Backend'den gelen hata mesajını kullan
        const errorMessage = error.response.data.message;
        if (errorMessage === 'Bu email veya telefon zaten kullanımda') {
          throw new Error('Bu email adresi veya telefon numarası başka bir kullanıcı tarafından kullanılıyor. Lütfen farklı bir email adresi veya telefon numarası deneyin.');
        }
        throw new Error(errorMessage || 'Kullanıcı eklenemedi');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  },

  // Kullanıcı güncelle
  updateUser: async (userId: string, userData: Partial<User>) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      if (response.data.success) {
        return response.data.data.user;
      }
      throw new Error(response.data.message || 'Kullanıcı güncellenemedi');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Kullanıcı güncellenemedi');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  },

  // Kullanıcı sil
  deleteUser: async (userId: string) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data.success) {
        return true;
      }
      throw new Error(response.data.message || 'Kullanıcı silinemedi');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Kullanıcı silinemedi');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  },

  // Kullanıcı getir
  getUser: async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      if (response.data.success) {
        const user = response.data.data.user;
        return {
          ...user,
          id: user._id,
          fullName: `${user.firstName} ${user.lastName}`,
          roles: user.roles?.map((role: any) => role._id),
          department: user.department
        };
      }
      throw new Error(response.data.message || 'Kullanıcı alınamadı');
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Kullanıcı alınamadı');
      }
      throw new Error('Sunucuya bağlanılamadı');
    }
  },
};

export default userService; 