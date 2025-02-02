const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middleware/auth');

// Get all permissions
router.get('/',
    protect,
    permissionController.getAllPermissions
);

module.exports = router; 