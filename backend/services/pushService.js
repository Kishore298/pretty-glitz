const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

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
 * Dispatches a background Web Push notification to all registered admin devices.
 * Automatically cleans up dead/expired subscriptions (HTTP 404 / 410).
 */
const sendPushToAllAdmins = async (payload) => {
  if (!publicKey || !privateKey) {
    console.warn('[WebPush] VAPID keys not configured; skipping background push.');
    return { sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await PushSubscription.find({});
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    let sent = 0;
    let failed = 0;
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
          sent++;
        } catch (err) {
          failed++;
          const statusCode = err.statusCode;
          console.warn(`[WebPush] Failed delivery to endpoint (${statusCode || 'network'}):`, err.message);

          // 404 (Not Found) or 410 (Gone) indicates the subscription has expired or was revoked by the user
          if (statusCode === 404 || statusCode === 410) {
            deadEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Prune dead subscriptions asynchronously
    if (deadEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
      console.log(`[WebPush] Pruned ${deadEndpoints.length} expired push subscriptions.`);
    }

    return { sent, failed, pruned: deadEndpoints.length };
  } catch (err) {
    console.error('[WebPush] Unexpected error in sendPushToAllAdmins:', err);
    return { sent: 0, failed: 0, error: err.message };
  }
};

module.exports = {
  getVapidPublicKey,
  sendPushToAllAdmins,
};

