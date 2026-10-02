const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  completeOnboarding
} = require('../controllers/userController');
const { exportMyData } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);
router.post('/onboarding/complete', completeOnboarding);
router.get('/export', exportMyData);

module.exports = router;