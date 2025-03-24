const notificationService = require('../services/notificationService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await notificationService.getUserNotifications(req.user._id);
  res.status(200).json({
    success: true,
    data: notifications
  });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id);
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  res.status(200).json({
    success: true,
    data: notification
  });
});

exports.toggleReadStatus = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.toggleReadStatus(req.params.id);
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  res.status(200).json({
    success: true,
    data: notification
  });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await notificationService.markAllAsRead(req.user._id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.deleteNotification(req.params.id);
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.deleteAllNotifications = asyncHandler(async (req, res, next) => {
  await notificationService.deleteAllNotifications(req.user._id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, message, link } = req.body;

  if (!title || !message) {
    return next(new ErrorResponse('Başlık ve mesaj zorunludur', 400));
  }

  try {
    const announcements = await notificationService.createAnnouncement(
      title, 
      message, 
      'announcement', 
      link
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('notification', {
        title,
        message,
        type: 'announcement',
      });
    }

    res.status(201).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru oluşturulurken bir hata oluştu', 500));
  }
});