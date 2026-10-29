const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, setPassword, getMe } = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/authMiddleware');

// Strict rate limiting on sensitive endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: 'Too many registration attempts. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/set-password', loginLimiter, setPassword);
router.get('/me', protectCustomer, getMe);

module.exports = router;
