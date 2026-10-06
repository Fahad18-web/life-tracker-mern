const express = require('express');
const router = express.Router();
const { dailyReminders } = require('../controllers/cronController');

// Protected by CRON_SECRET inside controller — no JWT / no auth rate limit
router.post('/daily-reminders', dailyReminders);
router.get('/daily-reminders', dailyReminders);

module.exports = router;