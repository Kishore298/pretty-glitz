const mongoose = require('mongoose');

/**
 * PageVisit Schema
 *
 * Tracks unique device page views and time spent on pages.
 * Deduplicated strictly by physical deviceId per page and site-wide.
 */
const pageVisitSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    pageTitle: {
      type: String,
      default: '',
      trim: true,
    },
    platform: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'mobile',
    },
    visitDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    hits: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee 1 record per device per path per calendar day
pageVisitSchema.index({ deviceId: 1, path: 1, visitDate: 1 }, { unique: true });
pageVisitSchema.index({ path: 1, visitDate: 1 });

module.exports = mongoose.model('PageVisit', pageVisitSchema);
