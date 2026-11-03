const mongoose = require('mongoose');

/**
 * AnalyticsEvent Schema
 * 
 * Immutable event log for wishlist and cart interactions.
 * Used for authoritative rolling deduplication window checks and historical trends.
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['WISHLIST_ADD', 'WISHLIST_REMOVE', 'CART_ADD', 'CART_REMOVE'],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index for high-speed rolling deduplication lookups
analyticsEventSchema.index({
  productId: 1,
  userId: 1,
  sessionId: 1,
  eventType: 1,
  createdAt: -1,
});

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

