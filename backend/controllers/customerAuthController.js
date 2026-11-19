const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const { sendMsg91Otp, verifyMsg91Otp } = require('../services/msg91OtpService');

// ─── Token & Sanitization Helpers ─────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, mobile: user.mobile },
    process.env.JWT_SECRET || 'prettyglitz_jwt_secret_dev',
    { expiresIn: '30d' }
  );

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name || 'Customer',
  mobile: user.mobile,
  role: user.role,
  addresses: user.addresses || [],
  createdAt: user.createdAt,
});

// ─── Send OTP via MSG91 API (with 1234 test login supported) ───────────────────

/**
 * POST /api/customer/auth/send-otp
 * Body: { mobile }
 */
const sendOtp = async (req, res) => {
  try {
    const rawMobile = req.body.mobile || req.body.phone;
    if (!rawMobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    const cleanMobile = String(rawMobile).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Cooldown rate limit (30 seconds)
    const recentToken = await OtpToken.findOne({
      identifier: cleanMobile,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentToken) {
      const waitSeconds = Math.ceil(
        (recentToken.createdAt.getTime() + 30 * 1000 - Date.now()) / 1000
      );
      return res.status(429).json({
        message: `Please wait ${waitSeconds}s before requesting a new code.`,
        retryAfter: waitSeconds,
      });
    }

    // Invalidate previous unverified tokens
    await OtpToken.updateMany(
      { identifier: cleanMobile, isVerified: false },
      { $set: { isVerified: true } }
    );

    // Generate random 4-digit OTP or test code
    const rawOtp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    // Store in OtpToken
    await OtpToken.create({
      identifier: cleanMobile,
      hashedOtp,
      attempts: 0,
      isVerified: false,
      expiresAt,
    });

    // Send via MSG91 OTP service
    const dispatchResult = await sendMsg91Otp(cleanMobile, rawOtp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your mobile number. Use 1234 to log in.',
      cooldownSeconds: 30,
      simulated: dispatchResult.simulated || false,
    });
  } catch (err) {
    console.error('[customerAuth] sendOtp error:', err);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// ─── Verify OTP & Login / Auto-Register Customer ──────────────────────────────

/**
 * POST /api/customer/auth/verify-otp
 * Body: { mobile, otp, name }
 */
const verifyOtp = async (req, res) => {
  try {
    const rawMobile = req.body.mobile || req.body.phone;
    const { otp, name } = req.body;

    if (!rawMobile || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required.' });
    }

    const cleanMobile = String(rawMobile).replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    let isValid = false;

    // 1. Instant test OTP bypass check: 1234 is ALWAYS valid as instructed
    if (cleanOtp === '1234') {
      isValid = true;
    } else {
      // 2. Check MSG91 API verification
      const msg91Res = await verifyMsg91Otp(cleanMobile, cleanOtp);
      if (msg91Res.verified) {
        isValid = true;
      } else {
        // 3. Fallback: check database stored OTP token
        const activeToken = await OtpToken.findOne({
          identifier: cleanMobile,
          isVerified: false,
          expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (activeToken) {
          if (activeToken.attempts >= 5) {
            return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
          }
          const isMatch = await bcrypt.compare(cleanOtp, activeToken.hashedOtp);
          if (isMatch) {
            isValid = true;
            activeToken.isVerified = true;
            await activeToken.save();
          } else {
            activeToken.attempts += 1;
            await activeToken.save();
          }
        }
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP code. Please enter 1234 or the code sent to your phone.' });
    }

    // Invalidate remaining tokens for this number
    await OtpToken.updateMany(
      { identifier: cleanMobile, isVerified: false },
      { $set: { isVerified: true } }
    );

    // Find or automatically create the customer account
    let user = await User.findOne({ mobile: cleanMobile, role: 'customer' });

    if (!user) {
      const customerName = (name && String(name).trim()) || 'Customer';
      user = await User.create({
        role: 'customer',
        name: customerName,
        mobile: cleanMobile,
      });
    } else if (name && String(name).trim() && user.name === 'Customer') {
      // Update name if user previously had placeholder name
      user.name = String(name).trim();
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
      message: 'Login successful!',
    });
  } catch (err) {
    console.error('[customerAuth] verifyOtp error:', err);
    return res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

// ─── Current Authenticated User (GET /api/customer/auth/me) ──────────────────

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[customerAuth] getMe error:', err);
    return res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
};
