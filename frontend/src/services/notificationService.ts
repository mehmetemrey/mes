import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  read: boolean;
  link?: string;
  createdAt: string;
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data.data;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.data;
  }

  async toggleReadStatus(id: string): Promise<Notification> {
    const response = await api.put(`/notifications/${id}/toggle-read`);
    return response.data.data;
  }

  async markAllAsRead(): Promise<void> {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string): Promise<void> {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }

  async deleteAllNotifications(): Promise<void> {
    const response = await api.delete('/notifications/delete-all');
    return response.data;
  }
}

export default new NotificationService(); 