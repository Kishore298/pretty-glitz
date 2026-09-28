const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  
  category: { 
    type: String, 
    enum: ['Bangles', 'Artificial Flowers', 'Hair Accessories'], 
    required: true 
  },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  
  // Cloudinary image storage
  images: [{
    url: String,
    publicId: String
  }],
  
  // Bangle specifics
  sizes: [{
    size: String,
    order: Number
  }],
  
  isFlagship: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
