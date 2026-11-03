const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  trackEvent,
  getProductAnalytics,
  exportProductAnalytics,
} = require('../controllers/analyticsController');

// Ingest analytics event (supports both guest sessions and authenticated users)
router.post('/event', trackEvent);

// Admin Product Demand Analytics Dashboard
router.get('/products', protectAdmin, getProductAnalytics);

// Admin Export Analytics Report (.xlsx)
router.get('/export', protectAdmin, exportProductAnalytics);

module.exports = router;

