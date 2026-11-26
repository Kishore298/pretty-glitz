const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    source: {
      type: String,
      default: 'exclusive_offers_banner',
      trim: true,
    },
    metadata: {
      ip: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast sorting by status & date
subscriberSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Subscriber', subscriberSchema);
