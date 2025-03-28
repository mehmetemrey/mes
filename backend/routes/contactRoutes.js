const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public routes
router.post('/', contactController.submitContactForm);

// Admin routes
router.get('/', contactController.getAllContacts);
router.put('/:id/status', contactController.updateContactStatus);
router.post('/:id/reply', contactController.sendReply);
router.delete('/:id', contactController.deleteContact);

module.exports = router; 