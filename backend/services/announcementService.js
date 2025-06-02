const Announcement = require('../models/Announcement');
const User = require('../models/User');

let io = null;

// Set the Socket.IO instance
exports.setIO = (socketIO) => {
  io = socketIO;
};

// Helper function to emit announcement events
const emitAnnouncementEvent = (userId, eventName, data) => {
  if (io) {
    // Make sure we're using the string version of userId for the room
    const room = userId.toString();
    
    // Emit to the user's room
    io.to(room).emit(eventName, data);
  }
};

// Create a new announcement
exports.createAnnouncement = async (title, message, link = null, type = 'info') => {
  try {
    const announcement = new Announcement({
      title,
      message,
      link,
      type,
      createdAt: new Date()
    });
    await announcement.save();
    
    // Emit to all connected clients
    if (io) {
      io.emit('announcement', announcement);
    }
    
    return announcement;
  } catch (error) {
    console.error('Error creating announcements:', error);
    throw error;
  }
};

// Get user announcements
exports.getUserAnnouncements = async (userId, limit = 30) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return announcements.map(a => {
      const doc = a.toObject();
      const isReadByUser = userId && doc.readBy && doc.readBy.some(id => id.toString() === userId.toString());
      doc.read = Boolean(doc.read || isReadByUser);
      return doc;
    });
  } catch (error) {
    console.error('Error getting user announcements:', error);
    throw error;
  }
};

// Mark announcement as read
exports.markAnnouncementAsRead = async (announcementId, userId) => {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return null;
    }

    // Kullanıcı zaten okumuşsa tekrar ekleme
    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
      await announcement.save();

      // Socket.IO ile bildirim gönder
      if (io) {
        io.emit('announcement:read', {
          announcementId,
          userId
        });
      }
    }

    return announcement;
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    throw error;
  }
};

// Mark all announcements as read for a user
exports.markAllAnnouncementsAsRead = async (userId) => {
  try {
    // Tüm duyuruları bul ve kullanıcıyı readBy dizisine ekle
    const announcements = await Announcement.find({
      readBy: { $ne: userId }
    });

    for (const announcement of announcements) {
      announcement.readBy.push(userId);
      await announcement.save();
    }

    // Emit the update through Socket.IO
    if (io) {
      io.emit('announcements-all-read', { userId });
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking all announcements as read:', error);
    throw error;
  }
};

// Delete a specific announcement
exports.deleteAnnouncement = async (announcementId, userId) => {
  try {
    // First, find the announcement to check its details
    const announcement = await Announcement.findById(announcementId);
    
    if (!announcement) {
      throw new Error('Duyuru bulunamadı');
    }

    // Check if the user has permission to delete
    // You might want to add more sophisticated permission checks here
    const deletedAnnouncement = await Announcement.findByIdAndDelete(announcementId);
    
    if (deletedAnnouncement) {
      // Emit the deletion through Socket.IO
      emitAnnouncementEvent(userId, 'announcement-delete', announcementId);
    }

    return deletedAnnouncement;
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

// Delete all announcements for a user
exports.deleteAllAnnouncements = async (userId) => {
  try {
    const result = await Announcement.deleteMany({});
    
    // Emit event to clear announcements
    if (io) {
      io.emit('announcements-all-deleted', null);
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting all announcements:', error);
    throw error;
  }
};

// Remove announcement from user's view
exports.removeFromView = async (announcementId, userId) => {
  try {
    const announcement = await Announcement.findById(announcementId);
    
    if (!announcement) {
      return null;
    }

    // Add user to readBy array if not already there
    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
      await announcement.save();
    }

    // Emit the update through Socket.IO
    if (io) {
      io.emit('announcement-update', announcement);
    }

    return announcement;
  } catch (error) {
    console.error('Error removing announcement from view:', error);
    throw error;
  }
};

// Get single announcement
exports.getAnnouncement = async (id) => {
  try {
    const announcement = await Announcement.findById(id);
    return announcement;
  } catch (error) {
    throw error;
  }
};

// Update announcement
exports.updateAnnouncement = async (id, updateData) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (announcement) {
      // Emit the update through Socket.IO
      if (io) {
        io.emit('announcement-update', announcement);
      }
    }

    return announcement;
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
}; 