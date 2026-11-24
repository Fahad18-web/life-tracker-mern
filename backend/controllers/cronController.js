'use strict';

const crypto = require('node:crypto');
const { runDailyReminders } = require('../services/reminderService');
const logger = require('../utils/logger');

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

const number = (value) => (Number.isFinite(value) ? value : 0);

/**
 * Counts-only summary for the server log.
 *
 * Key names are chosen deliberately: utils/logger.js redacts any key that
 * contains words such as "email", "auth" or "subscription", which would turn
 * useful counters into "[REDACTED]". No user data is included.
 */
function summarizeRun(result = {}, durationMs) {
  return {
    durationMs,
    candidates: number(result.candidates),
    reminded: number(result.sent),
    pushDelivered: number(result.pushSent),
    pushFailed: number(result.pushFailed),
    pushNoSub: number(result.pushNoSubscription),
    failed: number(result.failed),
    skipped: number(result.skipped),
    skippedBeforeWindow: number(result.skippedBeforeWindow),
    skippedAfterWindow: number(result.skippedAfterWindow),
    skippedAlreadyLogged: number(result.skippedAlreadyLogged),
    skippedInvalidHour: number(result.skippedInvalidHour),
    catchUpProcessed: number(result.catchUpProcessed),
    userProcessingFailed: number(result.userProcessingFailed),
    errorCount: Array.isArray(result.errors) ? result.errors.length : 0,
    errors: Array.isArray(result.errors) ? result.errors.slice(0, 5) : []
  };
}

const dailyReminders = async (req, res, next) => {
  const startedAt = Date.now();

  try {
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret = req.get('x-cron-secret');

    if (!isValidCronSecret(providedSecret, configuredSecret)) {
      // Visible in the host logs so a wrong/rotated secret is noticed quickly.
      // The provided value is never logged.
      logger.warn('cron.daily_reminders.unauthorized', {
        hasHeader: Boolean(providedSecret)
      });

      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // The cron endpoint must never bypass each user's configured hour.
    const result = await runDailyReminders({
      strictHour: true
    });

    logger.info(
      'cron.daily_reminders.completed',
      summarizeRun(result, Date.now() - startedAt)
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    logger.error('cron.daily_reminders.failed', {
      durationMs: Date.now() - startedAt,
      reason: typeof err?.message === 'string' ? err.message : 'unknown_error'
    });

    return next(err);
  }
};

module.exports = { dailyReminders, summarizeRun };