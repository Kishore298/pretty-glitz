const User = require('../models/User');
const jwt = require('jsonwebtoken');

// A pluggable OTP service adapter (Mocked for dev, can be swapped with MSG91, Twilio, AWS SNS)
const OtpService = {
  send: async (mobile, otp) => {
    console.log(`[OTP SERVICE] Simulating sending OTP ${otp} to mobile ${mobile}`);
    return true;
  },
  verify: async (mobile, otp, storedOtp) => {
    return otp === storedOtp;
  }
};

// Simple in-memory store for OTPs (In production, use Redis with TTL)
const otpStore = new Map();

const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number required' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store temporarily (expires in 5 mins)
    otpStore.set(mobile, otp);
    setTimeout(() => otpStore.delete(mobile), 5 * 60 * 1000);

    // Send via service
    await OtpService.send(mobile, otp);

    res.json({ message: 'OTP sent successfully' }); // Do NOT return OTP in response body in production
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    const storedOtp = otpStore.get(mobile);
    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP expired or invalid. Please resend.' });
    }

    const isValid = await OtpService.verify(mobile, otp, storedOtp);
    if (!isValid) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    // OTP Valid. Clear from store.
    otpStore.delete(mobile);

    // Find or create customer
    let user = await User.findOne({ mobile, role: 'customer' });
    if (!user) {
      user = await User.create({
        role: 'customer',
        mobile,
        name: '' // Can be updated during checkout flow
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

module.exports = { sendOtp, verifyOtp };
