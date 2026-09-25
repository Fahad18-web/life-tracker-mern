const express = require('express');
const router  = express.Router();
const { getWeekly, getMonthly, getStreaks } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/weekly',  getWeekly);
router.get('/monthly', getMonthly);
router.get('/streaks', getStreaks);

module.exports = router;
