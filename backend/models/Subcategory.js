const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: 'Designer Glass Bangles',
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

subcategorySchema.index({ category: 1, order: 1 });

module.exports = mongoose.model('Subcategory', subcategorySchema);
