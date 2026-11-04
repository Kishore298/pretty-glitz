const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribePush,
  unsubscribePush,
  getVapidKey,
} = require('../controllers/notificationController');

// Public endpoint for admins to get VAPID public key
router.get('/vapid-public-key', getVapidKey);

// Protected Admin Notification endpoints
router.get('/', protectAdmin, getNotifications);
router.patch('/read-all', protectAdmin, markAllAsRead);
router.patch('/:id/read', protectAdmin, markAsRead);
router.post('/subscribe', protectAdmin, subscribePush);
router.post('/unsubscribe', protectAdmin, unsubscribePush);

module.exports = router;

