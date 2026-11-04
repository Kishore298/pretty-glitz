const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ProductAnalytics = require('../models/ProductAnalytics');
const AnalyticsEvent = require('../models/AnalyticsEvent');

// Configurable rolling deduplication window (default 24 hours)
const COOLDOWN_HOURS = parseInt(process.env.ANALYTICS_COOLDOWN_HOURS || '24', 10);
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

// Helper: Safely extract customer userId from optional Authorization header
const extractUserId = (req) => {
  if (req.user && req.user.userId) return req.user.userId;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.userId) return decoded.userId;
    } catch {
      // Invalid/expired token — proceed as guest
    }
  }
  return null;
};

// ─── POST /api/analytics/event ────────────────────────────────────────────────
// Records a wishlist or cart event with server-side rolling deduplication
const trackEvent = async (req, res) => {
  try {
    const { productId, eventType, sessionId, quantity = 1, metadata = {} } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required.' });
    }

    const validEventTypes = ['WISHLIST_ADD', 'WISHLIST_REMOVE', 'CART_ADD', 'CART_REMOVE'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({ message: `Invalid eventType. Allowed: ${validEventTypes.join(', ')}` });
    }

    const userId = extractUserId(req);

    // Require either userId or sessionId to prevent untracked spoofing
    if (!userId && !sessionId) {
      return res.status(400).json({ message: 'Either authenticated user or sessionId is required.' });
    }

    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const cooldownThreshold = new Date(Date.now() - COOLDOWN_MS);

    // Build rolling window query for identical action
    const queryConditions = [];
    if (userId) queryConditions.push({ userId });
    if (sessionId) queryConditions.push({ sessionId });

    const recentDuplicate = await AnalyticsEvent.findOne({
      productId,
      eventType,
      $or: queryConditions,
      createdAt: { $gte: cooldownThreshold },
    });

    if (recentDuplicate) {
      // Server-side deduplication triggered — event not double-counted
      return res.status(200).json({
        success: true,
        deduplicated: true,
        message: 'Event recorded within cooldown window; counter not inflated.',
      });
    }

    // Try MongoDB session for transaction if replica set is configured
    let session = null;
    let usedTransaction = false;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      usedTransaction = true;
    } catch {
      // Standalone MongoDB instance — fallback to atomic sequential execution
      session = null;
    }

    try {
      // 1. Insert immutable AnalyticsEvent
      const eventDoc = new AnalyticsEvent({
        productId,
        userId: userId || null,
        sessionId: sessionId || null,
        eventType,
        quantity: parsedQty,
        metadata: metadata || {},
      });

      if (usedTransaction) {
        await eventDoc.save({ session });
      } else {
        await eventDoc.save();
      }

      // 2. Atomically update ProductAnalytics lifetime ledger
      const incUpdate = {};
      if (eventType === 'WISHLIST_ADD') incUpdate.lifetimeWishlistAdds = 1;
      else if (eventType === 'WISHLIST_REMOVE') incUpdate.lifetimeWishlistRemoves = 1;
      else if (eventType === 'CART_ADD') {
        incUpdate.lifetimeCartAdds = 1;
        incUpdate.lifetimeCartQty = parsedQty;
      } else if (eventType === 'CART_REMOVE') incUpdate.lifetimeCartRemoves = 1;

      const updateQuery = {
        $inc: incUpdate,
        $set: { lastEventAt: new Date() },
      };

      if (usedTransaction) {
        await ProductAnalytics.findOneAndUpdate(
          { productId },
          updateQuery,
          { upsert: true, returnDocument: 'after', session }
        );
        await session.commitTransaction();
      } else {
        await ProductAnalytics.findOneAndUpdate(
          { productId },
          updateQuery,
          { upsert: true, returnDocument: 'after' }
        );
      }

      return res.status(201).json({
        success: true,
        deduplicated: false,
        message: 'Event successfully tracked.',
      });
    } catch (innerErr) {
      if (usedTransaction && session) {
        await session.abortTransaction();
      }
      throw innerErr;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (err) {
    console.error('[analytics] trackEvent error:', err);
    return res.status(500).json({ message: 'Failed to record analytics event.' });
  }
};

// ─── GET /api/analytics/products ──────────────────────────────────────────────
// Aggregates live active counts with lifetime metrics and opportunity detection
const getProductAnalytics = async (req, res) => {
  try {
    const {
      search = '',
      category = 'ALL',
      stockStatus = 'ALL',
      filterType = 'ALL', // 'ALL' | 'HIGH_DEMAND' | 'OPPORTUNITY'
      sortBy = 'demandScore', // 'demandScore' | 'activeWishlist' | 'activeCart' | 'lifetimeWishlist' | 'lifetimeCart' | 'name' | 'price'
      sortOrder = 'desc', // 'asc' | 'desc'
      startDate,
      endDate,
    } = req.query;

    // 1. Fetch base products
    const productQuery = {};
    if (search.trim()) {
      productQuery.name = { $regex: search.trim(), $options: 'i' };
    }
    if (category && category !== 'ALL') {
      productQuery.category = category;
    }
    if (stockStatus === 'IN_STOCK') {
      productQuery.inStock = true;
    } else if (stockStatus === 'OUT_OF_STOCK') {
      productQuery.inStock = false;
    }

    const products = await Product.find(productQuery)
      .select('name category price originalPrice images inStock isActive createdAt')
      .lean();

    if (!products || products.length === 0) {
      return res.status(200).json({
        summary: {
          totalProducts: 0,
          totalActiveWishlistCount: 0,
          totalActiveCartUsers: 0,
          totalActiveCartUnits: 0,
          topWishlistedProduct: null,
          topCartedProduct: null,
        },
        products: [],
      });
    }

    // 2. Aggregate active wishlist counts from Wishlist collection
    const activeWishlistAgg = await Wishlist.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products',
          activeWishlistCount: { $sum: 1 },
        },
      },
    ]);
    const activeWishlistMap = new Map();
    activeWishlistAgg.forEach((w) => {
      activeWishlistMap.set(w._id.toString(), w.activeWishlistCount);
    });

    // 3. Aggregate active cart counts from Cart collection
    const activeCartAgg = await Cart.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          usersSet: { $addToSet: '$userId' },
          totalUnits: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          _id: 1,
          activeCartUsers: { $size: '$usersSet' },
          activeCartUnits: '$totalUnits',
        },
      },
    ]);
    const activeCartMap = new Map();
    activeCartAgg.forEach((c) => {
      activeCartMap.set(c._id.toString(), {
        activeCartUsers: c.activeCartUsers,
        activeCartUnits: c.activeCartUnits,
      });
    });

    // 4. Fetch lifetime stats from ProductAnalytics
    const lifetimeStats = await ProductAnalytics.find({}).lean();
    const lifetimeMap = new Map();
    lifetimeStats.forEach((p) => {
      lifetimeMap.set(p.productId.toString(), p);
    });

    // 5. Optional historical date-range aggregation from AnalyticsEvent
    let dateRangeEventMap = null;
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = eDate;
      }

      const rangeAgg = await AnalyticsEvent.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: { productId: '$productId', eventType: '$eventType' },
            count: { $sum: 1 },
            qty: { $sum: '$quantity' },
          },
        },
      ]);

      dateRangeEventMap = new Map();
      rangeAgg.forEach((r) => {
        const pId = r._id.productId.toString();
        if (!dateRangeEventMap.has(pId)) {
          dateRangeEventMap.set(pId, {
            rangeWishlistAdds: 0,
            rangeCartAdds: 0,
            rangeCartUnits: 0,
          });
        }
        const item = dateRangeEventMap.get(pId);
        if (r._id.eventType === 'WISHLIST_ADD') item.rangeWishlistAdds = r.count;
        if (r._id.eventType === 'CART_ADD') {
          item.rangeCartAdds = r.count;
          item.rangeCartUnits = r.qty;
        }
      });
    }

    // 6. Assemble merged analytics rows
    let enriched = products.map((prod) => {
      const pId = prod._id.toString();
      const activeWish = activeWishlistMap.get(pId) || 0;
      const cartData = activeCartMap.get(pId) || { activeCartUsers: 0, activeCartUnits: 0 };
      const lifetime = lifetimeMap.get(pId) || {
        lifetimeWishlistAdds: 0,
        lifetimeCartAdds: 0,
        lifetimeCartQty: 0,
        lifetimeWishlistRemoves: 0,
        lifetimeCartRemoves: 0,
      };

      const rangeData = dateRangeEventMap ? dateRangeEventMap.get(pId) || null : null;

      // Demand score calculation
      const demandScore = Math.round(
        activeWish * 2.5 +
        cartData.activeCartUsers * 4.0 +
        lifetime.lifetimeWishlistAdds * 0.5 +
        lifetime.lifetimeCartAdds * 1.0
      );

      // Opportunity Detection: High interest in wishlist, but 0 or low cart conversion
      const isOpportunity = activeWish >= 2 && cartData.activeCartUsers <= 1;
      const isHighDemand = demandScore >= 10 || activeWish >= 3 || cartData.activeCartUsers >= 2;

      return {
        _id: prod._id,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice,
        inStock: prod.inStock,
        isActive: prod.isActive,
        image: prod.images?.[0]?.url || '',
        activeWishlistCount: activeWish,
        activeCartUsers: cartData.activeCartUsers,
        activeCartUnits: cartData.activeCartUnits,
        lifetimeWishlistAdds: lifetime.lifetimeWishlistAdds || 0,
        lifetimeCartAdds: lifetime.lifetimeCartAdds || 0,
        lifetimeCartQty: lifetime.lifetimeCartQty || 0,
        lifetimeWishlistRemoves: lifetime.lifetimeWishlistRemoves || 0,
        lifetimeCartRemoves: lifetime.lifetimeCartRemoves || 0,
        demandScore,
        isOpportunity,
        isHighDemand,
        rangeStats: rangeData,
      };
    });

    // 7. Apply filterType
    if (filterType === 'HIGH_DEMAND') {
      enriched = enriched.filter((p) => p.isHighDemand);
    } else if (filterType === 'OPPORTUNITY') {
      enriched = enriched.filter((p) => p.isOpportunity);
    }

    // 8. Sorting
    enriched.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'activeWishlist':
          valA = a.activeWishlistCount;
          valB = b.activeWishlistCount;
          break;
        case 'activeCart':
          valA = a.activeCartUsers;
          valB = b.activeCartUsers;
          break;
        case 'lifetimeWishlist':
          valA = a.lifetimeWishlistAdds;
          valB = b.lifetimeWishlistAdds;
          break;
        case 'lifetimeCart':
          valA = a.lifetimeCartAdds;
          valB = b.lifetimeCartAdds;
          break;
        case 'price':
          valA = a.price;
          valB = b.price;
          break;
        case 'name':
          return sortOrder === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'demandScore':
        default:
          valA = a.demandScore;
          valB = b.demandScore;
          break;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // 9. Compute Overall KPI Summary
    let totalActiveWishlistCount = 0;
    let totalActiveCartUsers = 0;
    let totalActiveCartUnits = 0;
    let topWish = null;
    let topCart = null;

    enriched.forEach((p) => {
      totalActiveWishlistCount += p.activeWishlistCount;
      totalActiveCartUsers += p.activeCartUsers;
      totalActiveCartUnits += p.activeCartUnits;

      if (!topWish || p.activeWishlistCount > topWish.activeWishlistCount) {
        if (p.activeWishlistCount > 0) topWish = p;
      }
      if (!topCart || p.activeCartUsers > topCart.activeCartUsers) {
        if (p.activeCartUsers > 0) topCart = p;
      }
    });

    return res.status(200).json({
      summary: {
        totalProducts: enriched.length,
        totalActiveWishlistCount,
        totalActiveCartUsers,
        totalActiveCartUnits,
        topWishlistedProduct: topWish ? { name: topWish.name, count: topWish.activeWishlistCount, image: topWish.image } : null,
        topCartedProduct: topCart ? { name: topCart.name, count: topCart.activeCartUsers, image: topCart.image } : null,
      },
      products: enriched,
    });
  } catch (err) {
    console.error('[analytics] getProductAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch product analytics.' });
  }
};

// ─── GET /api/analytics/export ────────────────────────────────────────────────
// Exports detailed product analytics to an Excel workbook (.xlsx)
const exportProductAnalytics = async (req, res) => {
  try {
    const products = await Product.find({})
      .select('name category price inStock')
      .lean();

    const activeWishlistAgg = await Wishlist.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products', count: { $sum: 1 } } },
    ]);
    const wishMap = new Map(activeWishlistAgg.map((w) => [w._id.toString(), w.count]));

    const activeCartAgg = await Cart.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          usersSet: { $addToSet: '$userId' },
          totalUnits: { $sum: '$items.quantity' },
        },
      },
      {
        $project: {
          _id: 1,
          users: { $size: '$usersSet' },
          units: '$totalUnits',
        },
      },
    ]);
    const cartMap = new Map(activeCartAgg.map((c) => [c._id.toString(), { users: c.users, units: c.units }]));

    const lifetimeStats = await ProductAnalytics.find({}).lean();
    const lifeMap = new Map(lifetimeStats.map((l) => [l.productId.toString(), l]));

    const excelData = products.map((prod, idx) => {
      const pId = prod._id.toString();
      const activeWish = wishMap.get(pId) || 0;
      const cart = cartMap.get(pId) || { users: 0, units: 0 };
      const life = lifeMap.get(pId) || { lifetimeWishlistAdds: 0, lifetimeCartAdds: 0, lifetimeCartQty: 0 };
      const demandScore = Math.round(
        activeWish * 2.5 + cart.users * 4.0 + (life.lifetimeWishlistAdds || 0) * 0.5 + (life.lifetimeCartAdds || 0) * 1.0
      );

      let statusNote = 'Standard Demand';
      if (activeWish >= 3 && cart.users === 0) {
        statusNote = 'High Wishlist / Review Conversion';
      } else if (demandScore >= 10 || cart.users >= 2) {
        statusNote = 'High Demand Trending';
      }

      return {
        '#': idx + 1,
        'Product Name': prod.name,
        'Category': prod.category,
        'Price (₹)': prod.price,
        'In Stock': prod.inStock ? 'Yes' : 'No',
        'Active Wishlist Users': activeWish,
        'Active Cart Users': cart.users,
        'Active Cart Units': cart.units,
        'Lifetime Wishlist Adds': life.lifetimeWishlistAdds || 0,
        'Lifetime Cart Adds': life.lifetimeCartAdds || 0,
        'Lifetime Units Added': life.lifetimeCartQty || 0,
        'Demand Score': demandScore,
        'Opportunity / Demand Flag': statusNote,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Demand Analytics');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `PrettyGlitz_Product_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[analytics] exportProductAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to export analytics report.' });
  }
};

module.exports = {
  trackEvent,
  getProductAnalytics,
  exportProductAnalytics,
};

