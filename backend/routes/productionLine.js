const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const productionLineController = require('../controllers/productionLineController');
const { protect } = require('../middleware/auth');

// Validation middleware for production line creation
const createProductionLineValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Production line name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .notEmpty().withMessage('Production line code is required')
    .isLength({ min: 2, max: 20 }).withMessage('Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/).withMessage('Code must contain only uppercase letters, numbers, and hyphens'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isMongoId().withMessage('Invalid department ID'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('capacity')
    .optional()
    .isFloat({ min: 0 }).withMessage('Capacity must be a non-negative number'),
  body('capacityUnit')
    .optional()
    .isIn(['adet/saat', 'kg/saat', 'metre/saat', 'litre/saat'])
    .withMessage('Invalid capacity unit'),
  body('efficiency')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Efficiency must be between 0 and 100')
];

// Validation middleware for production line update
const updateProductionLineValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/).withMessage('Code must contain only uppercase letters, numbers, and hyphens')
];

// Validation middleware for job order assignment
const assignJobOrderValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('jobOrderId')
    .notEmpty().withMessage('Job order ID is required')
    .isMongoId().withMessage('Invalid job order ID')
];

// Validation middleware for personnel assignment
const assignPersonnelValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('personnel')
    .isArray().withMessage('Personnel must be an array'),
  body('personnel.*.employee')
    .isMongoId().withMessage('Invalid employee ID'),
  body('personnel.*.role')
    .isIn([
      'Operatör', 
      'Teknisyen', 
      'Vardiya Amiri', 
      'Kalite Kontrol', 
      'Bakım Sorumlusu', 
      'Üretim Planlayıcısı'
    ]).withMessage('Invalid personnel role'),
  body('personnel.*.assignmentType')
    .isIn(['Tam Zamanlı', 'Yarı Zamanlı', 'Vardiyalı'])
    .withMessage('Invalid assignment type')
];

// Validation middleware for maintenance record
const recordMaintenanceValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('type')
    .isIn(['Planlı Bakım', 'Arıza Bakımı', 'Periyodik Bakım'])
    .withMessage('Invalid maintenance type'),
  body('startTime')
    .optional()
    .isISO8601().withMessage('Invalid start time'),
  body('endTime')
    .optional()
    .isISO8601().withMessage('Invalid end time')
];

// Validation middleware for quality metrics
const updateQualityMetricsValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('totalProduced')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total produced must be a non-negative number'),
  body('totalPassed')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total passed must be a non-negative number')
];

// Validation middleware for shift start
const startShiftValidation = [
  param('id')
    .isMongoId().withMessage('Invalid production line ID'),
  body('shiftNumber')
    .isInt({ min: 1, max: 3 }).withMessage('Shift number must be between 1 and 3'),
  body('startTime')
    .isISO8601().withMessage('Invalid start time'),
  body('endTime')
    .isISO8601().withMessage('Invalid end time'),
  body('assignedTeam')
    .isArray().withMessage('Assigned team must be an array of employee IDs'),
  body('assignedTeam.*')
    .isMongoId().withMessage('Invalid employee ID in assigned team')
];

// Create a new production line
router.post(
  '/',
  protect,
  createProductionLineValidation,
  productionLineController.createProductionLine
);

// Get all production lines
router.get(
  '/',
  protect,
  productionLineController.getProductionLines
);

// Get a single production line
router.get(
  '/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid production line ID'),
  productionLineController.getProductionLineById
);

// Update a production line
router.put(
  '/:id',
  protect,
  updateProductionLineValidation,
  productionLineController.updateProductionLine
);

// Delete a production line
router.delete(
  '/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid production line ID'),
  productionLineController.deleteProductionLine
);

// Assign job order to production line
router.post(
  '/:id/job-order',
  protect,
  assignJobOrderValidation,
  productionLineController.assignJobOrder
);

// Assign personnel to production line
router.post(
  '/:id/personnel',
  protect,
  assignPersonnelValidation,
  productionLineController.assignPersonnel
);

// Record maintenance for production line
router.post(
  '/:id/maintenance',
  protect,
  recordMaintenanceValidation,
  productionLineController.recordMaintenance
);

// Update quality metrics for production line
router.post(
  '/:id/quality-metrics',
  protect,
  updateQualityMetricsValidation,
  productionLineController.updateQualityMetrics
);

// Start shift for production line
router.post(
  '/:id/start-shift',
  protect,
  startShiftValidation,
  productionLineController.startShift
);

module.exports = router; 