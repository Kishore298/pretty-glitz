const Wishlist          = require('../models/Wishlist');
const Product           = require('../models/Product');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const mongoose          = require('mongoose');

// ─── GET /api/wishlist ────────────────────────────────────────────────────────

const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.userId }).populate(
      'products',
      'name price originalPrice images inStock isActive category subcategoryId pieceCounts sizes isBestseller isOffer'
    );
    // Filter out inactive/deleted products transparently.
    const activeProducts = (wishlist?.products || []).filter(
      (p) => p && p.isActive !== false
    );
    return res.status(200).json({ products: activeProducts });
  } catch (err) {
    console.error('[wishlist] getWishlist error:', err);
    return res.status(500).json({ message: 'Failed to fetch wishlist.' });
  }
};

// ─── PUT /api/wishlist/items/:productId  (Explicit idempotent add) ────────────

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product || product.isActive === false)
      return res.status(404).json({ message: 'Product not found.' });

    await Wishlist.findOneAndUpdate(
      { userId: req.user.userId },
      { $addToSet: { products: productId } }, // $addToSet is inherently idempotent
      { upsert: true }
    );

    return res.status(200).json({ message: 'Added to wishlist.', productId });
  } catch (err) {
    console.error('[wishlist] addToWishlist error:', err);
    return res.status(500).json({ message: 'Failed to add to wishlist.' });
  }
};

// ─── DELETE /api/wishlist/items/:productId  (Explicit idempotent remove) ──────

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    await Wishlist.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { products: new mongoose.Types.ObjectId(productId) } },
      { upsert: true }
    );

    return res.status(200).json({ message: 'Removed from wishlist.', productId });
  } catch (err) {
    console.error('[wishlist] removeFromWishlist error:', err);
    return res.status(500).json({ message: 'Failed to remove from wishlist.' });
  }
};

// ─── POST /api/wishlist/merge  (Idempotent guest→user merge) ─────────────────

const mergeWishlist = async (req, res) => {
  const userId = req.user.userId;
  const { guestProductIds = [], idempotencyKey } = req.body;

  if (!idempotencyKey)
    return res.status(400).json({ message: 'idempotencyKey is required for wishlist merge.' });

  // 1. Check ledger for any previous attempt with this key.
  const existing = await IdempotencyRecord.findOne({
    userId,
    operationType: 'wishlist_merge',
    idempotencyKey,
  });
  if (existing) {
    if (existing.status === 'completed')
      return res.status(existing.responseStatus).json(existing.responseBody);
    if (existing.status === 'pending')
      return res.status(409).json({ message: 'Merge already in progress. Please retry shortly.' });
  }

  let record;
  try {
    record = await IdempotencyRecord.create({
      userId,
      operationType: 'wishlist_merge',
      idempotencyKey,
      status: 'pending',
    });
  } catch (dupErr) {
    return res.status(409).json({ message: 'Merge already in progress. Please retry shortly.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Validate guest product IDs — only keep active products.
    const validProducts = await Product.find({
      _id:      { $in: guestProductIds },
      isActive: { $ne: false },
    }).select('_id').session(session);

    const validIds = validProducts.map((p) => p._id);

    let wishlist = await Wishlist.findOne({ userId }).session(session);
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    // Merge via Set — prevents any duplicates.
    const existingSet = new Set(wishlist.products.map((id) => id.toString()));
    validIds.forEach((id) => existingSet.add(id.toString()));
    wishlist.products = [...existingSet].map((id) => new mongoose.Types.ObjectId(id));

    await wishlist.save({ session });

    const populated = await Wishlist.findById(wishlist._id)
      .populate('products', 'name price images inStock category isActive')
      .session(session);

    const activeProducts = (populated?.products || []).filter((p) => p && p.isActive !== false);
    const responsePayload = { products: activeProducts, mergedCount: validIds.length };

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
    await IdempotencyRecord.deleteOne({ _id: record._id }).catch(() => {});
    console.error('[wishlist] mergeWishlist error:', err);
    return res.status(500).json({ message: 'Failed to merge wishlist. Please try again.' });
  }
};

// ─── DELETE /api/wishlist  (Clear wishlist) ───────────────────────────────────

const clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { products: [] } },
      { upsert: true }
    );
    return res.status(200).json({ message: 'Wishlist cleared.' });
  } catch (err) {
    console.error('[wishlist] clearWishlist error:', err);
    return res.status(500).json({ message: 'Failed to clear wishlist.' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, mergeWishlist, clearWishlist };
