const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/notificationController');

// Public endpoint for admins to get public keys / config
router.get('/vapid-public-key', getVapidKey);
router.get('/firebase-config', getFirebaseConfig);

// Protected Admin Notification endpoints
router.get('/', protectAdmin, getNotifications);
router.patch('/read-all', protectAdmin, markAllAsRead);
router.patch('/:id/read', protectAdmin, markAsRead);

// Firebase Cloud Messaging (FCM) routes
router.post('/fcm-token', protectAdmin, saveFcmToken);
router.post('/fcm-token/delete', protectAdmin, deleteFcmToken);

// W3C Web Push routes (dual fallback)
router.post('/subscribe', protectAdmin, subscribePush);
router.post('/unsubscribe', protectAdmin, unsubscribePush);

// Test alert dispatch
router.post('/test-push', protectAdmin, sendTestPush);

module.exports = router;
