const express = require('express');
const router = express.Router();
const { dailyReminders } = require('../controllers/cronController');
const { authLimiter } = require('../middleware/security');

// External cron hits this — protect with CRON_SECRET, not JWT
router.post('/daily-reminders', authLimiter, dailyReminders);
router.get('/daily-reminders', authLimiter, dailyReminders);

module.exports = router;