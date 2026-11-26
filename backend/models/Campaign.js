const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'WHATSAPP'],
      required: [true, 'Campaign channel is required'],
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Campaign content is required'],
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    targetAudience: {
      type: String,
      default: 'all_subscribers',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENDING', 'SENT', 'FAILED', 'PARTIAL'],
      default: 'SENT',
    },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    logs: [
      {
        recipient: { type: String, required: true },
        status: { type: String, enum: ['SENT', 'FAILED', 'SIMULATED'], default: 'SENT' },
        error: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ channel: 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
