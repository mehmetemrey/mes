import { io } from 'socket.io-client';
import { notification } from 'antd';
import { Notification } from './notificationService';
import { Announcement } from './announcementService';

// Add event emitter for components to subscribe to notification events
type EventCallback = (data: any) => void;

// Map our notification types to antd notification types
const mapNotificationType = (type: string): 'info' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'announcement':
    default:
      return 'info';
  }
};

class SocketService {
  private socket: any = null;
  private userId: string | null = null;
  private eventListeners: Record<string, EventCallback[]> = {
    'notification-received': [],
    'notification-updated': [],
    'notification-deleted': [],
    'notifications-read': [],
    'notifications-all-deleted': [],
    'announcement': [],
    'announcement-update': [],
    'announcement-delete': [],
    'announcements-all-read': [],
    'announcements-all-deleted': []
  };

  // Event subscription method
  subscribe(event: string, callback: EventCallback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }

  // Event unsubscription method
  unsubscribe(event: string, callback: EventCallback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  // Event emission method
  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  connect(userId: string) {
    if (!userId) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.userId = userId;
    const socketURL = process.env.NODE_ENV === 'production' 
      ? window.location.origin  // Production'da aynı domain
      : 'http://localhost:5055'; // Development'da localhost
      
    this.socket = io(socketURL, {
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join-user-room', userId);
    });

    this.socket.on('connect_error', (error: any) => {
      // Handle connection error silently
    });

    this.socket.on('disconnect', () => {
      // Handle disconnect silently
    });

    this.socket.on('notification', (notificationData: Notification) => {
      // Show notification using antd
      notification.open({
        message: notificationData.title,
        description: notificationData.message,
        type: mapNotificationType(notificationData.type),
        onClick: () => {
          if (notificationData.link) {
            window.location.href = notificationData.link;
          }
        }
      });
      
      // Emit event to subscribers
      this.emit('notification-received', notificationData);
    });

    this.socket.on('notification-update', (notificationData: Notification) => {
      this.emit('notification-updated', notificationData);
    });

    this.socket.on('notifications-all-read', () => {
      this.emit('notifications-read', null);
    });

    this.socket.on('notification-delete', (notificationId: string) => {
      this.emit('notification-deleted', notificationId);
    });
    
    this.socket.on('notifications-all-deleted', () => {
      this.emit('notifications-all-deleted', null);
    });

    // Announcement event handlers
    this.socket.on('announcement', (announcementData: Announcement) => {
      // Show announcement using antd
      notification.info({
        message: announcementData.title,
        description: announcementData.message,
        onClick: () => {
          if (announcementData.link) {
            window.location.href = announcementData.link;
          }
        }
      });
      
      // Emit event to subscribers
      this.emit('announcement', announcementData);
    });

    this.socket.on('announcement-update', (announcementData: Announcement) => {
      this.emit('announcement-update', announcementData);
    });

    this.socket.on('announcement-delete', (announcementId: string) => {
      this.emit('announcement-delete', announcementId);
    });

    this.socket.on('announcements-all-read', () => {
      this.emit('announcements-all-read', null);
    });

    this.socket.on('announcements-all-deleted', () => {
      this.emit('announcements-all-deleted', null);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }
}

export default new SocketService();
