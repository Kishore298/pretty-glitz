const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },

    variantType: {
      type: String,
      enum: ['SIMPLE', 'SIZE', 'COLOR_SIZE'],
      required: true,
    },
    colorVariantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    sizeVariantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    colorName: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: '',
    },

    previousStock: {
      type: Number,
      default: null, // null if previously untracked legacy
    },
    updatedStock: {
      type: Number,
      required: true,
    },
    quantityChanged: {
      type: Number,
      required: true, // positive for restock / addition; negative for deduction
    },

    operation: {
      type: String,
      enum: ['SET_STOCK', 'ADJUST_STOCK', 'ORDER_DEDUCTION', 'ORDER_CANCEL_RESTORE', 'INITIAL_MIGRATION'],
      required: true,
    },
    source: {
      type: String,
      enum: ['MANUAL_ADMIN', 'BULK_ADMIN', 'CSV_IMPORT', 'ORDER_DEDUCTION', 'ORDER_CANCEL_RESTORE', 'SYSTEM'],
      required: true,
    },
    reason: {
      type: String,
      default: 'Manual stock adjustment',
    },
    referenceId: {
      type: String,
      default: '',
      index: true,
    },

    adminUsername: {
      type: String,
      default: 'System',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ createdAt: -1 });
inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
