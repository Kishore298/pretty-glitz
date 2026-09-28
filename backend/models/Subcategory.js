const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Bangles', 'Artificial Flowers', 'Hair Accessories'], 
    required: true 
  },
  order: { type: Number, default: 0 } // For drag-and-drop reordering
}, { timestamps: true });

module.exports = mongoose.model('Subcategory', subcategorySchema);
