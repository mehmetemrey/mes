const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// User management
router.get('/', protect, authorize(['user.view']), userController.getUsers);
router.post('/', protect, authorize(['user.create']), userController.createUser);
router.get('/:id', protect, authorize(['user.view']), userController.getUser);
router.put('/:id', protect, authorize(['user.edit']), userController.updateUser);
router.delete('/:id', protect, authorize(['user.delete']), userController.deleteUser);

module.exports = router; 