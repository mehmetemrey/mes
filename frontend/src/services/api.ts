import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({ 
  baseURL: process.env.API_URL || (process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:5055/api'),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    } else if (error.response?.status === 403) {
      console.warn('Erişim yetkisi yetersiz (403):', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

export default api;
