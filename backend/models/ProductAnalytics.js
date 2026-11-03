const mongoose = require('mongoose');

/**
 * ProductAnalytics Schema
 * 
 * Maintains lifetime cumulative event statistics for each product.
 * Incremented atomically upon confirmed AnalyticsEvent creation.
 */
const productAnalyticsSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    lifetimeWishlistAdds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeWishlistRemoves: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeCartAdds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeCartQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeCartRemoves: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEventAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductAnalytics', productAnalyticsSchema);

