import api from './api';
import Cookies from 'js-cookie';
import { User } from './userService';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
      permissions: string[];
      phone: string;
      isActive: boolean;
    };
  };
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export interface SetupPasswordResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

// Kimlik doğrulama işlemleri
export const authService = {
  // Giriş işlemi
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.data.token) {
        Cookies.set('token', response.data.data.token);
      }
      return response.data;
    } catch (error: any) {
      // Backend'den gelen hata mesajını kullan
      const errorMessage = error.response?.data?.message || 'Giriş yapılamadı';
      throw new Error(errorMessage);
    }
  },  
  // Oturumu kontrol et
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Oturum geçersiz');
    } catch (error) {
      throw new Error('Oturum geçersiz');
    }
  },

  // Çıkış yap
  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
  },

  registerWithoutPassword: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    roles: string[];
  }): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register-without-password', userData);
    return response.data;
  },

  setupPassword: async (token: string, password: string): Promise<SetupPasswordResponse> => {
    const response = await api.post('/auth/setup-password', { token, password });
    if (response.data.token) {
      Cookies.set('token', response.data.token);
    }
    return response.data;
  },

  updateProfile: async (userData: Partial<User>) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  validateResetToken: async (token: string) => {
    try {
      const response = await api.post('/auth/validate-reset-token', { token });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.');
    }
  },

  verifyCurrentPassword: async (currentPassword: string) => {
    try {
      const response = await api.post('/auth/verify-current-password', { currentPassword });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Şifre doğrulanamadı');
    }
  },

  sendPasswordChangeCode: async () => {
    try {
      const response = await api.post('/auth/send-password-change-code');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Doğrulama kodu gönderilemedi');
    }
  },

  verifyAndChangePassword: async (data: { code: string; newPassword: string }) => {
    try {
      const response = await api.post('/auth/verify-and-change-password', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Şifre değiştirilemedi');
    }
  },

  verifyResetCode: async (data: { email: string; code: string }) => {
    try {
      const response = await api.post('/auth/verify-reset-code', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Doğrulama kodu geçersiz');
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Şifre sıfırlama kodu gönderilemedi');
    }
  },

  resetPassword: async (data: { email: string; code: string; newPassword: string }) => {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Şifre sıfırlanamadı');
    }
  }
};

export default authService;
