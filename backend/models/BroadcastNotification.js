const mongoose = require('mongoose');

const broadcastNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'CUSTOMERS', 'ADMINS'],
      default: 'CUSTOMERS',
    },
    url: {
      type: String,
      default: '/',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    sentBy: {
      type: String,
      default: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BroadcastNotification', broadcastNotificationSchema);
