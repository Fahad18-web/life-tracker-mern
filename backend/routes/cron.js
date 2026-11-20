
'use strict';

const express = require('express');
const router = express.Router();
const { dailyReminders } = require('../controllers/cronController');

// Protected by CRON_SECRET inside the controller.
// No JWT authentication or auth rate limit is required.
router.post('/daily-reminders', dailyReminders);

module.exports = router;
