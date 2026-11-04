const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index automatically deletes expired records
    },
  },
  { timestamps: true }
);

// Compound query index for fast verification lookups
otpTokenSchema.index({ identifier: 1, isVerified: 1, expiresAt: -1 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);

