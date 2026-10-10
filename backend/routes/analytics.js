const express = require('express');
const router = express.Router();
const {
  getWeekly,
  getMonthly,
  getStreaks,
  getReport,
  getInsights,
  getDashboard
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/streaks', getStreaks);
router.get('/report', getReport);
router.get('/insights', getInsights);

module.exports = router;