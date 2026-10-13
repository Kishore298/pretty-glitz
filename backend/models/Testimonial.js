const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  location: { type: String },
  review: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  avatar: { url: String, publicId: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
