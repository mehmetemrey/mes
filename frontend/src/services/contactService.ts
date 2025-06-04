import api from './api';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied';
  createdAt: string;
  updatedAt: string;
}

export interface ContactReply {
  reply: string;
}

export const contactService = {
  // İletişim formu gönder
  submitContactForm: async (formData: ContactFormData) => {
    try {
      const response = await api.post('/contact', formData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'İletişim formu gönderilemedi');
    }
  },

  // Tüm iletişim formlarını getir (admin için)
  getAllContacts: async () => {
    try {
      const response = await api.get('/contact');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'İletişim formları getirilemedi');
    }
  },

  // İletişim formu durumunu güncelle (admin için)
  updateContactStatus: async (id: string, status: 'pending' | 'read' | 'replied') => {
    try {
      const response = await api.put(`/contact/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'İletişim formu durumu güncellenemedi');
    }
  },

  // İletişim formuna yanıt gönder (admin için)
  sendReply: async (id: string, replyData: ContactReply) => {
    try {
      const response = await api.post(`/contact/${id}/reply`, replyData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Yanıt gönderilemedi');
    }
  },

  // İletişim formunu sil (admin için)
  deleteContact: async (id: string) => {
    try {
      const response = await api.delete(`/contact/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'İletişim formu silinemedi');
    }
  }
};

export default contactService; 