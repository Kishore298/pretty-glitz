const express = require('express');
const router = express.Router();
const { getConfig, sendOtp, verifyOtp } = require('../controllers/whatsappAuthController');

// Public endpoints for customer WhatsApp authentication
router.get('/config', getConfig);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;

