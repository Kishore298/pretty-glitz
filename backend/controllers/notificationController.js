const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { getVapidPublicKey } = require('../services/pushService');

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
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ read: false });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (err) {
    console.error('[Notifications] markAsRead error:', err);
    return res.status(500).json({ message: 'Failed to update notification.' });
  }
};

// ─── PATCH /api/notifications/read-all (Mark all as read) ────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true, readAt: new Date() });
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (err) {
    console.error('[Notifications] markAllAsRead error:', err);
    return res.status(500).json({ message: 'Failed to mark all notifications as read.' });
  }
};

// ─── POST /api/notifications/subscribe (Register push subscription) ──────────
const subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Valid push subscription object is required.' });
    }

    const adminId = req.user?.userId || req.user?.id || null;
    const userAgent = req.headers['user-agent'] || '';

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        adminId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
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

// ─── GET /api/notifications/vapid-public-key ──────────────────────────────────
const getVapidKey = (req, res) => {
  const key = getVapidPublicKey();
  return res.status(200).json({ publicKey: key });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribePush,
  unsubscribePush,
  getVapidKey,
};

