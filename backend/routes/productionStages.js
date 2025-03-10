const express = require('express');
const router = express.Router();
const productionStageController = require('../controllers/productionStageController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize(['production.create']), productionStageController.createProductionStage)
  .get(protect, authorize(['production.view']), productionStageController.getProductionStages);

router.route('/:id')
  .get(protect, authorize(['production.view']), productionStageController.getProductionStage)
  .put(protect, authorize(['production.edit']), productionStageController.updateProductionStage)
  .delete(protect, authorize(['production.delete']), productionStageController.deleteProductionStage);

router.patch('/:id/status', protect, authorize(['production.edit']), productionStageController.updateProductionStageStatus);

module.exports = router;