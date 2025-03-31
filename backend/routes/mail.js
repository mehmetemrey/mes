const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMailToUsers,
  sendMailToAllUsers,
  sendMailToUsersByRole,
  sendMailToUsersByDepartment,
  sendCustomMail
} = require('../controllers/mailController');

router.post('/users', protect, sendMailToUsers);
router.post('/all', protect, sendMailToAllUsers);
router.post('/roles', protect, sendMailToUsersByRole);
router.post('/departments', protect, sendMailToUsersByDepartment);
router.post('/filter', protect, sendCustomMail);

module.exports = router;