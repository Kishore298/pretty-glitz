const mongoose = require('mongoose');

/**
 * ActiveGuestSession Schema
 *
 * Tracks live unauthenticated guest carts and wishlists by persistent sessionId.
 * Synchronized seamlessly from the customer storefront so that admin product
 * demand analytics accurately reflects real-time customer intent before login.
 */
const activeGuestSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index to automatically purge inactive guest sessions after 30 days
activeGuestSessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ActiveGuestSession', activeGuestSessionSchema);
