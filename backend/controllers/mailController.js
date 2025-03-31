const mailService = require('../services/mailService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.sendMailToUsers = asyncHandler(async (req, res, next) => {
  const { userIds, subject, content, attachments } = req.body;

  if (!userIds || !subject || !content) {
    return next(new ErrorResponse('Kullanıcılar, konu ve içerik zorunludur', 400));
  }

  const result = await mailService.sendMailToUsers(userIds, subject, content, attachments);

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.sendMailToAllUsers = asyncHandler(async (req, res, next) => {
  const { subject, content, attachments } = req.body;

  if (!subject || !content) {
    return next(new ErrorResponse('Konu ve içerik zorunludur', 400));
  }

  const result = await mailService.sendMailToAllUsers(subject, content, attachments);

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.sendMailToUsersByRole = asyncHandler(async (req, res, next) => {
  const { roles, subject, content, attachments } = req.body;

  if (!roles || !subject || !content) {
    return next(new ErrorResponse('Roller, konu ve içerik zorunludur', 400));
  }

  const result = await mailService.sendMailToUsersByRole(roles, subject, content, attachments);

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.sendMailToUsersByDepartment = asyncHandler(async (req, res, next) => {
  const { departments, subject, content, attachments } = req.body;

  if (!departments || !subject || !content) {
    return next(new ErrorResponse('Departmanlar, konu ve içerik zorunludur', 400));
  }

  const result = await mailService.sendMailToUsersByDepartment(departments, subject, content, attachments);

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.sendCustomMail = asyncHandler(async (req, res, next) => {
  const { filter, subject, content, attachments } = req.body;

  if (!filter || !subject || !content) {
    return next(new ErrorResponse('Filtre, konu ve içerik zorunludur', 400));
  }

  const result = await mailService.sendCustomMail(filter, subject, content, attachments);

  res.status(200).json({
    success: true,
    data: result
  });
});