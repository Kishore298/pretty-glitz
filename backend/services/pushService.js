const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const { sendFcmToAllAdmins } = require('./firebaseService');

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:prettyglitzcollections@gmail.com';

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.error('[WebPush] Error setting VAPID details:', err.message);
  }
}

const getVapidPublicKey = () => {
  return process.env.VAPID_PUBLIC_KEY || '';
};

/**
 * Dispatches a background notification to all registered admin devices.
 * Automatically broadcasts to:
 * 1. Firebase Cloud Messaging (FCM tokens)
 * 2. W3C Web Push (Browser PushSubscriptions)
 */
const sendPushToAllAdmins = async (payload) => {
  const results = {
    fcm: { sent: 0, failed: 0 },
    webPush: { sent: 0, failed: 0 },
  };

  // 1. Dispatch via Firebase Cloud Messaging (FCM)
  try {
    results.fcm = await sendFcmToAllAdmins(payload);
  } catch (fcmErr) {
    console.error('[PushService] Error dispatching FCM:', fcmErr.message);
  }

  // 2. Dispatch via Web Push (fallback & dual support)
  if (publicKey && privateKey) {
    try {
      const subscriptions = await PushSubscription.find({});
      if (subscriptions && subscriptions.length > 0) {
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const deadEndpoints = [];

        await Promise.all(
          subscriptions.map(async (sub) => {
            const pushConfig = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            };

            try {
              await webpush.sendNotification(pushConfig, payloadString, {
                TTL: 60 * 60 * 24, // 24 hours
                urgency: 'high',
              });
              results.webPush.sent++;
            } catch (err) {
              results.webPush.failed++;
              const statusCode = err.statusCode;
              if (statusCode === 404 || statusCode === 410) {
                deadEndpoints.push(sub.endpoint);
              }
            }
          })
        );

        if (deadEndpoints.length > 0) {
          await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
          console.log(`[WebPush] Pruned ${deadEndpoints.length} expired push subscriptions.`);
        }
      }
    } catch (err) {
      console.error('[WebPush] Unexpected error in sendPushToAllAdmins:', err);
    }
  }

  return results;
};

module.exports = {
  getVapidPublicKey,
  sendPushToAllAdmins,
};
