const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const FcmToken = require('../models/FcmToken');
const BroadcastNotification = require('../models/BroadcastNotification');
const { getVapidPublicKey, sendPushToAllAdmins } = require('../services/pushService');
const {
  isFirebaseConfigured,
  getFirebasePublicConfig,
  sendFcmToAllAdmins,
  sendFcmCustomBroadcast,
  sendFcmToCustomer,
} = require('../services/firebaseService');

// ─── GET /api/notifications (Admin list notifications) ───────────────────────
const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 50);
    const filter = {
      $or: [{ forRole: 'admin' }, { userId: null }, { forRole: { $exists: false } }],
    };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ ...filter, read: false });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] getNotifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// ─── GET /api/notifications/unread-count (Admin lightweight unread polling) ───
const getUnreadCount = async (req, res) => {
  try {
    const filter = {
      $or: [{ forRole: 'admin' }, { userId: null }, { forRole: { $exists: false } }],
    };
    const unreadCount = await Notification.countDocuments({ ...filter, read: false });
    const latest = await Notification.findOne(filter)
      .sort({ createdAt: -1 })
      .select('_id createdAt title type message orderId')
      .lean();

    return res.status(200).json({
      unreadCount,
      latestNotificationId: latest?._id || null,
      latestTimestamp: latest?.createdAt || null,
      latestNotification: latest || null,
    });
  } catch (err) {
    console.error('[Notifications] getUnreadCount error:', err);
    return res.status(500).json({ message: 'Failed to fetch unread count.' });
  }
};

// ─── Customer Notification Endpoints (Scoped to Authenticated Customer) ───────

// GET /api/notifications/customer/unread-count (Customer lightweight unread polling)
const getCustomerUnreadCount = async (req, res) => {
  try {
    const cUserId = req.user?.userId || req.user?._id || req.user?.id;
    if (!cUserId) {
      return res.status(200).json({ unreadCount: 0, latestNotificationId: null });
    }
    const filter = { userId: cUserId };
    const unreadCount = await Notification.countDocuments({ ...filter, read: false });
    const latest = await Notification.findOne(filter)
      .sort({ createdAt: -1 })
      .select('_id createdAt title type message orderId')
      .lean();

    return res.status(200).json({
      unreadCount,
      latestNotificationId: latest?._id || null,
      latestTimestamp: latest?.createdAt || null,
      latestNotification: latest || null,
    });
  } catch (err) {
    console.error('[Notifications] getCustomerUnreadCount error:', err);
    return res.status(500).json({ message: 'Failed to fetch customer unread count.' });
  }
};

// GET /api/notifications/customer (Customer list notifications)
const getCustomerNotifications = async (req, res) => {
  try {
    const cUserId = req.user?.userId || req.user?._id || req.user?.id;
    if (!cUserId) {
      return res.status(200).json({ notifications: [], unreadCount: 0 });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const filter = { userId: cUserId };
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ ...filter, read: false });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] getCustomerNotifications error:', err);
    return res.status(500).json({ message: 'Failed to fetch customer notifications.' });
  }
};

// PATCH /api/notifications/customer/:id/read (Mark single customer notification read)
const markCustomerNotificationRead = async (req, res) => {
  try {
    const cUserId = req.user?.userId || req.user?._id || req.user?.id;
    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId: cUserId },
      { read: true, readAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    const unreadCount = await Notification.countDocuments({ userId: cUserId, read: false });
    return res.status(200).json({ success: true, notification: notif, unreadCount });
  } catch (err) {
    console.error('[Notifications] markCustomerNotificationRead error:', err);
    return res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

// PATCH /api/notifications/customer/read-all (Mark all customer notifications read)
const markAllCustomerNotificationsRead = async (req, res) => {
  try {
    const cUserId = req.user?.userId || req.user?._id || req.user?.id;
    await Notification.updateMany({ userId: cUserId, read: false }, { read: true, readAt: new Date() });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.', unreadCount: 0 });
  } catch (err) {
    console.error('[Notifications] markAllCustomerNotificationsRead error:', err);
    return res.status(500).json({ message: 'Failed to mark all notifications as read.' });
  }
};

// ─── PATCH /api/notifications/:id/read (Mark single as read) ──────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { returnDocument: 'after' }
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

// ─── DELETE /api/notifications/:id (Delete individual notification) ───────────
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndDelete(id);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ read: false });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] deleteNotification error:', err);
    return res.status(500).json({ message: 'Failed to delete notification.' });
  }
};

// ─── DELETE /api/notifications (Delete all notifications) ──────────────────────
const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
      unreadCount: 0,
    });
  } catch (err) {
    console.error('[Notifications] deleteAllNotifications error:', err);
    return res.status(500).json({ message: 'Failed to clear notifications.' });
  }
};

// ─── POST /api/notifications/fcm-token (Register Admin FCM Token) ──────────────
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
        role: 'ADMIN',
        adminId,
        deviceInfo: agent,
        lastUsedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(201).json({
      success: true,
      message: 'Admin Firebase FCM token registered successfully.',
      tokenId: saved._id,
    });
  } catch (err) {
    console.error('[Notifications] saveFcmToken error:', err);
    return res.status(500).json({ message: 'Failed to save Firebase FCM token.' });
  }
};

// ─── POST /api/notifications/customer-fcm-token (Register Customer FCM Token) ──
const saveCustomerFcmToken = async (req, res) => {
  try {
    const { token, mobile, orderId, deviceInfo } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM registration token is required.' });
    }

    const agent = deviceInfo || req.headers['user-agent'] || '';
    const userId = req.user?.id || req.user?.userId || null;

    const updateDoc = {
      token,
      role: 'CUSTOMER',
      deviceInfo: agent,
      lastUsedAt: new Date(),
    };

    if (userId) {
      updateDoc.userId = userId;
    }

    if (mobile) {
      const cleanMobile = String(mobile).replace(/\D/g, '');
      if (cleanMobile.length >= 10) {
        updateDoc.mobile = cleanMobile;
      }
    }

    const pushUpdates = {};
    if (orderId) {
      pushUpdates.$addToSet = { orderIds: String(orderId).trim().toUpperCase() };
    }

    const saved = await FcmToken.findOneAndUpdate(
      { token },
      {
        $set: updateDoc,
        ...pushUpdates,
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(201).json({
      success: true,
      message: 'Customer FCM token registered successfully.',
      tokenId: saved._id,
    });
  } catch (err) {
    console.error('[Notifications] saveCustomerFcmToken error:', err);
    return res.status(500).json({ message: 'Failed to register customer FCM token.' });
  }
};

// ─── POST /api/notifications/broadcast (Admin sends custom push notification) ──
const broadcastCustomPush = async (req, res) => {
  try {
    const { targetAudience, title, body, url, imageUrl } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Notification title is required.' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Notification message body is required.' });
    }

    const audience = ['ALL', 'CUSTOMERS', 'ADMINS'].includes(targetAudience) ? targetAudience : 'CUSTOMERS';

    const result = await sendFcmCustomBroadcast({
      targetAudience: audience,
      title: title.trim(),
      body: body.trim(),
      url: url ? url.trim() : '/',
      imageUrl: imageUrl ? imageUrl.trim() : '',
    });

    const adminName = req.user?.username || req.user?.email || 'Admin';

    const broadcastLog = await BroadcastNotification.create({
      title: title.trim(),
      body: body.trim(),
      targetAudience: audience,
      url: url ? url.trim() : '/',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      sentCount: result.sent || 0,
      failedCount: result.failed || 0,
      totalRecipients: result.totalRecipients || 0,
      sentBy: adminName,
    });

    return res.status(200).json({
      success: true,
      message: `Push notification sent to ${result.sent} recipient device(s).`,
      result,
      broadcast: broadcastLog,
    });
  } catch (err) {
    console.error('[Notifications] broadcastCustomPush error:', err);
    return res.status(500).json({ message: err.message || 'Failed to send broadcast notification.' });
  }
};

// ─── GET /api/notifications/broadcast-stats (Audience count & recent history) ──
const getBroadcastStats = async (req, res) => {
  try {
    const [customerCount, adminCount, recentBroadcasts] = await Promise.all([
      FcmToken.countDocuments({ role: 'CUSTOMER' }),
      FcmToken.countDocuments({ role: { $in: ['ADMIN', null] } }),
      BroadcastNotification.find({}).sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        customerDevicesCount: customerCount,
        adminDevicesCount: adminCount,
        totalDevicesCount: customerCount + adminCount,
      },
      recentBroadcasts,
    });
  } catch (err) {
    console.error('[Notifications] getBroadcastStats error:', err);
    return res.status(500).json({ message: 'Failed to fetch broadcast stats.' });
  }
};

// ─── POST /api/notifications/customer-fcm-token/delete (Revoke Customer FCM) ─
const deleteCustomerFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'FCM token is required to delete.' });
    }

    await FcmToken.deleteMany({ token, role: 'CUSTOMER' });

    return res.status(200).json({
      success: true,
      message: 'Customer FCM token removed successfully.',
    });
  } catch (err) {
    console.error('[Notifications] deleteCustomerFcmToken error:', err);
    return res.status(500).json({ message: 'Failed to delete customer FCM token.' });
  }
};

// ─── POST /api/notifications/fcm-token/delete (Revoke Admin FCM Token) ─────────
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
      { upsert: true, returnDocument: 'after' }
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
  getUnreadCount,
  getCustomerUnreadCount,
  getCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  saveFcmToken,
  saveCustomerFcmToken,
  deleteCustomerFcmToken,
  deleteFcmToken,
  broadcastCustomPush,
  getBroadcastStats,
  getFirebaseConfig,
  subscribePush,
  unsubscribePush,
  sendTestPush,
  getVapidKey,
};
