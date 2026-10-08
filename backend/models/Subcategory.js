const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  bannerImage: { type: String },
  order: { type: Number, default: 0 },
  category: { type: String, default: 'artifical flowers' }
}, { timestamps: true });

module.exports = mongoose.model('Subcategory', subcategorySchema);
