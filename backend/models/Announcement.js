const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: { 
    type: String, 
    enum: ['announcement', 'info', 'update'], 
    default: 'announcement' 
  },
  read: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);