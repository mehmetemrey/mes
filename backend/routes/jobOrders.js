const express = require('express');
const router = express.Router();
const jobOrderController = require('../controllers/jobOrderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize(['production.create']), jobOrderController.createJobOrder)
  .get(protect, authorize(['production.view']), jobOrderController.getJobOrders);

router.route('/:id')
  .get(protect, authorize(['production.view']), jobOrderController.getJobOrder)
  .put(protect, authorize(['production.edit']), jobOrderController.updateJobOrder)
  .delete(protect, authorize(['production.delete']), jobOrderController.deleteJobOrder);

router.patch('/:id/status', protect, authorize(['production.edit']), jobOrderController.updateJobStatus);
router.patch('/:id/start', protect, authorize(['production.edit']), jobOrderController.updateJobStatus);
router.patch('/:id/stop', protect, authorize(['production.edit']), jobOrderController.updateJobStatus);
router.patch('/:id/pause', protect, authorize(['production.edit']), jobOrderController.updateJobStatus);
router.post('/:id/delays', protect, authorize(['production.edit']), jobOrderController.addDelay);

module.exports = router;