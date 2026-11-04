const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    // Variation tracking for immutable audit trail
    colorVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    colorName: {
      type: String,
      default: null,
    },
    sizeVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    pieceCount: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    variantKey: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      notes: { type: String, default: '', trim: true },
    },
    items: {
      type: [orderItemSchema],
      validate: [(val) => val && val.length > 0, 'Order must contain at least one item.'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING_WHATSAPP', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING_WHATSAPP',
      index: true,
    },
    whatsappSentAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    internalNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Helpful index for admin querying by status and date
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
