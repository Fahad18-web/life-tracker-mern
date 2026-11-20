
'use strict';

const crypto = require('node:crypto');
const { runDailyReminders } = require('../services/reminderService');

function isValidCronSecret(providedSecret, configuredSecret) {
  if (
    typeof providedSecret !== 'string' ||
    typeof configuredSecret !== 'string' ||
    !providedSecret ||
    !configuredSecret
  ) {
    return false;
  }

  const providedBuffer = Buffer.from(providedSecret, 'utf8');
  const configuredBuffer = Buffer.from(configuredSecret, 'utf8');

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    providedBuffer,
    configuredBuffer
  );
}

const dailyReminders = async (req, res, next) => {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret = req.get('x-cron-secret');

    if (!isValidCronSecret(providedSecret, configuredSecret)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // The cron endpoint must never bypass each user's configured hour.
    const result = await runDailyReminders({
      strictHour: true
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { dailyReminders };
