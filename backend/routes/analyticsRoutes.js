const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  trackEvent,
  syncGuestSession,
  getProductAnalytics,
  exportProductAnalytics,
  recordPageVisit,
  getPageAnalytics,
  resetTrafficAnalytics,
} = require('../controllers/analyticsController');

// Record device page visit & time spent (open to customer frontend)
router.post('/page-visit', recordPageVisit);

// Ingest analytics event (supports both guest sessions and authenticated users)
router.post('/event', trackEvent);

// Synchronize live guest wishlist and cart items
router.post('/sync-guest', syncGuestSession);

// Admin Page & Device Traffic Analytics
router.get('/traffic', protectAdmin, getPageAnalytics);
router.delete('/traffic/reset', protectAdmin, resetTrafficAnalytics);

// Admin Product Demand Analytics Dashboard
router.get('/products', protectAdmin, getProductAnalytics);

// Admin Export Analytics Report (.xlsx)
router.get('/export', protectAdmin, exportProductAnalytics);

module.exports = router;

