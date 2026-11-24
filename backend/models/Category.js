const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  bannerImage: { type: String }
}, { timestamps: true });

categorySchema.index({ order: 1 });

module.exports = mongoose.model('Category', categorySchema);
