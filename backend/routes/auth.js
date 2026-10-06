const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePreferences,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../validators/authValidators');

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/verify-email', authLimiter, verifyEmail);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;