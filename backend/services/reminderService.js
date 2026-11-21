
'use strict';

const crypto = require('node:crypto');

const User = require('../models/User');
const Entry = require('../models/Entry');
const ReminderDelivery = require('../models/ReminderDelivery');

const { sendDailyReminderEmail } = require('./emailService');
const pushService = require('./pushService');

const {
  addDaysToDateString,
  getHourInTimeZone,
  getTodayInTimeZone,
  normalizeTimeZone
} = require('../utils/dateUtils');

const MAX_CHANNEL_ATTEMPTS = 3;
const CLAIM_LEASE_MS = 10 * 60 * 1000;
const ERROR_MESSAGE_MAX_LENGTH = 500;

function clientBaseUrl() {
  const configuredUrl = process.env.CLIENT_URL;

  if (process.env.NODE_ENV === 'production' && !configuredUrl) {
    throw new Error('CLIENT_URL must be configured in production.');
  }

  return (configuredUrl || 'http://localhost:5173').replace(/\/+$/, '');
}

function dateInTimezone(timeZone = 'Asia/Karachi') {
  return getTodayInTimeZone(normalizeTimeZone(timeZone));
}

function hourInTimezone(timeZone = 'Asia/Karachi') {
  return getHourInTimeZone(normalizeTimeZone(timeZone));
}

function safeErrorMessage(error, fallback) {
  let message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : fallback;

  // Provider and network errors can contain credentials, URLs, or user data.
  message = message
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[redacted-url]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(
      /\b(authorization|api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|secret|vapid[-_ ]?(?:public|private)?key)\b\s*[:=]\s*[^\s,;]+/gi,
      '$1=[redacted]'
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');

  return message.slice(0, ERROR_MESSAGE_MAX_LENGTH);
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function isRetryableRejectedError(error) {
  return (
    error?.deliveryOutcome === 'rejected' &&
    error?.retryable === true
  );
}

async function ensureDeliveryRecord({
  userId,
  localDate,
  timeZone,
  preferredHour
}) {
  try {
    await ReminderDelivery.updateOne(
      { userId, localDate },
      {
        $setOnInsert: {
          userId,
          localDate,
          timezone: timeZone,
          preferredHour,
          email: {
            status: 'pending',
            attempts: 0,
            retryable: false
          },
          push: {
            status: 'pending',
            attempts: 0,
            retryable: false
          }
        }
      },
      { upsert: true }
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }
}

/**
 * An expired sending lease is ambiguous:
 * the provider may have accepted the request before the worker stopped.
 * Quarantine it instead of automatically sending again.
 */
async function quarantineExpiredClaim({
  userId,
  localDate,
  channel,
  now
}) {
  const statusPath = `${channel}.status`;
  const leasePath = `${channel}.leaseUntil`;
  const claimIdPath = `${channel}.claimId`;
  const retryablePath = `${channel}.retryable`;
  const lastErrorPath = `${channel}.lastError`;

  const update = await ReminderDelivery.updateOne(
    {
      userId,
      localDate,
      [statusPath]: 'sending',
      [leasePath]: { $lte: now }
    },
    {
      $set: {
        [statusPath]: 'uncertain',
        [claimIdPath]: null,
        [leasePath]: null,
        [retryablePath]: false,
        [lastErrorPath]:
          'Delivery lease expired; provider outcome requires reconciliation.'
      }
    }
  );

  return (update.modifiedCount || 0) > 0;
}

async function claimChannel({
  userId,
  localDate,
  channel,
  now
}) {
  await quarantineExpiredClaim({
    userId,
    localDate,
    channel,
    now
  });

  const claimId = crypto.randomUUID();
  const leaseUntil = new Date(now.getTime() + CLAIM_LEASE_MS);

  const statusPath = `${channel}.status`;
  const attemptsPath = `${channel}.attempts`;
  const claimIdPath = `${channel}.claimId`;
  const leasePath = `${channel}.leaseUntil`;
  const lastAttemptPath = `${channel}.lastAttemptAt`;
  const lastErrorPath = `${channel}.lastError`;
  const retryablePath = `${channel}.retryable`;

  const claim = await ReminderDelivery.findOneAndUpdate(
    {
      userId,
      localDate,
      [attemptsPath]: { $lt: MAX_CHANNEL_ATTEMPTS },
      $or: [
        {
          [statusPath]: 'pending'
        },
        {
          [statusPath]: 'failed',
          [retryablePath]: true
        }
      ]
    },
    {
      $set: {
        [statusPath]: 'sending',
        [claimIdPath]: claimId,
        [leasePath]: leaseUntil,
        [lastAttemptPath]: now,
        [lastErrorPath]: null,
        [retryablePath]: false
      },
      $inc: {
        [attemptsPath]: 1
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  return claim ? { claimId } : null;
}

/**
 * Returns true only when this worker still owns the claim
 * and the database accepted its state transition.
 */
async function finishChannel({
  userId,
  localDate,
  channel,
  claimId,
  status,
  errorMessage = null,
  retryable = false
}) {
  const statusPath = `${channel}.status`;
  const claimIdPath = `${channel}.claimId`;
  const leasePath = `${channel}.leaseUntil`;
  const sentAtPath = `${channel}.sentAt`;
  const lastErrorPath = `${channel}.lastError`;
  const retryablePath = `${channel}.retryable`;

  const update = {
    $set: {
      [statusPath]: status,
      [claimIdPath]: null,
      [leasePath]: null,
      [lastErrorPath]: errorMessage,
      [retryablePath]: status === 'failed' && retryable === true
    }
  };

  if (status === 'sent') {
    update.$set[sentAtPath] = new Date();
  }

  const result = await ReminderDelivery.updateOne(
    {
      userId,
      localDate,
      [claimIdPath]: claimId,
      [statusPath]: 'sending'
    },
    update
  );

  return (result.modifiedCount || 0) > 0;
}

async function resolveReminderVariant(userId, localDate) {
  const from = addDaysToDateString(localDate, -7);
  const yesterday = addDaysToDateString(localDate, -1);

  const recent = await Entry.find({
    userId,
    date: { $gte: from, $lte: localDate }
  })
    .select('date')
    .lean();

  if (!recent.length) {
    return 'gentle';
  }

  const dates = new Set(recent.map((entry) => entry.date));

  if (dates.has(yesterday)) {
    return 'protect';
  }

  return 'comeback';
}

function pushPayload(variant, logUrl) {
  const map = {
    default: {
      title: 'Log today',
      body: 'One minute keeps your record honest.'
    },
    protect: {
      title: 'Keep the chain',
      body: 'A short log today protects the rhythm you built.'
    },
    comeback: {
      title: 'Small comeback',
      body: 'One log today is enough to begin again.'
    },
    gentle: {
      title: 'Quiet check-in',
      body: 'Whenever you are ready — one minute is enough.'
    }
  };

  const { title, body } = map[variant] || map.default;

  return {
    title,
    body,
    url: logUrl,
    variant
  };
}

function addDeliveryError(result, details) {
  result.errors.push(details);
}

async function deliverEmail({
  user,
  localDate,
  logUrl,
  variant,
  now,
  result
}) {
  const claim = await claimChannel({
    userId: user._id,
    localDate,
    channel: 'email',
    now
  });

  if (!claim) {
    result.emailNotClaimed++;
    return;
  }

  const idempotencyKey =
    `daily-reminder:${user._id}:${localDate}:email`;

  try {
    const delivery = await sendDailyReminderEmail({
      to: user.email,
      name: user.name,
      logUrl,
      variant,
      idempotencyKey
    });

    if (delivery?.queued !== true) {
      const reason =
        typeof delivery?.reason === 'string'
          ? delivery.reason
          : 'email_not_queued';

      const message = safeErrorMessage(
        { message: reason },
        'email_not_queued'
      );

      const retryable = reason === 'email_not_configured';

      const finished = await finishChannel({
        userId: user._id,
        localDate,
        channel: 'email',
        claimId: claim.claimId,
        status: 'failed',
        errorMessage: message,
        retryable
      });

      if (!finished) {
        addDeliveryError(result, {
          channel: 'email',
          message: 'email_claim_lost_before_failure_recording'
        });
        return;
      }

      result.failed++;
      addDeliveryError(result, {
        channel: 'email',
        message
      });
      return;
    }

    const finished = await finishChannel({
      userId: user._id,
      localDate,
      channel: 'email',
      claimId: claim.claimId,
      status: 'sent'
    });

    if (!finished) {
      addDeliveryError(result, {
        channel: 'email',
        message: 'email_claim_lost_after_provider_acceptance'
      });
      return;
    }

    result.sent++;
  } catch (error) {
    const message = safeErrorMessage(
      error,
      'email_delivery_failed'
    );

    const retryable = isRetryableRejectedError(error);
    const status =
      error?.deliveryOutcome === 'rejected'
        ? 'failed'
        : 'uncertain';

    const finished = await finishChannel({
      userId: user._id,
      localDate,
      channel: 'email',
      claimId: claim.claimId,
      status,
      errorMessage: message,
      retryable
    });

    if (!finished) {
      addDeliveryError(result, {
        channel: 'email',
        message: 'email_claim_lost_while_recording_error'
      });
      return;
    }

    result.failed++;
    addDeliveryError(result, {
      channel: 'email',
      message,
      deliveryOutcome: status,
      retryable
    });
  }
}

async function deliverPush({
  user,
  localDate,
  logUrl,
  variant,
  now,
  result
}) {
  const claim = await claimChannel({
    userId: user._id,
    localDate,
    channel: 'push',
    now
  });

  if (!claim) {
    result.pushNotClaimed++;
    return;
  }

  result.pushAttempted++;

  try {
    const delivery = await pushService.sendToUser(
      user._id,
      pushPayload(variant, logUrl)
    );

    if (delivery?.sent) {
      const finished = await finishChannel({
        userId: user._id,
        localDate,
        channel: 'push',
        claimId: claim.claimId,
        status: 'sent'
      });

      if (finished) {
        result.pushSent++;
      } else {
        addDeliveryError(result, {
          channel: 'push',
          message: 'push_claim_lost_after_provider_acceptance'
        });
      }

      return;
    }

    if (delivery?.reason === 'no_subscription') {
      const finished = await finishChannel({
        userId: user._id,
        localDate,
        channel: 'push',
        claimId: claim.claimId,
        status: 'skipped',
        errorMessage: 'no_subscription'
      });

      if (finished) {
        result.pushNoSubscription++;
      }

      return;
    }

    const message = safeErrorMessage(
      { message: delivery?.reason },
      'push_delivery_failed'
    );

    // Preserve the provider's classification. Only an explicitly rejected,
    // retryable failure may be attempted again. Unknown outcomes are uncertain.
    const deliveryOutcome = delivery?.deliveryOutcome;
    const retryable =
      deliveryOutcome === 'rejected' && delivery?.retryable === true;
    const status =
      deliveryOutcome === 'rejected'
        ? 'failed'
        : 'uncertain';

    const finished = await finishChannel({
      userId: user._id,
      localDate,
      channel: 'push',
      claimId: claim.claimId,
      status,
      errorMessage: message,
      retryable
    });

    if (!finished) {
      addDeliveryError(result, {
        channel: 'push',
        message: 'push_claim_lost_while_recording_failure'
      });
      return;
    }

    result.pushFailed++;
    addDeliveryError(result, {
      channel: 'push',
      message,
      deliveryOutcome: status,
      retryable,
      statusCode: delivery?.statusCode ?? null
    });
  } catch (error) {
    const message = safeErrorMessage(
      error,
      'push_service_error'
    );

    const finished = await finishChannel({
      userId: user._id,
      localDate,
      channel: 'push',
      claimId: claim.claimId,
      status: 'uncertain',
      errorMessage: message
    });

    if (!finished) {
      addDeliveryError(result, {
        channel: 'push',
        message: 'push_claim_lost_while_recording_error'
      });
      return;
    }

    result.pushFailed++;
    addDeliveryError(result, {
      channel: 'push',
      message,
      deliveryOutcome: 'uncertain'
    });
  }
}

async function runDailyReminders({ strictHour = false } = {}) {
  const users = await User.find({
    emailVerified: true,
    'preferences.dailyReminderEnabled': true
  })
    .select('name email timezone preferences')
    .lean();

  const logUrl = `${clientBaseUrl()}/log`;

  const result = {
    candidates: users.length,
    sent: 0,
    emailNotClaimed: 0,
    pushAttempted: 0,
    pushSent: 0,
    pushFailed: 0,
    pushNoSubscription: 0,
    pushNotClaimed: 0,
    skipped: 0,
    skippedWrongHour: 0,
    skippedAlreadyLogged: 0,
    skippedInvalidHour: 0,
    failed: 0,
    variantFallbacks: 0,
    errors: []
  };

  for (const user of users) {
    try {
      const timeZone = normalizeTimeZone(
        user.timezone || 'Asia/Karachi'
      );

      const localDate = getTodayInTimeZone(timeZone);
      const localHour = getHourInTimeZone(timeZone);

      const preferredHour = Number(
        user.preferences?.dailyReminderHour ?? 20
      );

      if (
        !Number.isInteger(preferredHour) ||
        preferredHour < 0 ||
        preferredHour > 23
      ) {
        result.skipped++;
        result.skippedInvalidHour++;
        continue;
      }

      if (strictHour && localHour !== preferredHour) {
        result.skipped++;
        result.skippedWrongHour++;
        continue;
      }

      const hasEntry = await Entry.exists({
        userId: user._id,
        date: localDate
      });

      if (hasEntry) {
        result.skipped++;
        result.skippedAlreadyLogged++;
        continue;
      }

      await ensureDeliveryRecord({
        userId: user._id,
        localDate,
        timeZone,
        preferredHour
      });

      let variant = 'default';

      try {
        variant = await resolveReminderVariant(
          user._id,
          localDate
        );
      } catch {
        result.variantFallbacks++;
      }

      const now = new Date();

      // Isolate channel execution so an email-side state/database error
      // does not prevent the push channel from being attempted.
      try {
        await deliverEmail({
          user,
          localDate,
          logUrl,
          variant,
          now,
          result
        });
      } catch (error) {
        result.failed++;
        addDeliveryError(result, {
          channel: 'email',
          message: safeErrorMessage(error, 'email_processing_failed')
        });
      }

      try {
        await deliverPush({
          user,
          localDate,
          logUrl,
          variant,
          now,
          result
        });
      } catch (error) {
        result.pushFailed++;
        addDeliveryError(result, {
          channel: 'push',
          message: safeErrorMessage(error, 'push_processing_failed')
        });
      }
    } catch (error) {
      // A malformed timezone or user-specific database issue must not abort
      // reminder processing for every remaining user.
      result.userProcessingFailed = (result.userProcessingFailed || 0) + 1;
      addDeliveryError(result, {
        channel: 'user',
        message: safeErrorMessage(error, 'user_reminder_processing_failed')
      });
    }
  }

  result.errors = result.errors.slice(0, 10);
  return result;
}

module.exports = {
  runDailyReminders,
  dateInTimezone,
  hourInTimezone
};
