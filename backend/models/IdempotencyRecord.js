const mongoose = require('mongoose');

/**
 * IdempotencyRecord — Durable operation ledger.
 *
 * Guarantees exactly-once execution of cart / wishlist merges
 * even across delayed network retries and subsequent merges.
 *
 * Compound unique index on (userId, operationType, idempotencyKey)
 * ensures the same logical operation is never applied twice.
 */
const idempotencyRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    operationType: {
      type: String,
      enum: ['cart_merge', 'wishlist_merge'],
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    responseStatus: { type: Number },
    responseBody:   { type: mongoose.Schema.Types.Mixed },
    cartVersion:    { type: Number },

    // Auto-expire records after 7 days so the collection stays lean.
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, // seconds
    },
  },
  { timestamps: false } // createdAt is managed manually for the TTL index
);

// Enforces exactly-once execution per (user, operationType, key) triple.
idempotencyRecordSchema.index(
  { userId: 1, operationType: 1, idempotencyKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('IdempotencyRecord', idempotencyRecordSchema);
