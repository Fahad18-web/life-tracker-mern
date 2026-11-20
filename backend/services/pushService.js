
'use strict';

const webpush = require('web-push');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT || 'mailto:support@example.com';

const configured = Boolean(vapidPublic && vapidPrivate);

if (configured) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublic,
    vapidPrivate
  );
}

function assertConfigured() {
  if (!configured) {
    throw new AppError(
      'Push notifications are not configured.',
      503
    );
  }
}

/**
 * Remove a subscription only if it is still the subscription
 * that failed. This prevents a stale notification request
 * from deleting a newer subscription saved by the user.
 */
async function removeSubscriptionIfMatches(userId, endpoint) {
  if (!userId || !endpoint) {
    return { removed: false, matched: false };
  }

  const result = await User.updateOne(
    {
      _id: userId,
      'pushSubscription.endpoint': endpoint
    },
    {
      $unset: {
        pushSubscription: 1
      }
    }
  );

  return {
    removed: (result.modifiedCount || 0) > 0,
    matched: (result.matchedCount || 0) > 0
  };
}

/**
 * Classify Web Push provider errors without exposing raw
 * provider error messages to callers.
 *
 * deliveryOutcome:
 * - rejected: provider rejected the request
 * - uncertain: provider acceptance cannot be determined
 */
function classifyPushError(error) {
  const statusCode = Number(error?.statusCode) || null;

  if (statusCode === 404 || statusCode === 410) {
    return {
      reason: 'invalid_subscription',
      statusCode,
      deliveryOutcome: 'rejected',
      retryable: false,
      removeSubscription: true
    };
  }

  if (statusCode === 429) {
    return {
      reason: 'push_rate_limited',
      statusCode,
      deliveryOutcome: 'rejected',
      retryable: true,
      removeSubscription: false
    };
  }

  if (statusCode >= 500 && statusCode <= 599) {
    return {
      reason: 'push_provider_unavailable',
      statusCode,
      deliveryOutcome: 'rejected',
      retryable: true,
      removeSubscription: false
    };
  }

  if (statusCode >= 400 && statusCode <= 499) {
    return {
      reason: 'push_request_rejected',
      statusCode,
      deliveryOutcome: 'rejected',
      retryable: false,
      removeSubscription: false
    };
  }

  // No trustworthy HTTP status generally means a network,
  // timeout, or transport-level failure. Provider acceptance
  // cannot safely be determined.
  return {
    reason: 'push_delivery_uncertain',
    statusCode,
    deliveryOutcome: 'uncertain',
    retryable: false,
    removeSubscription: false
  };
}

class PushService {
  getPublicKey() {
    if (!vapidPublic) {
      throw new AppError('VAPID public key missing.', 503);
    }

    return vapidPublic;
  }

  async saveSubscription(userId, subscription) {
    assertConfigured();

    if (
      typeof subscription?.endpoint !== 'string' ||
      !subscription.endpoint.trim() ||
      typeof subscription?.keys?.p256dh !== 'string' ||
      !subscription.keys.p256dh.trim() ||
      typeof subscription?.keys?.auth !== 'string' ||
      !subscription.keys.auth.trim()
    ) {
      throw new AppError('Invalid push subscription.', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          pushSubscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          }
        }
      },
      {
        new: true,
        projection: { _id: 1 }
      }
    );

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return { saved: true };
  }

  async removeSubscription(userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { pushSubscription: 1 }
    });

    return { removed: true };
  }

  async sendToUser(userId, payload) {
    if (!configured) {
      return {
        sent: false,
        reason: 'push_not_configured',
        statusCode: 503,
        deliveryOutcome: 'rejected',
        retryable: true
      };
    }

    const user = await User.findById(userId)
      .select('+pushSubscription');

    if (!user?.pushSubscription?.endpoint) {
      return {
        sent: false,
        reason: 'no_subscription',
        statusCode: null,
        deliveryOutcome: 'rejected',
        retryable: false
      };
    }

    const subscription = user.pushSubscription;
    const endpoint = subscription.endpoint;

    let body;

    try {
      body =
        typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);

      if (typeof body !== 'string') {
        return {
          sent: false,
          reason: 'push_payload_invalid',
          statusCode: null,
          deliveryOutcome: 'rejected',
          retryable: false
        };
      }
    } catch {
      // Serialization failed locally. The provider was never called.
      return {
        sent: false,
        reason: 'push_payload_invalid',
        statusCode: null,
        deliveryOutcome: 'rejected',
        retryable: false
      };
    }

    try {
      await webpush.sendNotification(
        subscription,
        body
      );

      return {
        sent: true,
        deliveryOutcome: 'accepted'
      };
    } catch (error) {
      const classification = classifyPushError(error);
      let subscriptionRemoved = false;
      let cleanupFailed = false;

      if (classification.removeSubscription) {
        try {
          const cleanup = await removeSubscriptionIfMatches(
            userId,
            endpoint
          );

          subscriptionRemoved = cleanup.removed;
        } catch {
          // Do not expose raw database error details.
          cleanupFailed = true;
        }
      }

      return {
        sent: false,
        reason: classification.reason,
        statusCode: classification.statusCode,
        deliveryOutcome: classification.deliveryOutcome,
        retryable: classification.retryable,
        subscriptionRemoved,
        ...(cleanupFailed ? { cleanupFailed: true } : {})
      };
    }
  }
}

module.exports = new PushService();
