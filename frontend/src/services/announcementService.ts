import api from './api';

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  type: 'announcement' | 'info' | 'update';
  readBy?: string[];
}

class AnnouncementService {
  async getAnnouncements(): Promise<Announcement[]> {
    const response = await api.get('/announcements');
    return response.data.data;
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    link?: string;
    type: 'announcement' | 'info' | 'update';
  }): Promise<Announcement> {
    const response = await api.post('/announcements', data);
    return response.data.data;
  }

  async markAsRead(id: string): Promise<Announcement> {
    const response = await api.put(`/announcements/${id}/read`);
    return response.data.data;
  }

  async markAllAsRead(): Promise<void> {
    const response = await api.put('/announcements/read-all');
    return response.data;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }

  async deleteAllAnnouncements(): Promise<void> {
    const response = await api.delete('/announcements/delete-all');
    return response.data;
  }

  async getAnnouncement(id: string): Promise<Announcement> {
    const response = await api.get(`/announcements/${id}`);
    return response.data.data;
  }

  async updateAnnouncement(id: string, data: {
    title: string;
    message: string;
    link?: string;
    type: 'announcement' | 'info' | 'update';
  }): Promise<Announcement> {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data.data;
  }

  async removeFromView(id: string): Promise<void> {
    const response = await api.put(`/announcements/${id}/remove-from-view`);
    return response.data;
  }
}

export default new AnnouncementService();