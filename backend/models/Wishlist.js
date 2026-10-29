const mongoose = require('mongoose');

/**
 * Wishlist schema.
 *
 * Products are stored as ObjectId references so they can be populated
 * with live product data on demand.
 *
 * Idempotency for merge operations is handled by the IdempotencyRecord
 * collection rather than a field on this document, which allows the ledger
 * to survive across multiple sequential merges.
 */
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
