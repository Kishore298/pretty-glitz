const mongoose = require('mongoose');

const colorVariantSizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      default: 0, // Zero-default safeguard: must be explicitly set by administrator
      min: 0,
    },
    price: {
      type: Number,
    },
    originalPrice: {
      type: Number,
    },
  },
  { _id: true }
);

const colorVariantSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      required: true,
      trim: true,
    },
    colorCode: {
      type: String,
      default: '', // Optional hex code / swatch e.g. #800020
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    sizes: [colorVariantSizeSchema],
    inStock: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },

    category: {
      type: String,
      required: true,
    },

    // Specific for Gift Boxes
    giftBoxDetails: { type: String },

    // Subcategory association (Artificial Flowers & Designer Glass Bangles)
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },

    // Packaging / Quantity Unit (e.g., 'Pieces', 'Dozen', 'Set') and Count
    packagingType: { type: String, trim: true, default: '' },
    packagingQuantity: { type: Number, default: 1, min: 1 },

    isOffer: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },

    // Cloudinary image storage (Base gallery)
    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    // Colour-based variations (for Designer Glass Bangles & Designer Bangles)
    colorVariants: [colorVariantSchema],

    // Size-wise stock for other bangle categories (Wedding Bangles, Antique Bangles, Valaikaappu Bangles)
    sizes: [
      {
        size: { type: String, required: true },
        order: { type: Number, default: 0 },
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0 },
      },
    ],

    // Bangle piece counts with individual pricing
    pieceCounts: [
      {
        count: Number,
        price: Number,
        originalPrice: Number,
      },
    ],

    isActive: { type: Boolean, default: true },
    inStock: { type: Boolean, default: true },
    inStockCount: { type: Number, default: null, min: 0 }, // null = untracked legacy; number = active tracking
    lowStockThreshold: { type: Number, default: null, min: 1 }, // null = fallback to global default (5)
    stockVersion: { type: Number, default: 1 }, // Optimistic Concurrency Control
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for inventory search, filtering, and sorting
productSchema.index({ category: 1, isActive: 1, inStock: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ inStockCount: 1 });
productSchema.index({ stockVersion: 1 });

module.exports = mongoose.model('Product', productSchema);
