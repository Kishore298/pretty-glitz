const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  createAndSendCampaign,
  testCampaign,
} = require('../controllers/campaignController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Admin protected routes for campaign management
router.get('/', protectAdmin, getCampaigns);
router.post('/', protectAdmin, createAndSendCampaign);
router.post('/test', protectAdmin, testCampaign);

module.exports = router;
