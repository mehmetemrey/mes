const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register-without-password', protect, authorize(['user.create']), authController.registerWithoutPassword);
router.post('/setup-password', authController.setupPassword);

router.route('/profile')
  .get(protect, authController.getProfile)
  .put(protect, authController.updateProfile);

router.post('/verify-current-password', protect, authController.verifyCurrentPassword);
router.post('/send-password-change-code', protect, authController.sendPasswordChangeCode);
router.post('/verify-and-change-password', protect, authController.verifyAndChangePassword);

router.route('/roles')
  .get(protect, authorize(['role.view']), authController.listRoles)
  .post(protect, authorize(['role.create']), authController.addRole);

router.post('/validate-reset-token', protect, authController.validateResetToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;