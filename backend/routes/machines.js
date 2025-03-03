const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize(['maintenance.create']), machineController.createMachine)
  .get(protect, authorize(['maintenance.view']), machineController.getMachines);

router.get('/basic', machineController.getMachineBasicInfo);

router.route('/:id')
  .get(protect, authorize(['maintenance.view']), machineController.getMachine)
  .put(protect, authorize(['maintenance.edit']), machineController.updateMachine)
  .delete(protect, authorize(['maintenance.delete']), machineController.deleteMachine);

router.patch('/:id/status', protect, authorize(['maintenance.edit']), machineController.updateMachineStatus);

module.exports = router;