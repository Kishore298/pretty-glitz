const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');

const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ProductAnalytics = require('../models/ProductAnalytics');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const ActiveGuestSession = require('../models/ActiveGuestSession');
const PageVisit = require('../models/PageVisit');

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

// ─── POST /api/analytics/sync-guest ───────────────────────────────────────────
// Upserts active guest cart & wishlist arrays by persistent sessionId
const syncGuestSession = async (req, res) => {
  try {
    const { sessionId, wishlist = [], cart = [] } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required.' });
    }

    const validWishlistIds = (Array.isArray(wishlist) ? wishlist : [])
      .map(id => typeof id === 'object' ? (id?._id || id?.productId) : id)
      .filter(id => id && mongoose.Types.ObjectId.isValid(id.toString()))
      .map(id => new mongoose.Types.ObjectId(id.toString()));

    const validCartItems = (Array.isArray(cart) ? cart : [])
      .map(item => {
        const rawId = item?.productId || item?.product?._id || item?.product;
        return {
          product: rawId && mongoose.Types.ObjectId.isValid(rawId.toString()) ? new mongoose.Types.ObjectId(rawId.toString()) : null,
          quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
        };
      })
      .filter(item => item.product !== null);

    await ActiveGuestSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          wishlist: validWishlistIds,
          cart: validCartItems,
          lastActive: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: 'Guest session synchronized.',
      counts: { wishlist: validWishlistIds.length, cart: validCartItems.length },
    });
  } catch (err) {
    console.error('[analytics] syncGuestSession error:', err);
    return res.status(500).json({ message: 'Failed to sync guest session.' });
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

    // 2. Aggregate active wishlist counts (Authenticated Users + Active Guest Sessions)
    const activeWishlistMap = new Map();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const authWishlistAgg = await Wishlist.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products',
          activeWishlistCount: { $sum: 1 },
        },
      },
    ]);
    authWishlistAgg.forEach((w) => {
      activeWishlistMap.set(w._id.toString(), w.activeWishlistCount);
    });

    const guestWishlistAgg = await ActiveGuestSession.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $unwind: '$wishlist' },
      {
        $group: {
          _id: '$wishlist',
          activeWishlistCount: { $sum: 1 },
        },
      },
    ]);
    guestWishlistAgg.forEach((w) => {
      const pId = w._id.toString();
      activeWishlistMap.set(pId, (activeWishlistMap.get(pId) || 0) + w.activeWishlistCount);
    });

    // Fallback: include recent AnalyticsEvent records for guest sessions that haven't synced yet
    const guestEventWishlistAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          userId: null,
          sessionId: { $ne: null },
          eventType: { $in: ['WISHLIST_ADD', 'WISHLIST_REMOVE'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: { sessionId: '$sessionId', productId: '$productId' },
          lastEvent: { $last: '$eventType' },
        },
      },
      { $match: { lastEvent: 'WISHLIST_ADD' } },
      {
        $group: {
          _id: '$_id.productId',
          activeWishlistCount: { $sum: 1 },
        },
      },
    ]);
    guestEventWishlistAgg.forEach((w) => {
      const pId = w._id.toString();
      const current = activeWishlistMap.get(pId) || 0;
      if (w.activeWishlistCount > current) {
        activeWishlistMap.set(pId, w.activeWishlistCount);
      }
    });

    // 3. Aggregate active cart counts (Authenticated Users + Active Guest Sessions)
    const activeCartMap = new Map();

    const authCartAgg = await Cart.aggregate([
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
    authCartAgg.forEach((c) => {
      activeCartMap.set(c._id.toString(), {
        activeCartUsers: c.activeCartUsers,
        activeCartUnits: c.activeCartUnits,
      });
    });

    const guestCartAgg = await ActiveGuestSession.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $unwind: '$cart' },
      {
        $group: {
          _id: '$cart.product',
          sessionsSet: { $addToSet: '$sessionId' },
          totalUnits: { $sum: '$cart.quantity' },
        },
      },
      {
        $project: {
          _id: 1,
          activeCartUsers: { $size: '$sessionsSet' },
          activeCartUnits: '$totalUnits',
        },
      },
    ]);
    guestCartAgg.forEach((c) => {
      const pId = c._id.toString();
      const existing = activeCartMap.get(pId) || { activeCartUsers: 0, activeCartUnits: 0 };
      activeCartMap.set(pId, {
        activeCartUsers: existing.activeCartUsers + c.activeCartUsers,
        activeCartUnits: existing.activeCartUnits + c.activeCartUnits,
      });
    });

    // Fallback: include recent AnalyticsEvent records for guest sessions that haven't synced yet
    const guestEventCartAgg = await AnalyticsEvent.aggregate([
      {
        $match: {
          userId: null,
          sessionId: { $ne: null },
          eventType: { $in: ['CART_ADD', 'CART_REMOVE'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: { sessionId: '$sessionId', productId: '$productId' },
          lastEvent: { $last: '$eventType' },
          lastQty: { $last: '$quantity' },
        },
      },
      { $match: { lastEvent: 'CART_ADD' } },
      {
        $group: {
          _id: '$_id.productId',
          sessionsCount: { $sum: 1 },
          totalUnits: { $sum: '$lastQty' },
        },
      },
    ]);
    guestEventCartAgg.forEach((c) => {
      const pId = c._id.toString();
      const existing = activeCartMap.get(pId) || { activeCartUsers: 0, activeCartUnits: 0 };
      if (c.sessionsCount > existing.activeCartUsers) {
        activeCartMap.set(pId, {
          activeCartUsers: Math.max(existing.activeCartUsers, c.sessionsCount),
          activeCartUnits: Math.max(existing.activeCartUnits, c.totalUnits),
        });
      }
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
    const wishMap = new Map();
    activeWishlistAgg.forEach((w) => wishMap.set(w._id.toString(), w.count));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const guestWishlistAgg = await ActiveGuestSession.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $unwind: '$wishlist' },
      { $group: { _id: '$wishlist', count: { $sum: 1 } } },
    ]);
    guestWishlistAgg.forEach((w) => {
      const pId = w._id.toString();
      wishMap.set(pId, (wishMap.get(pId) || 0) + w.count);
    });

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
    const cartMap = new Map();
    activeCartAgg.forEach((c) => cartMap.set(c._id.toString(), { users: c.users, units: c.units }));

    const guestCartAgg = await ActiveGuestSession.aggregate([
      { $match: { lastActive: { $gte: thirtyDaysAgo } } },
      { $unwind: '$cart' },
      {
        $group: {
          _id: '$cart.product',
          sessionsSet: { $addToSet: '$sessionId' },
          totalUnits: { $sum: '$cart.quantity' },
        },
      },
      {
        $project: {
          _id: 1,
          users: { $size: '$sessionsSet' },
          units: '$totalUnits',
        },
      },
    ]);
    guestCartAgg.forEach((c) => {
      const pId = c._id.toString();
      const existing = cartMap.get(pId) || { users: 0, units: 0 };
      cartMap.set(pId, {
        users: existing.users + c.users,
        units: existing.units + c.units,
      });
    });

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

// ─── POST /api/analytics/page-visit ──────────────────────────────────────────
// Ingests device page visit and duration, deduplicated by deviceId per page & day
const recordPageVisit = async (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    const { deviceId, path, pageTitle, durationSeconds, platform } = payload || {};
    if (!deviceId || !path) {
      return res.status(400).json({ message: 'deviceId and path are required' });
    }

    // Clean and normalize path
    const rawPath = String(path).trim() || '/';
    let cleanPath = rawPath;
    try {
      cleanPath = decodeURIComponent(rawPath);
    } catch {
      // keep rawPath
    }

    const cleanTitle = (pageTitle && String(pageTitle).trim()) || cleanPath;
    const cleanPlatform = ['mobile', 'desktop', 'tablet'].includes(platform) ? platform : 'desktop';
    const visitDate = new Date().toISOString().slice(0, 10);
    const safeDuration = Math.max(0, Math.min(Number(durationSeconds) || 0, 1800));

    // Update or insert page visit record
    await PageVisit.findOneAndUpdate(
      { deviceId, path: cleanPath, visitDate },
      {
        $inc: { hits: 1, durationSeconds: Math.round(safeDuration) },
        $set: {
          pageTitle: cleanTitle,
          platform: cleanPlatform,
          lastVisitedAt: new Date(),
        },
        $setOnInsert: {
          deviceId,
          path: cleanPath,
          visitDate,
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[analytics] recordPageVisit error:', err);
    return res.status(500).json({ message: 'Failed to record page visit' });
  }
};

// ─── GET /api/analytics/traffic ──────────────────────────────────────────────
// Aggregates site visits and per-page metrics, deduplicated by physical deviceId
const getPageAnalytics = async (req, res) => {
  try {
    // Purge any synthetic verification test records
    await PageVisit.deleteMany({ deviceId: 'test_device_verification_123' }).catch(() => {});

    const { range = '30d' } = req.query;
    let matchFilter = { deviceId: { $ne: 'test_device_verification_123' } };

    if (range === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      matchFilter.visitDate = todayStr;
    } else if (range === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      matchFilter.visitDate = { $gte: d.toISOString().slice(0, 10) };
    } else if (range === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      matchFilter.visitDate = { $gte: d.toISOString().slice(0, 10) };
    }

    // 1. Overall Site Unique Device Visitors
    const distinctDevices = await PageVisit.distinct('deviceId', matchFilter);
    const totalUniqueVisitors = distinctDevices.length;

    // 2. Total Hits & Total Duration Site-wide
    const overallAgg = await PageVisit.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$hits' },
          totalSeconds: { $sum: '$durationSeconds' },
        },
      },
    ]);
    const totalViews = overallAgg[0]?.totalViews || 0;
    const totalDurationSeconds = overallAgg[0]?.totalSeconds || 0;
    const avgDurationPerVisitor = totalUniqueVisitors > 0 ? Math.round(totalDurationSeconds / totalUniqueVisitors) : 0;

    // 3. Platform Breakdown (Unique Devices)
    const platformAgg = await PageVisit.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { platform: '$platform', deviceId: '$deviceId' },
        },
      },
      {
        $group: {
          _id: '$_id.platform',
          uniqueCount: { $sum: 1 },
        },
      },
    ]);
    const platformBreakdown = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };
    platformAgg.forEach((item) => {
      if (item._id && platformBreakdown[item._id] !== undefined) {
        platformBreakdown[item._id] = item.uniqueCount;
      }
    });

    // 4. Per-Page Aggregation (strictly deduplicated by deviceId per page)
    const pageStats = await PageVisit.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$path',
          uniqueDevices: { $addToSet: '$deviceId' },
          totalViews: { $sum: '$hits' },
          totalDurationSeconds: { $sum: '$durationSeconds' },
          pageTitle: { $last: '$pageTitle' },
          lastVisitedAt: { $max: '$lastVisitedAt' },
        },
      },
      {
        $project: {
          path: '$_id',
          pageTitle: 1,
          uniqueVisitors: { $size: '$uniqueDevices' },
          totalViews: 1,
          totalDurationSeconds: 1,
          avgDurationSeconds: {
            $cond: [
              { $gt: [{ $size: '$uniqueDevices' }, 0] },
              { $round: [{ $divide: ['$totalDurationSeconds', { $size: '$uniqueDevices' }] }, 0] },
              0,
            ],
          },
          lastVisitedAt: 1,
        },
      },
      { $sort: { uniqueVisitors: -1, totalDurationSeconds: -1 } },
      { $limit: 100 },
    ]);

    // 5. Daily Trend (last 14 days)
    const dailyTrend = await PageVisit.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { visitDate: '$visitDate', deviceId: '$deviceId' },
        },
      },
      {
        $group: {
          _id: '$_id.visitDate',
          uniqueDevices: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      summary: {
        totalUniqueVisitors,
        totalViews,
        totalDurationSeconds,
        avgDurationPerVisitor,
        platformBreakdown,
      },
      dailyTrend: dailyTrend.map((t) => ({ date: t._id, uniqueVisitors: t.uniqueDevices })),
      pages: pageStats,
    });
  } catch (err) {
    console.error('[analytics] getPageAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to fetch page traffic analytics.' });
  }
};

// ─── DELETE /api/analytics/traffic/reset ─────────────────────────────────────
// Clears all page visit records so admin can test from a clean slate
const resetTrafficAnalytics = async (req, res) => {
  try {
    await PageVisit.deleteMany({});
    return res.status(200).json({ success: true, message: 'All traffic analytics data reset successfully.' });
  } catch (err) {
    console.error('[analytics] resetTrafficAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to reset traffic data' });
  }
};

module.exports = {
  trackEvent,
  syncGuestSession,
  getProductAnalytics,
  exportProductAnalytics,
  recordPageVisit,
  getPageAnalytics,
  resetTrafficAnalytics,
};

