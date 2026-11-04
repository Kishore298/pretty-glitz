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
      default: false, // Zero-default safeguard: must be explicitly marked in stock
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
      default: false, // If false, all sizes under this color are unavailable
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
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
