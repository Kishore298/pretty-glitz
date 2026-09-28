const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['customer', 'admin'], required: true },
  
  // For Admin
  username: { type: String },
  password: { type: String }, // Hashed
  
  // For Customer
  mobile: { type: String, unique: true, sparse: true },
  name: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
