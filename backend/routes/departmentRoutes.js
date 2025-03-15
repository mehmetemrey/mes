const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize(['department.view']), departmentController.listDepartments)
  .post(protect, authorize(['department.create']), departmentController.createDepartment);

router.get('/hierarchy', protect, authorize(['department.view']), departmentController.getDepartmentHierarchy);

router.route('/:id')
  .get(protect, authorize(['department.view']), departmentController.getDepartment)
  .put(protect, authorize(['department.edit']), departmentController.updateDepartment)
  .delete(protect, authorize(['department.delete']), departmentController.deleteDepartment);

module.exports = router;