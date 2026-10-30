const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String },
  // Separate images for different breakpoints
  mobileImage: { url: String, publicId: String },
  tabletImage: { url: String, publicId: String },
  desktopImage: { url: String, publicId: String },
  linkTo: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
