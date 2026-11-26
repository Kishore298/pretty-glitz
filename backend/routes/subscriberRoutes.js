const express = require('express');
const router = express.Router();
const {
  subscribe,
  getSubscribers,
  deleteSubscriber,
  toggleSubscriberStatus,
} = require('../controllers/subscriberController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public route to subscribe from website banner / footer
router.post('/', subscribe);

// Admin routes to manage subscribers
router.get('/', protectAdmin, getSubscribers);
router.delete('/:id', protectAdmin, deleteSubscriber);
router.patch('/:id/status', protectAdmin, toggleSubscriberStatus);

module.exports = router;
