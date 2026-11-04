const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { emitToAdmin, emitToUser } = require('../config/socket');
const { sendPushToAllAdmins } = require('../services/pushService');
const jwt = require('jsonwebtoken');

// Helper: Safely extract customer userId from optional authorization header
const extractUserId = (req) => {
  if (req.user && req.user.userId) return req.user.userId;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.userId) return decoded.userId;
    } catch {
      // Invalid/expired token
    }
  }
  return null;
};

// Generates cryptographically secure unique Order ID with collision retries
const generateOrderId = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const id = `PG-${hex}-${Date.now().toString().slice(-4)}`;
    const exists = await Order.findOne({ orderId: id });
    if (!exists) return id;
  }
  // Ultimate collision fallback
  return `PG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

// ─── POST /api/orders (Customer creates new order request) ────────────────────
const createOrder = async (req, res) => {
  let session = null;
  let useTransaction = false;

  try {
    const { customer, items, totalAmount, idempotencyKey } = req.body;

    if (!customer || !customer.name || !customer.mobile || !customer.address) {
      return res.status(400).json({ message: 'Customer name, mobile, and delivery address are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    // Server-side Idempotency check: prevent duplicate orders from rapid repeated clicks
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({
          success: true,
          orderId: existing.orderId,
          order: existing,
          isDuplicate: true,
        });
      }
    }

    const userId = extractUserId(req);
    const orderId = await generateOrderId();

    // Map clean line items including color and size variation references
    const cleanItems = items.map((item) => ({
      product: item.productId || item.product?._id || item.product || null,
      name: item.name || item.product?.name || 'Handcrafted Jewellery',
      price: Number(item.price || item.product?.price || 0),
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      colorVariantId: item.colorVariantId || null,
      colorName: item.colorName || null,
      sizeVariantId: item.sizeVariantId || null,
      size: item.size || null,
      pieceCount: item.pieceCount || null,
      image: item.image || item.product?.images?.[0]?.url || '',
      variantKey: item.variantKey || '',
    }));

    const calculatedTotal = cleanItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const finalAmount = Number(totalAmount) || calculatedTotal;

    // Start database session for atomic multi-item transaction
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch {
      session = null;
      useTransaction = false;
    }

    const deductedItemsLog = [];

    // 1. Transactional Inventory Reservation with Nested $elemMatch
    try {
      for (const item of cleanItems) {
        if (item.product && item.colorVariantId && item.sizeVariantId) {
          // Nested $elemMatch ensures that the exact color AND size match on the same variant
          const stockQuery = {
            _id: item.product,
            colorVariants: {
              $elemMatch: {
                _id: item.colorVariantId,
                inStock: true,
                sizes: {
                  $elemMatch: {
                    _id: item.sizeVariantId,
                    inStock: true,
                    stockCount: { $gte: item.quantity },
                  },
                },
              },
            },
          };

          const stockUpdate = {
            $inc: { 'colorVariants.$[c].sizes.$[s].stockCount': -item.quantity },
          };

          const options = {
            arrayFilters: [
              { 'c._id': item.colorVariantId },
              { 's._id': item.sizeVariantId },
            ],
          };
          if (useTransaction && session) options.session = session;

          const updateRes = await Product.updateOne(stockQuery, stockUpdate, options);
          if (updateRes.modifiedCount === 0) {
            throw new Error(
              `Unable to reserve stock for ${item.name} (${item.colorName || 'Variant'} - Size ${item.size || 'N/A'}). Item is either out of stock or sold out.`
            );
          }

          deductedItemsLog.push({
            type: 'colorVariant',
            productId: item.product,
            colorVariantId: item.colorVariantId,
            sizeVariantId: item.sizeVariantId,
            quantity: item.quantity,
          });
        } else if (item.product && item.size) {
          // Size-wise stock deduction for top-level bangles (Wedding Bangles, Antique Bangles, Valaikaappu Bangles)
          const prodDoc = await Product.findById(item.product).session(useTransaction && session ? session : null);
          if (prodDoc && Array.isArray(prodDoc.sizes) && prodDoc.sizes.length > 0) {
            const stockQuery = {
              _id: item.product,
              sizes: {
                $elemMatch: {
                  size: item.size,
                  inStock: true,
                  stockCount: { $gte: item.quantity },
                },
              },
            };
            const stockUpdate = {
              $inc: { 'sizes.$[s].stockCount': -item.quantity },
            };
            const options = {
              arrayFilters: [{ 's.size': item.size }],
            };
            if (useTransaction && session) options.session = session;

            const updateRes = await Product.updateOne(stockQuery, stockUpdate, options);
            if (updateRes.modifiedCount === 0) {
              throw new Error(
                `Unable to reserve stock for ${item.name} (Size ${item.size}). Item is either out of stock or sold out.`
              );
            }
            deductedItemsLog.push({
              type: 'sizeStock',
              productId: item.product,
              size: item.size,
              quantity: item.quantity,
            });
            continue;
          }
        } else if (item.product) {
          // Standard / legacy product stock deduction if inStockCount is tracked
          const prodDoc = await Product.findById(item.product).session(useTransaction && session ? session : null);
          if (prodDoc && typeof prodDoc.inStockCount === 'number') {
            const stockQuery = {
              _id: item.product,
              inStock: true,
              inStockCount: { $gte: item.quantity },
            };
            const stockUpdate = {
              $inc: { inStockCount: -item.quantity },
            };
            const options = useTransaction && session ? { session } : {};
            const updateRes = await Product.updateOne(stockQuery, stockUpdate, options);
            if (updateRes.modifiedCount === 0) {
              throw new Error(`Insufficient stock for ${item.name}.`);
            }
            deductedItemsLog.push({
              type: 'standard',
              productId: item.product,
              quantity: item.quantity,
            });
          }
        }
      }

      // 2. Persist Order in MongoDB (Status: PENDING_WHATSAPP)
      const orderPayload = {
        orderId,
        idempotencyKey: idempotencyKey || undefined,
        userId: userId || null,
        customer: {
          name: customer.name.trim(),
          mobile: customer.mobile.trim(),
          address: customer.address.trim(),
          city: (customer.city || '').trim(),
          pincode: (customer.pincode || '').trim(),
          notes: (customer.notes || '').trim(),
        },
        items: cleanItems,
        totalAmount: finalAmount,
        status: 'PENDING_WHATSAPP',
      };

      let createdOrder;
      if (useTransaction && session) {
        const [created] = await Order.create([orderPayload], { session });
        createdOrder = created;
        await session.commitTransaction();
      } else {
        createdOrder = await Order.create(orderPayload);
      }

      // 3. Post-Persistence Actions (Only executed AFTER confirmed database write)
      // a. Socket.IO instant alert to Admin Panel
      try {
        emitToAdmin('new_order_request', {
          orderId: createdOrder.orderId,
          customerName: createdOrder.customer.name,
          customerMobile: createdOrder.customer.mobile,
          orderAmount: createdOrder.totalAmount,
          itemsCount: createdOrder.items.length,
          items: createdOrder.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          status: createdOrder.status,
          createdAt: createdOrder.createdAt,
        });
      } catch (socketErr) {
        console.warn('[Orders] Socket.IO emission warning:', socketErr.message);
      }

      // b. Persistent MongoDB Notification
      try {
        await Notification.create({
          type: 'NEW_ORDER_REQUEST',
          title: `New Order Request: ${createdOrder.orderId}`,
          message: `${createdOrder.customer.name} placed a ₹${createdOrder.totalAmount} order request (${createdOrder.items.length} items)`,
          orderId: createdOrder.orderId,
          data: {
            orderId: createdOrder.orderId,
            customerName: createdOrder.customer.name,
            customerMobile: createdOrder.customer.mobile,
            totalAmount: createdOrder.totalAmount,
            itemsCount: createdOrder.items.length,
          },
          read: false,
        });
      } catch (notifErr) {
        console.warn('[Orders] Persistent notification warning:', notifErr.message);
      }

      // c. Background Web Push to Admin Devices
      try {
        sendPushToAllAdmins({
          title: `🛍️ New Order: ${createdOrder.orderId}`,
          body: `${createdOrder.customer.name} • ₹${createdOrder.totalAmount} (${createdOrder.items.length} items)`,
          icon: '/pretty-glitz-logo.png',
          data: {
            orderId: createdOrder.orderId,
            url: `/orders?id=${createdOrder.orderId}`,
          },
        });
      } catch (pushErr) {
        console.warn('[Orders] Web push dispatch warning:', pushErr.message);
      }

      return res.status(201).json({
        success: true,
        orderId: createdOrder.orderId,
        order: createdOrder,
      });
    } catch (innerErr) {
      if (useTransaction && session) {
        try {
          await session.abortTransaction();
        } catch {}
      } else if (deductedItemsLog.length > 0) {
        // Manual compensation rollback for standalone environments
        for (const d of deductedItemsLog) {
          if (d.type === 'colorVariant') {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { 'colorVariants.$[c].sizes.$[s].stockCount': d.quantity } },
              { arrayFilters: [{ 'c._id': d.colorVariantId }, { 's._id': d.sizeVariantId }] }
            ).catch((revertErr) => console.error('[Orders] Rollback error:', revertErr));
          } else if (d.type === 'sizeStock') {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { 'sizes.$[s].stockCount': d.quantity } },
              { arrayFilters: [{ 's.size': d.size }] }
            ).catch((revertErr) => console.error('[Orders] Rollback error:', revertErr));
          } else if (d.type === 'standard') {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { inStockCount: d.quantity } }
            ).catch((revertErr) => console.error('[Orders] Rollback error:', revertErr));
          }
        }
      }
      throw innerErr;
    }
  } catch (err) {
    console.error('[Orders] createOrder error:', err.message);
    return res.status(400).json({ message: err.message || 'Failed to create order request.' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// ─── GET /api/orders (Admin lists orders with filters & pagination) ────────────
const getOrders = async (req, res) => {
  try {
    const {
      status = 'ALL',
      search = '',
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { orderId: { $regex: s, $options: 'i' } },
        { 'customer.name': { $regex: s, $options: 'i' } },
        { 'customer.mobile': { $regex: s, $options: 'i' } },
        { 'customer.city': { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query),
    ]);

    // Aggregate status counts for dashboard tabs
    const statusCountsAgg = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const statusCounts = {
      ALL: total,
      PENDING_WHATSAPP: 0,
      CONFIRMED: 0,
      DISPATCHED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    statusCountsAgg.forEach((s) => {
      if (statusCounts[s._id] !== undefined) {
        statusCounts[s._id] = s.count;
      }
    });

    return res.status(200).json({
      orders,
      statusCounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error('[Orders] getOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

// ─── GET /api/orders/:id (Admin get single order) ─────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { orderId: id.toUpperCase() };

    const order = await Order.findOne(query).populate('items.product', 'name images price');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error('[Orders] getOrderById error:', err);
    return res.status(500).json({ message: 'Failed to fetch order details.' });
  }
};

// ─── PATCH /api/orders/:id/status (Admin updates order status) ─────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalNotes } = req.body;

    const validStatuses = ['PENDING_WHATSAPP', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { orderId: id.toUpperCase() }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (status) {
      order.status = status;
      const now = new Date();
      if (status === 'CONFIRMED') order.confirmedAt = now;
      if (status === 'DISPATCHED') order.dispatchedAt = now;
      if (status === 'DELIVERED') order.deliveredAt = now;
      if (status === 'CANCELLED') order.cancelledAt = now;
    }

    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }

    await order.save();

    // Broadcast status change to admin sockets
    try {
      emitToAdmin('order_status_updated', {
        orderId: order.orderId,
        status: order.status,
        updatedAt: order.updatedAt,
      });

      if (order.userId) {
        emitToUser(order.userId.toString(), 'order_status_updated', {
          orderId: order.orderId,
          status: order.status,
          updatedAt: order.updatedAt,
        });
      }
    } catch {
      // Non-critical
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status}`,
      order,
    });
  } catch (err) {
    console.error('[Orders] updateOrderStatus error:', err);
    return res.status(500).json({ message: 'Failed to update order status.' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
};

