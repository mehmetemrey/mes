const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  markAnnouncementAsRead,
  deleteAnnouncement,
  markAllAnnouncementsAsRead,
  deleteAllAnnouncements,
  removeFromView,
  getAnnouncement,
  updateAnnouncement
} = require('../controllers/announcementController');

router.get('/', protect, getAnnouncements);
router.post('/', protect, createAnnouncement);
router.put('/read-all', protect, markAllAnnouncementsAsRead);
router.delete('/delete-all', protect, deleteAllAnnouncements);
router.get('/:id', protect, getAnnouncement);
router.put('/:id', protect, updateAnnouncement);
router.put('/:id/read', protect, markAnnouncementAsRead);
router.put('/:id/remove-from-view', protect, removeFromView);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;