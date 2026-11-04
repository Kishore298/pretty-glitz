const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OtpToken = require('../models/OtpToken');
const User = require('../models/User');
const { isWhatsAppOtpEnabled, sendWhatsAppOtp } = require('../services/whatsappOtpService');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  mobile: user.mobile,
  role: user.role,
});

/**
 * GET /api/customer/whatsapp-auth/config
 * Returns whether WhatsApp OTP login is currently enabled via WABA feature flag.
 */
const getConfig = (req, res) => {
  return res.json({
    enabled: isWhatsAppOtpEnabled(),
  });
};

/**
 * POST /api/customer/whatsapp-auth/send-otp
 * Body: { mobile }
 */
const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // 1. Enforce 60-second cooldown rate limiting
    const recentToken = await OtpToken.findOne({
      identifier: cleanMobile,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentToken) {
      const waitSeconds = Math.ceil(
        (recentToken.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000
      );
      return res.status(429).json({
        message: `Please wait ${waitSeconds}s before requesting another code.`,
        retryAfter: waitSeconds,
      });
    }

    // 2. Invalidate any prior active tokens for this number
    await OtpToken.updateMany(
      { identifier: cleanMobile, isVerified: false },
      { $set: { isVerified: true } }
    );

    // 3. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // 4. Save OtpToken
    await OtpToken.create({
      identifier: cleanMobile,
      hashedOtp,
      attempts: 0,
      isVerified: false,
      expiresAt,
    });

    // 5. Send via WhatsApp service (or simulation if flag off)
    const sendResult = await sendWhatsAppOtp(cleanMobile, rawOtp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your WhatsApp number.',
      cooldownSeconds: 60,
      simulated: sendResult.simulated || false,
      devOtp: sendResult.otp, // Only populated in non-production simulation
    });
  } catch (err) {
    console.error('[WhatsAppAuth] sendOtp error:', err);
    return res.status(500).json({ message: 'Failed to dispatch WhatsApp OTP. Please try again.' });
  }
};

/**
 * POST /api/customer/whatsapp-auth/verify-otp
 * Body: { mobile, otp }
 */
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number.' });
    }

    // 1. Find active, unverified, unexpired token
    const tokenDoc = await OtpToken.findOne({
      identifier: cleanMobile,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!tokenDoc) {
      return res.status(400).json({
        message: 'OTP has expired or was not found. Please request a new OTP.',
      });
    }

    // 2. Check failed attempts safeguard (max 3)
    if (tokenDoc.attempts >= 3) {
      await OtpToken.findByIdAndUpdate(tokenDoc._id, { $set: { isVerified: true } });
      return res.status(400).json({
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // 3. Compare OTP hash
    const isMatch = await bcrypt.compare(cleanOtp, tokenDoc.hashedOtp);

    if (!isMatch) {
      const nextAttempts = tokenDoc.attempts + 1;
      const shouldBurn = nextAttempts >= 3;

      await OtpToken.findByIdAndUpdate(tokenDoc._id, {
        $inc: { attempts: 1 },
        ...(shouldBurn ? { $set: { isVerified: true } } : {}),
      });

      if (shouldBurn) {
        return res.status(400).json({
          message: 'Incorrect OTP. Maximum attempts exceeded. Please request a new OTP.',
        });
      }

      return res.status(400).json({
        message: `Incorrect OTP. ${3 - nextAttempts} attempts remaining.`,
      });
    }

    // 4. Atomic single-use burn
    await OtpToken.findByIdAndUpdate(tokenDoc._id, { $set: { isVerified: true } });

    // 5. Find or create Customer user
    let user = await User.findOne({ mobile: cleanMobile, role: 'customer' });
    if (!user) {
      user = await User.create({
        role: 'customer',
        mobile: cleanMobile,
        name: `Customer ${cleanMobile.slice(-4)}`,
      });
    }

    // 6. Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[WhatsAppAuth] verifyOtp error:', err);
    return res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

module.exports = {
  getConfig,
  sendOtp,
  verifyOtp,
};

