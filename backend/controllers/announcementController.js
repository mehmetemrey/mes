const announcementService = require('../services/announcementService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, message, link, type } = req.body;

  if (!title || !message) {
    return next(new ErrorResponse('Başlık ve mesaj zorunludur', 400));
  }

  try {
    const announcements = await announcementService.createAnnouncement(
      title, 
      message, 
      link,
      type
    );

    res.status(201).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru oluşturulurken bir hata oluştu', 500));
  }
});

exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  try {
    const announcements = await announcementService.getUserAnnouncements(req.user._id);

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(new ErrorResponse('Duyurular alınırken bir hata oluştu', 500));
  }
});

exports.markAnnouncementAsRead = asyncHandler(async (req, res, next) => {
  try {
    const announcement = await announcementService.markAnnouncementAsRead(req.params.id, req.user._id);
    
    if (!announcement) {
      return next(new ErrorResponse('Duyuru bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru okundu olarak işaretlenirken bir hata oluştu', 500));
  }
});

exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  try {
    const announcement = await announcementService.deleteAnnouncement(req.params.id, req.user._id);
    
    if (!announcement) {
      return next(new ErrorResponse('Duyuru bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru silinirken bir hata oluştu', 500));
  }
});

exports.markAllAnnouncementsAsRead = asyncHandler(async (req, res, next) => {
  try {
    await announcementService.markAllAnnouncementsAsRead(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Tüm duyurular okundu olarak işaretlenirken bir hata oluştu', 500));
  }
});

exports.deleteAllAnnouncements = asyncHandler(async (req, res, next) => {
  try {
    await announcementService.deleteAllAnnouncements(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Tüm duyurular silinirken bir hata oluştu', 500));
  }
});

exports.removeFromView = asyncHandler(async (req, res, next) => {
  try {
    const announcement = await announcementService.removeFromView(req.params.id, req.user._id);
    
    if (!announcement) {
      return next(new ErrorResponse('Duyuru bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru görünümden kaldırılırken bir hata oluştu', 500));
  }
});

exports.getAnnouncement = asyncHandler(async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id);
    
    if (!announcement) {
      return next(new ErrorResponse('Duyuru bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru alınırken bir hata oluştu', 500));
  }
});

exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  const { title, message, link, type } = req.body;

  if (!title || !message) {
    return next(new ErrorResponse('Başlık ve mesaj zorunludur', 400));
  }

  try {
    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      { title, message, link, type }
    );
    
    if (!announcement) {
      return next(new ErrorResponse('Duyuru bulunamadı', 404));
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(new ErrorResponse('Duyuru güncellenirken bir hata oluştu', 500));
  }
});