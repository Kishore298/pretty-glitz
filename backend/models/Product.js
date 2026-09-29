const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  
  category: { 
    type: String, 
    required: true 
  },
  
  // Specific for Gift Boxes
  giftBoxDetails: { type: String },
  
  // Specific for Artificial Flowers
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  
  isOffer: { type: Boolean, default: false },
  
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
  inStock: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
