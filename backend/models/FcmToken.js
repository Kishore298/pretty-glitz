const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'CUSTOMER'],
      default: 'ADMIN',
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    orderIds: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    deviceInfo: {
      type: String,
      default: '',
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

fcmTokenSchema.index({ orderIds: 1 });

module.exports = mongoose.model('FcmToken', fcmTokenSchema);
