const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const FcmToken = require('../models/FcmToken');
const { getVapidPublicKey, sendPushToAllAdmins } = require('../services/pushService');
const {
  isFirebaseConfigured,
  getFirebasePublicConfig,
  sendFcmToAllAdmins,
} = require('../services/firebaseService');

// ─── GET /api/notifications (Admin list notifications) ───────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const unreadCount = await Notification.countDocuments({ read: false });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] getNotifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// ─── PATCH /api/notifications/:id/read (Mark single as read) ──────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ read: false });

    return res.status(200).json({
      success: true,
      notification: notif,
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] markAsRead error:', err);
    return res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

// ─── PATCH /api/notifications/read-all (Mark all as read) ────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (err) {
    console.error('[Notifications] markAllAsRead error:', err);
    return res.status(500).json({ message: 'Failed to mark all as read.' });
  }
};

// ─── POST /api/notifications/fcm-token (Register Firebase Cloud Messaging Token)
const saveFcmToken = async (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM registration token is required.' });
    }

    const adminId = req.user?.userId || req.user?.id || null;
    const agent = deviceInfo || req.headers['user-agent'] || '';

    const saved = await FcmToken.findOneAndUpdate(
      { token },
      {
        token,
        adminId,
        deviceInfo: agent,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Firebase FCM token registered successfully.',
      tokenId: saved._id,
    });
  } catch (err) {
    console.error('[Notifications] saveFcmToken error:', err);
    return res.status(500).json({ message: 'Failed to save Firebase FCM token.' });
  }
};

// ─── POST /api/notifications/fcm-token/delete (Revoke FCM Token) ─────────────
const deleteFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required to delete.' });
    }

    await FcmToken.deleteMany({ token });

    return res.status(200).json({
      success: true,
      message: 'Firebase FCM token deleted.',
    });
  } catch (err) {
    console.error('[Notifications] deleteFcmToken error:', err);
    return res.status(500).json({ message: 'Failed to delete FCM token.' });
  }
};

// ─── GET /api/notifications/firebase-config ──────────────────────────────────
const getFirebaseConfig = (req, res) => {
  const config = getFirebasePublicConfig();
  return res.status(200).json(config);
};

// ─── POST /api/notifications/subscribe (Register web push subscription) ──────
const subscribePush = async (req, res) => {
  try {
    const subObj = req.body.subscription || (req.body.endpoint ? req.body : null);
    if (!subObj || !subObj.endpoint || !subObj.keys) {
      return res.status(400).json({ message: 'Valid push subscription object is required.' });
    }

    const adminId = req.user?.userId || req.user?.id || null;
    const userAgent = req.headers['user-agent'] || '';

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: subObj.endpoint },
      {
        adminId,
        endpoint: subObj.endpoint,
        keys: {
          p256dh: subObj.keys.p256dh,
          auth: subObj.keys.auth,
        },
        userAgent,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Push subscription registered successfully.',
      subscriptionId: saved._id,
    });
  } catch (err) {
    console.error('[Notifications] subscribePush error:', err);
    return res.status(500).json({ message: 'Failed to register push subscription.' });
  }
};

// ─── POST /api/notifications/unsubscribe (Revoke push subscription) ─────────
const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required to revoke subscription.' });
    }

    await PushSubscription.deleteMany({ endpoint });

    return res.status(200).json({
      success: true,
      message: 'Push subscription revoked.',
    });
  } catch (err) {
    console.error('[Notifications] unsubscribePush error:', err);
    return res.status(500).json({ message: 'Failed to revoke push subscription.' });
  }
};

// ─── POST /api/notifications/test-push (Admin sends a test alert) ────────────
const sendTestPush = async (req, res) => {
  try {
    const payload = {
      title: '✨ PrettyGlitz Push Test',
      body: 'Firebase Cloud Messaging alert is active! You will receive live alerts for orders, stock, and reviews.',
      icon: '/pretty-glitz-logo.png',
      url: '/orders',
      type: 'test_alert',
    };

    const result = await sendPushToAllAdmins(payload);

    return res.status(200).json({
      success: true,
      message: 'Test notification dispatched across Firebase & Web Push.',
      result,
    });
  } catch (err) {
    console.error('[Notifications] sendTestPush error:', err);
    return res.status(500).json({ message: 'Failed to send test push notification.' });
  }
};

// ─── GET /api/notifications/vapid-public-key ──────────────────────────────────
const getVapidKey = (req, res) => {
  const key = getVapidPublicKey();
  return res.status(200).json({ publicKey: key });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  saveFcmToken,
  deleteFcmToken,
  getFirebaseConfig,
  subscribePush,
  unsubscribePush,
  sendTestPush,
  getVapidKey,
};
