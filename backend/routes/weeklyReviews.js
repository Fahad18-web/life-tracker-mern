const express = require('express');
const router = express.Router();
const {
  getWeek,
  getHistory,
  upsertWeek
} = require('../controllers/weeklyReviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/history', getHistory);
router.get('/', getWeek);
router.put('/:weekStart', upsertWeek);

module.exports = router;