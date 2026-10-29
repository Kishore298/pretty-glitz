const Cart              = require('../models/Cart');
const Product           = require('../models/Product');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const mongoose          = require('mongoose');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a normalised variant key so that each product+size+pieceCount
 * combination maps to exactly one string. Used for atomic conditional updates.
 */
const buildVariantKey = (productId, size, pieceCount) =>
  `${productId}::${size || 'NOSIZE'}::${pieceCount ?? 'NOCOUNT'}`;

/**
 * Resolve authoritative price from the database record.
 * Client-submitted prices are NEVER trusted.
 */
const resolvePrice = (product, pieceCount) => {
  if (pieceCount != null && product.pieceCounts?.length > 0) {
    const pc = product.pieceCounts.find((p) => p.count === pieceCount);
    if (pc) return pc.price;
  }
  return product.price;
};

/**
 * Validate a product can be added to cart.
 * Strict check — never treats inStockCount: 0 as a fallback.
 * Returns { ok: true, availableStock } or { ok: false, reason }.
 */
const validateStock = (product, requestedQty = 1) => {
  if (!product || product.isActive === false || product.inStock === false) {
    return { ok: false, reason: 'Product is not available.' };
  }
  // If inStockCount is tracked, enforce it strictly.
  if (typeof product.inStockCount === 'number') {
    if (product.inStockCount <= 0) {
      return { ok: false, reason: 'Product is out of stock.' };
    }
    const available = product.inStockCount;
    const allowed   = Math.min(requestedQty, available);
    return { ok: true, availableStock: available, allowedQty: allowed };
  }
  // inStockCount not tracked — rely on the boolean flag only.
  return { ok: true, availableStock: null, allowedQty: requestedQty };
};

// ─── GET /api/cart ────────────────────────────────────────────────────────────

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate(
      'items.product',
      'name price originalPrice images inStock inStockCount category subcategoryId pieceCounts sizes isActive'
    );
    return res.status(200).json({ cart: cart || { userId: req.user.userId, items: [] } });
  } catch (err) {
    console.error('[cart] getCart error:', err);
    return res.status(500).json({ message: 'Failed to fetch cart.' });
  }
};

// ─── POST /api/cart/items  (Add single item) ──────────────────────────────────

const addItem = async (req, res) => {
  try {
    const { productId, size = null, pieceCount = null, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required.' });

    const product = await Product.findById(productId);
    const check   = validateStock(product, quantity);
    if (!check.ok) return res.status(400).json({ message: check.reason });

    const variantKey      = buildVariantKey(productId, size, pieceCount);
    const authPrice       = resolvePrice(product, pieceCount);
    const allowedQty      = check.allowedQty;
    const availableStock  = check.availableStock;

    // Attempt to increment existing variant without exceeding stock.
    const stockCeil = availableStock ?? 9999;
    let updated = await Cart.findOneAndUpdate(
      {
        userId:            req.user.userId,
        'items.variantKey': variantKey,
        'items.quantity':   { $lte: stockCeil - allowedQty },
      },
      {
        $inc: { 'items.$.quantity': allowedQty },
        $set: { 'items.$.price': authPrice },
      },
      { new: true }
    ).populate('items.product', 'name price images inStock category');

    if (!updated) {
      // Variant doesn't exist yet — push it (guarded against duplicate variantKey).
      updated = await Cart.findOneAndUpdate(
        { userId: req.user.userId, 'items.variantKey': { $ne: variantKey } },
        {
          $push: {
            items: {
              product:    product._id,
              variantKey,
              size,
              pieceCount,
              quantity:   allowedQty,
              price:      authPrice,
            },
          },
        },
        { new: true, upsert: true }
      ).populate('items.product', 'name price images inStock category');
    }

    return res.status(200).json({ cart: updated });
  } catch (err) {
    console.error('[cart] addItem error:', err);
    return res.status(500).json({ message: 'Failed to add item to cart.' });
  }
};

// ─── PUT /api/cart/items/:variantKey  (Update quantity) ───────────────────────

const updateItem = async (req, res) => {
  try {
    const { variantKey } = req.params;
    const { quantity }   = req.body;

    if (quantity == null) return res.status(400).json({ message: 'quantity is required.' });

    if (quantity <= 0) {
      // Treat as remove
      const updated = await Cart.findOneAndUpdate(
        { userId: req.user.userId },
        { $pull: { items: { variantKey } } },
        { new: true }
      ).populate('items.product', 'name price images inStock category');
      return res.status(200).json({ cart: updated });
    }

    // Fetch the product to validate stock
    const cartDoc = await Cart.findOne({ userId: req.user.userId, 'items.variantKey': variantKey });
    if (!cartDoc) return res.status(404).json({ message: 'Cart item not found.' });

    const item    = cartDoc.items.find((i) => i.variantKey === variantKey);
    const product = await Product.findById(item.product);
    const check   = validateStock(product, quantity);
    if (!check.ok) return res.status(400).json({ message: check.reason });

    const finalQty = check.availableStock != null
      ? Math.min(quantity, check.availableStock)
      : quantity;

    const updated = await Cart.findOneAndUpdate(
      { userId: req.user.userId, 'items.variantKey': variantKey },
      { $set: { 'items.$.quantity': finalQty } },
      { new: true }
    ).populate('items.product', 'name price images inStock category');

    return res.status(200).json({ cart: updated });
  } catch (err) {
    console.error('[cart] updateItem error:', err);
    return res.status(500).json({ message: 'Failed to update cart item.' });
  }
};

// ─── DELETE /api/cart/items/:variantKey  (Remove single item) ─────────────────

const removeItem = async (req, res) => {
  try {
    const { variantKey } = req.params;
    const updated = await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { items: { variantKey } } },
      { new: true }
    ).populate('items.product', 'name price images inStock category');
    return res.status(200).json({ cart: updated || { items: [] } });
  } catch (err) {
    console.error('[cart] removeItem error:', err);
    return res.status(500).json({ message: 'Failed to remove cart item.' });
  }
};

// ─── POST /api/cart/merge  (Idempotent guest→user merge) ──────────────────────

const mergeCart = async (req, res) => {
  const userId = req.user.userId;
  const { guestItems = [], idempotencyKey } = req.body;

  if (!idempotencyKey)
    return res.status(400).json({ message: 'idempotencyKey is required for cart merge.' });

  // 1. Check the durable ledger — return cached result for any retry of any key.
  const existing = await IdempotencyRecord.findOne({
    userId,
    operationType: 'cart_merge',
    idempotencyKey,
  });
  if (existing) {
    if (existing.status === 'completed')
      return res.status(existing.responseStatus).json(existing.responseBody);
    if (existing.status === 'pending')
      return res.status(409).json({ message: 'Merge already in progress. Please retry shortly.' });
  }

  // 2. Reserve the idempotency slot (unique index prevents duplicate concurrent inserts).
  let record;
  try {
    record = await IdempotencyRecord.create({
      userId,
      operationType: 'cart_merge',
      idempotencyKey,
      status: 'pending',
    });
  } catch (dupErr) {
    // Another concurrent request already created the record.
    return res.status(409).json({ message: 'Merge already in progress. Please retry shortly.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let userCart = await Cart.findOne({ userId }).session(session);
    if (!userCart) {
      userCart = new Cart({ userId, items: [] });
    }

    const skipped = [];

    for (const gItem of guestItems) {
      const productId = gItem.product?._id || gItem.product;
      if (!productId) continue;

      const product = await Product.findById(productId).session(session);
      const check   = validateStock(product, gItem.quantity || 1);
      if (!check.ok) { skipped.push({ productId, reason: check.reason }); continue; }

      const size       = gItem.size       || null;
      const pieceCount = gItem.pieceCount ?? null;
      const variantKey = buildVariantKey(productId, size, pieceCount);
      const authPrice  = resolvePrice(product, pieceCount);
      const gQty       = gItem.quantity || 1;
      const stockCeil  = check.availableStock ?? 9999;

      const idx = userCart.items.findIndex((i) => i.variantKey === variantKey);
      if (idx >= 0) {
        const combined = userCart.items[idx].quantity + gQty;
        userCart.items[idx].quantity = Math.min(combined, stockCeil);
        userCart.items[idx].price    = authPrice; // refresh to live price
      } else {
        userCart.items.push({
          product:    product._id,
          variantKey,
          size,
          pieceCount,
          quantity:   Math.min(gQty, stockCeil),
          price:      authPrice,
        });
      }
    }

    await userCart.save({ session });

    const populated = await Cart.findById(userCart._id)
      .populate('items.product', 'name price images inStock category subcategoryId')
      .session(session);

    const responsePayload = {
      cart:         populated,
      mergedCount:  guestItems.length - skipped.length,
      skipped,
    };

    // 3. Mark ledger record as completed (inside same transaction).
    record.status         = 'completed';
    record.responseStatus = 200;
    record.responseBody   = responsePayload;
    await record.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(responsePayload);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    // Roll back the pending record so the client can retry with the same key.
    await IdempotencyRecord.deleteOne({ _id: record._id }).catch(() => {});
    console.error('[cart] mergeCart error:', err);
    return res.status(500).json({ message: 'Failed to merge cart. Please try again.' });
  }
};

// ─── DELETE /api/cart  (Clear entire cart) ────────────────────────────────────

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { items: [] } },
      { new: true }
    );
    return res.status(200).json({ message: 'Cart cleared.' });
  } catch (err) {
    console.error('[cart] clearCart error:', err);
    return res.status(500).json({ message: 'Failed to clear cart.' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, mergeCart, clearCart };
