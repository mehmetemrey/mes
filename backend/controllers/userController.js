const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const notificationService = require('../services/notificationService');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find()
    .select('-password')
    .populate({
      path: 'roles',
      select: '_id name description level scope permissions'
    })
    .populate({
      path: 'department',
      select: '_id name code'
    });

  res.status(200).json({
    success: true,
    data: {
      users
    }
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate({
      path: 'roles',
      select: '_id name description level scope permissions'
    })
    .populate({
      path: 'department',
      select: '_id name code'
    });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
  .select('-password')
  .populate({
    path: 'roles',
    select: '_id name description level scope permissions'
  })
  .populate({
    path: 'department',
    select: '_id name code'
  });

  await notificationService.createNotification(
    user._id,
    'Profil Güncellendi',
    'Profiliniz başarıyla güncellendi.',
    'info',
    `/dashboard/users/${user._id}`
  );

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  await notificationService.createNotificationForAllUsers(
    'Kullanıcı Silindi',
    `${user.firstName} ${user.lastName} kullanıcısı sistemden silindi.`,
    'warning'
  );

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  await notificationService.createNotification(
    user._id,
    'Hoş Geldiniz',
    'Sisteme başarıyla kaydoldunuz. Profilinizi güncelleyebilirsiniz.',
    'success',
    `/dashboard/users/${user._id}`
  );

  await notificationService.createNotificationForAllUsers(
    'Yeni Kullanıcı',
    `${user.firstName} ${user.lastName} sisteme kaydoldu.`,
    'info'
  );

  res.status(201).json({
    success: true,
    data: {
      user
    }
  });
});