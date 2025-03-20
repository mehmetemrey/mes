const Permission = require('../models/Permission');
const notificationService = require('../services/notificationService');

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find()
      .sort({ module: 1, name: 1 });
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İzinler alınırken bir hata oluştu'
    });
  }
};

exports.createPermission = async (req, res) => {
  try {
    const permission = new Permission({
      ...req.body,
      createdBy: req.user._id
    });
    
    await permission.save();
    
    const populatedPermission = await Permission.findById(permission._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    await notificationService.createNotificationForAllUsers(
      'Yeni İzin Eklendi',
      `${permission.name} izni sisteme eklendi.`,
      'info',
      `/dashboard/permissions/${permission._id}`
    );

    res.status(201).json(populatedPermission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    Object.assign(permission, req.body);
    permission.updatedBy = req.user._id;
    
    await permission.save();

    const updatedPermission = await Permission.findById(permission._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    await notificationService.createNotificationForAllUsers(
      'İzin Güncellendi',
      `${permission.name} izni güncellendi.`,
      'info',
      `/dashboard/permissions/${permission._id}`
    );

    res.json(updatedPermission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    await Permission.findByIdAndDelete(req.params.id);

    await notificationService.createNotificationForAllUsers(
      'İzin Silindi',
      `${permission.name} izni sistemden silindi.`,
      'error',
      '/dashboard/permissions'
    );

    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};