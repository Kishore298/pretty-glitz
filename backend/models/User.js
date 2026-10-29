const mongoose = require('mongoose');

/**
 * Unified User schema for both Admin and Customer roles.
 *
 * ADMIN FIELDS (100% unchanged from original schema):
 *   - username   : admin login identifier
 *   - password   : bcrypt-hashed password (shared field used by both roles)
 *
 * CUSTOMER FIELDS:
 *   - mobile     : 10-digit Indian mobile number (unique, sparse index)
 *   - name       : display name
 *   - addresses  : saved delivery addresses
 *
 * Customers without a password (legacy OTP accounts) will have
 * password === null and must go through the set-password flow on first login.
 */
const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },

    // ── Admin Fields (PRESERVED 100% UNCHANGED) ─────────────────────────────
    username: { type: String },   // Admin login identifier
    password: { type: String },   // bcrypt hash — shared by both roles

    // ── Customer Fields ──────────────────────────────────────────────────────
    mobile: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents with no mobile (admin users)
      validate: {
        validator: (v) => v == null || /^[6-9]\d{9}$/.test(v),
        message: 'Mobile must be a valid 10-digit Indian mobile number starting with 6-9.',
      },
    },
    name: { type: String },
    addresses: [
      {
        addressLine: { type: String, required: true },
        city:        { type: String, required: true },
        pincode:     { type: String, required: true },
        isDefault:   { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
