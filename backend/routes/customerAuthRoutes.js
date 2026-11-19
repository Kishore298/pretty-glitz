const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe } = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/authMiddleware');

// Customer MSG91 OTP Authentication Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me', protectCustomer, getMe);

module.exports = router;
