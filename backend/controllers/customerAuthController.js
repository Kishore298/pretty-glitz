const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── Helper ──────────────────────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const sanitizeUser = (user) => ({
  id:     user._id,
  name:   user.name,
  mobile: user.mobile,
  role:   user.role,
});

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/customer/auth/register
 * Body: { name, mobile, password }
 */
const register = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password)
      return res.status(400).json({ message: 'Name, mobile, and password are required.' });

    if (!/^[6-9]\d{9}$/.test(mobile))
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password))
      return res.status(400).json({
        message: 'Password must be at least 8 characters with one uppercase letter and one number.',
      });

    const exists = await User.findOne({ mobile, role: 'customer' });
    if (exists)
      return res.status(409).json({ message: 'An account with this mobile number already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ role: 'customer', name, mobile, password: hashed });

    return res.status(201).json({ token: generateToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('[customerAuth] register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/customer/auth/login
 * Body: { mobile, password }
 *
 * Special response when the account exists but has no password (legacy OTP account):
 *   { status: 'NEEDS_PASSWORD_SETUP', mobile, name }
 */
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password)
      return res.status(400).json({ message: 'Mobile and password are required.' });

    const user = await User.findOne({ mobile, role: 'customer' });
    if (!user)
      return res.status(404).json({ message: 'No account found with this mobile number. Please register.' });

    // Legacy account without a password (pre-OTP era)
    if (!user.password) {
      return res.status(200).json({
        status: 'NEEDS_PASSWORD_SETUP',
        mobile: user.mobile,
        name:   user.name,
        message: 'Welcome back! Please set a password to secure your account.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    return res.status(200).json({ token: generateToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('[customerAuth] login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ─── Set Password (legacy migration) ─────────────────────────────────────────

/**
 * POST /api/customer/auth/set-password
 * Body: { mobile, newPassword, confirmPassword }
 * For existing customers who have no password set (legacy OTP accounts).
 */
const setPassword = async (req, res) => {
  try {
    const { mobile, newPassword, confirmPassword } = req.body;

    if (!mobile || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'Mobile, new password, and confirm password are required.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword))
      return res.status(400).json({
        message: 'Password must be at least 8 characters with one uppercase letter and one number.',
      });

    const user = await User.findOne({ mobile, role: 'customer' });
    if (!user)
      return res.status(404).json({ message: 'Account not found.' });

    if (user.password)
      return res.status(400).json({ message: 'Account already has a password. Use the login page.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ token: generateToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('[customerAuth] setPassword error:', err);
    return res.status(500).json({ message: 'Server error during password setup.' });
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────

/**
 * GET /api/customer/auth/me
 * Protected — requires valid customer JWT.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[customerAuth] getMe error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, setPassword, getMe };
