const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  toggleReadStatus
} = require('../controllers/notificationController');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/delete-all', deleteAllNotifications);
router.put('/:id/read', markAsRead);
router.put('/:id/toggle-read', toggleReadStatus);
router.delete('/:id', deleteNotification);

module.exports = router;