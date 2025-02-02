const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize(['role.view']), roleController.listRoles)
  .post(protect, authorize(['role.create']), roleController.createRole);

router.route('/:id')
  .get(protect, authorize(['role.view']), roleController.getRole)
  .put(protect, authorize(['role.edit']), roleController.updateRole)
  .delete(protect, authorize(['role.delete']), roleController.deleteRole);

router.post('/:id/permissions', protect, authorize(['role.edit']), roleController.addPermissionToRole);
router.delete('/:id/permissions', protect, authorize(['role.edit']), roleController.removePermissionFromRole);

module.exports = router;