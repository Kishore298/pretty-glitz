const mongoose = require('mongoose');

/**
 * Cart Item schema.
 *
 * variantKey is a normalised composite string that uniquely identifies
 * a product + size + pieceCount + color combination, making atomic operations
 * on individual line-items safe and concurrency-proof.
 *
 * Format: "<productId>::<size|NOSIZE>::<pieceCount|NOCOUNT>::<colorVariantId|NOCOLOR>"
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantKey: {
      type: String,
      required: true,
    },
    // Variation ObjectIds for immutable tracking
    colorVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    colorName: {
      type: String,
      default: null,
    },
    sizeVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    pieceCount: {
      type: Number,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // Authoritative price at the moment the item was added / last synced.
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
