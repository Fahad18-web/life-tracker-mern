const webpush = require('web-push');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

let configured = false;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  configured = true;
}

function assertConfigured() {
  if (!configured) {
    throw new AppError('Push notifications are not configured.', 503);
  }
}

class PushService {
  getPublicKey() {
    if (!vapidPublic) throw new AppError('VAPID public key missing.', 503);
    return vapidPublic;
  }

  async saveSubscription(userId, subscription) {
    assertConfigured();
    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      throw new AppError('Invalid push subscription.', 400);
    }

    await User.findByIdAndUpdate(userId, {
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      }
    });

    return { saved: true };
  }

  async removeSubscription(userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { pushSubscription: 1 }
    });
    return { removed: true };
  }

  async sendToUser(userId, payload) {
    assertConfigured();
    const user = await User.findById(userId).select('+pushSubscription');
    if (!user?.pushSubscription?.endpoint) {
      return { sent: false, reason: 'no_subscription' };
    }

    const body =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    try {
      await webpush.sendNotification(user.pushSubscription, body);
      return { sent: true };
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await User.findByIdAndUpdate(userId, {
          $unset: { pushSubscription: 1 }
        });
      }
      return { sent: false, reason: err.message };
    }
  }
}

module.exports = new PushService();