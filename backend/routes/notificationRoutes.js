const express = require('express');
const router = express.Router();
const { protectAdmin, protectCustomer } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/notificationController');

// Public endpoints for clients to get public keys / config and register tokens
router.get('/vapid-public-key', getVapidKey);
router.get('/firebase-config', getFirebaseConfig);
router.post('/customer-fcm-token', saveCustomerFcmToken);
router.post('/customer-fcm-token/delete', deleteCustomerFcmToken);

// Protected Customer Notification polling & action endpoints
router.get('/customer/unread-count', protectCustomer, getCustomerUnreadCount);
router.get('/customer', protectCustomer, getCustomerNotifications);
router.patch('/customer/read-all', protectCustomer, markAllCustomerNotificationsRead);
router.patch('/customer/:id/read', protectCustomer, markCustomerNotificationRead);

// Protected Admin Notification endpoints
router.get('/unread-count', protectAdmin, getUnreadCount);
router.get('/', protectAdmin, getNotifications);
router.patch('/read-all', protectAdmin, markAllAsRead);
router.patch('/mark-all-read', protectAdmin, markAllAsRead);
router.patch('/:id/read', protectAdmin, markAsRead);
router.delete('/:id', protectAdmin, deleteNotification);
router.delete('/', protectAdmin, deleteAllNotifications);

// Custom Push Broadcast routes (Admin only)
router.post('/broadcast', protectAdmin, broadcastCustomPush);
router.get('/broadcast-stats', protectAdmin, getBroadcastStats);

// Firebase Cloud Messaging (FCM) routes for Admin
router.post('/fcm-token', protectAdmin, saveFcmToken);
router.post('/fcm-token/delete', protectAdmin, deleteFcmToken);

// W3C Web Push routes (dual fallback)
router.post('/subscribe', protectAdmin, subscribePush);
router.post('/unsubscribe', protectAdmin, unsubscribePush);

// Test alert dispatch
router.post('/test-push', protectAdmin, sendTestPush);

module.exports = router;
