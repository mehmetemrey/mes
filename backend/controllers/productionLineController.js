const ProductionLineService = require('../services/productionLineService');
const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

exports.createProductionLine = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Get the logged-in user's ID
    const createdBy = req.user._id;

    // Create production line
    const productionLine = await ProductionLineService.createProductionLine(
      req.body, 
      createdBy
    );

    // Create notification for all users
    await notificationService.createNotificationForAllUsers(
      'Yeni Üretim Hattı Oluşturuldu',
      `${req.body.name} üretim hattı oluşturuldu.`,
      'info',
      `/dashboard/production-lines/${productionLine._id}`
    );

    res.status(201).json({
      success: true,
      data: productionLine,
      message: 'Production line created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductionLines = async (req, res) => {
  try {
    // Extract filters and pagination from query
    const filters = {
      department: req.query.department,
      status: req.query.status,
      machines: req.query.machines 
        ? (typeof req.query.machines === 'string' 
          ? req.query.machines.split(',') 
          : req.query.machines)
        : undefined
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    // Get production lines
    const result = await ProductionLineService.getProductionLines(
      filters, 
      pagination
    );

    res.status(200).json({
      success: true,
      ...result,
      message: 'Production lines retrieved successfully'
    });
  } catch (error) {
    console.error('Production Lines Fetch Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductionLineById = async (req, res) => {
  try {
    const productionLine = await ProductionLineService.getProductionLines(
      { _id: req.params.id },
      { limit: 1 }
    );

    if (!productionLine.productionLines.length) {
      return res.status(404).json({
        success: false,
        message: 'Production line not found'
      });
    }

    res.status(200).json({
      success: true,
      data: productionLine.productionLines[0],
      message: 'Production line retrieved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProductionLine = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Get the logged-in user's ID
    const updatedBy = req.user._id;

    // Update production line
    const productionLine = await ProductionLineService.updateProductionLine(
      req.params.id, 
      req.body,
      updatedBy
    );

    // Create notification for all users
    await notificationService.createNotificationForAllUsers(
      'Üretim Hattı Güncellendi',
      `${productionLine.name} üretim hattı güncellendi.`,
      'info',
      `/dashboard/production-lines/${productionLine._id}`
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Production line updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignJobOrder = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { jobOrderId } = req.body;

    // Assign job order to production line
    const productionLine = await ProductionLineService.assignJobOrder(
      req.params.id, 
      jobOrderId
    );

    // Create notification for all users
    await notificationService.createNotificationForAllUsers(
      'İş Emri Atandı',
      `${productionLine.name} üretim hattına yeni iş emri atandı.`,
      'info',
      `/dashboard/production-lines/${productionLine._id}`
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Job order assigned successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignPersonnel = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { personnel } = req.body;

    // Assign personnel to production line
    const productionLine = await ProductionLineService.assignPersonnel(
      req.params.id, 
      personnel
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Personnel assigned successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.recordMaintenance = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const maintenanceData = req.body;

    // Record maintenance event
    const productionLine = await ProductionLineService.recordMaintenance(
      req.params.id, 
      maintenanceData
    );

    // Create notification for all users
    await notificationService.createNotificationForAllUsers(
      'Bakım Kaydı Oluşturuldu',
      `${productionLine.name} üretim hattı için bakım kaydı oluşturuldu.`,
      'warning',
      `/dashboard/production-lines/${productionLine._id}`
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Maintenance event recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateQualityMetrics = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const metricsData = req.body;

    // Update quality metrics
    const productionLine = await ProductionLineService.updateQualityMetrics(
      req.params.id, 
      metricsData
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Quality metrics updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.startShift = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const shiftData = req.body;

    // Start shift
    const productionLine = await ProductionLineService.startShift(
      req.params.id, 
      shiftData
    );

    res.status(200).json({
      success: true,
      data: productionLine,
      message: 'Shift started successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteProductionLine = async (req, res) => {
  try {
    // Get production line info before deletion
    const productionLine = await ProductionLineService.getProductionLines(
      { _id: req.params.id },
      { limit: 1 }
    );

    // Delete production line
    await ProductionLineService.deleteProductionLine(req.params.id);

    // Create notification for all users
    if (productionLine.productionLines.length > 0) {
      await notificationService.createNotificationForAllUsers(
        'Üretim Hattı Silindi',
        `${productionLine.productionLines[0].name} üretim hattı silindi.`,
        'error',
        '/dashboard/production-lines'
      );
    }

    res.status(200).json({
      success: true,
      message: 'Production line deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}; 