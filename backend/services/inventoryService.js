const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const Order = require('../models/Order');

const GLOBAL_DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Determine product tier:
 * TIER_1_COLOR_SIZE: Designer Glass Bangles (colorVariants with nested sizes)
 * TIER_2_SIZE: Bangle categories with sizes[] array
 * TIER_3_SIMPLE: Standard single items (Florals, Jhumkas, etc.)
 */
const getProductTier = (product) => {
  if (Array.isArray(product?.colorVariants) && product.colorVariants.length > 0) {
    return 'TIER_1_COLOR_SIZE';
  }
  if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
    return 'TIER_2_SIZE';
  }
  return 'TIER_3_SIMPLE';
};

/**
 * Unified stock validation rule:
 * | inStock flag | numericStockCount | Result |
 * | false        | Any               | Reject |
 * | true         | null/undefined    | Allow as legacy untracked stock |
 * | true         | 0                 | Reject (tracked at zero = out of stock) |
 * | true         | > 0               | Allow up to available quantity |
 */
const isItemAvailable = (inStockFlag, numericStockCount, requestedQty = 1) => {
  if (inStockFlag === false) {
    return { available: false, reason: 'Out of stock' };
  }

  if (typeof numericStockCount === 'number') {
    if (numericStockCount <= 0) {
      return { available: false, reason: 'Out of stock' };
    }
    if (numericStockCount < requestedQty) {
      return { available: false, reason: `Only ${numericStockCount} item(s) available in stock.` };
    }
    return { available: true, stockCount: numericStockCount };
  }

  // inStockFlag is true and numericStockCount is null or undefined (legacy untracked)
  return { available: true, stockCount: null, isUntracked: true };
};

/**
 * Calculate product stock health and aggregated counts.
 */
const calculateProductHealth = (product, globalThreshold = GLOBAL_DEFAULT_LOW_STOCK_THRESHOLD) => {
  const threshold = typeof product.lowStockThreshold === 'number' && product.lowStockThreshold > 0
    ? product.lowStockThreshold
    : globalThreshold;

  if (product.isActive === false) {
    return {
      status: 'INACTIVE',
      totalTrackedStock: 0,
      isUntracked: false,
      threshold,
      hasLowStockVariants: false,
    };
  }

  const tier = getProductTier(product);

  if (tier === 'TIER_1_COLOR_SIZE') {
    let totalTracked = 0;
    let totalSizesCount = 0;
    let anyInStock = false;
    let anyLowStock = false;
    let hasTrackedCounts = false;

    product.colorVariants.forEach((cVar) => {
      if (Array.isArray(cVar.sizes)) {
        cVar.sizes.forEach((s) => {
          totalSizesCount++;
          if (typeof s.stockCount === 'number') {
            hasTrackedCounts = true;
            totalTracked += s.stockCount;
            if (s.inStock && s.stockCount > 0) {
              anyInStock = true;
              if (s.stockCount <= threshold) anyLowStock = true;
            }
          } else if (s.inStock) {
            anyInStock = true;
          }
        });
      }
    });

    if (!anyInStock || (hasTrackedCounts && totalTracked === 0)) {
      return { status: 'OUT_OF_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: anyLowStock };
    }
    if (anyLowStock) {
      return { status: 'LOW_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: true };
    }
    return { status: 'IN_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: false };
  }

  if (tier === 'TIER_2_SIZE') {
    let totalTracked = 0;
    let anyInStock = false;
    let anyLowStock = false;
    let hasTrackedCounts = false;

    product.sizes.forEach((s) => {
      if (typeof s.stockCount === 'number') {
        hasTrackedCounts = true;
        totalTracked += s.stockCount;
        if (s.inStock && s.stockCount > 0) {
          anyInStock = true;
          if (s.stockCount <= threshold) anyLowStock = true;
        }
      } else if (s.inStock) {
        anyInStock = true;
      }
    });

    if (!anyInStock || (hasTrackedCounts && totalTracked === 0)) {
      return { status: 'OUT_OF_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: anyLowStock };
    }
    if (anyLowStock) {
      return { status: 'LOW_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: true };
    }
    return { status: 'IN_STOCK', totalTrackedStock: totalTracked, isUntracked: !hasTrackedCounts, threshold, hasLowStockVariants: false };
  }

  // TIER_3_SIMPLE
  if (product.inStock === false) {
    return { status: 'OUT_OF_STOCK', totalTrackedStock: product.inStockCount || 0, isUntracked: product.inStockCount === null, threshold, hasLowStockVariants: false };
  }

  if (typeof product.inStockCount === 'number') {
    if (product.inStockCount <= 0) {
      return { status: 'OUT_OF_STOCK', totalTrackedStock: 0, isUntracked: false, threshold, hasLowStockVariants: false };
    }
    if (product.inStockCount <= threshold) {
      return { status: 'LOW_STOCK', totalTrackedStock: product.inStockCount, isUntracked: false, threshold, hasLowStockVariants: true };
    }
    return { status: 'IN_STOCK', totalTrackedStock: product.inStockCount, isUntracked: false, threshold, hasLowStockVariants: false };
  }

  // Simple item with inStock: true and null inStockCount (legacy untracked)
  return { status: 'UNTRACKED', totalTrackedStock: null, isUntracked: true, threshold, hasLowStockVariants: false };
};

/**
 * Recalculate boolean inStock rollups across variant levels and product root.
 */
const recalculateRollups = (product) => {
  const tier = getProductTier(product);

  if (tier === 'TIER_1_COLOR_SIZE') {
    let productHasAnyStock = false;

    product.colorVariants.forEach((cVar) => {
      let colorHasAnyStock = false;
      if (Array.isArray(cVar.sizes) && cVar.sizes.length > 0) {
        cVar.sizes.forEach((s) => {
          if (typeof s.stockCount === 'number') {
            s.inStock = s.stockCount > 0;
          }
          if (s.inStock) {
            colorHasAnyStock = true;
          }
        });
        cVar.inStock = colorHasAnyStock;
      }
      if (cVar.inStock) {
        productHasAnyStock = true;
      }
    });

    product.inStock = productHasAnyStock;
  } else if (tier === 'TIER_2_SIZE') {
    let productHasAnyStock = false;
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      product.sizes.forEach((s) => {
        if (typeof s.stockCount === 'number') {
          s.inStock = s.stockCount > 0;
        }
        if (s.inStock) {
          productHasAnyStock = true;
        }
      });
      product.inStock = productHasAnyStock;
    }
  } else {
    // TIER_3_SIMPLE
    if (typeof product.inStockCount === 'number') {
      product.inStock = product.inStockCount > 0;
    }
  }

  return product;
};

/**
 * Execute a mutation safely within a MongoDB transaction if replica set supports it,
 * or fall back gracefully to sequential execution with error rollback.
 */
const withTransactionOrFallback = async (workFn) => {
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessErr) {
    // Standalone MongoDB (common in local dev without replica sets)
    session = null;
    useTransaction = false;
  }

  try {
    const result = await workFn(session, useTransaction);
    if (useTransaction && session) {
      await session.commitTransaction();
    }
    return result;
  } catch (err) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('[Inventory] Abort transaction error:', abortErr.message);
      }
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * SET STOCK: Overwrite current quantity to absolute number.
 * Concurrency protected by product-level stockVersion.
 */
const setStock = async ({
  productId,
  target = {},
  value,
  expectedVersion,
  admin = {},
  reason = 'Admin manual set stock',
  referenceId = '',
}) => {
  const numericVal = Math.max(0, parseInt(value, 10));
  if (isNaN(numericVal)) {
    throw new Error('Valid non-negative stock count is required.');
  }

  return await withTransactionOrFallback(async (session) => {
    const query = { _id: productId };
    const product = await Product.findOne(query).session(session || null);

    if (!product) {
      throw new Error('Product not found.');
    }

    // Optimistic Concurrency Control Check
    if (typeof expectedVersion === 'number' && product.stockVersion !== expectedVersion) {
      const err = new Error('Stock version conflict: Product was modified by another session. Please reload to see the latest stock.');
      err.status = 409;
      err.conflict = {
        productId: product._id,
        currentVersion: product.stockVersion,
        expectedVersion,
      };
      throw err;
    }

    const tier = getProductTier(product);
    let previousStock = null;
    let variantType = 'SIMPLE';
    let colorName = '';
    let size = '';
    let colorVariantId = null;
    let sizeVariantId = null;

    if (tier === 'TIER_1_COLOR_SIZE') {
      variantType = 'COLOR_SIZE';
      colorVariantId = target.colorVariantId;
      sizeVariantId = target.sizeVariantId;

      const cVar = product.colorVariants.find(
        (c) => c._id?.toString() === colorVariantId?.toString()
      );
      if (!cVar) throw new Error('Color variant not found on product.');
      colorName = cVar.colorName;

      const sObj = cVar.sizes.find(
        (s) => s._id?.toString() === sizeVariantId?.toString() || s.size === target.size
      );
      if (!sObj) throw new Error(`Size variant "${target.size || ''}" not found on color "${colorName}".`);

      size = sObj.size;
      sizeVariantId = sObj._id;
      previousStock = sObj.stockCount;
      sObj.stockCount = numericVal;
    } else if (tier === 'TIER_2_SIZE') {
      variantType = 'SIZE';
      const sObj = product.sizes.find(
        (s) => s._id?.toString() === target.sizeVariantId?.toString() || s.size === target.size
      );
      if (!sObj) throw new Error(`Size variant "${target.size || ''}" not found.`);

      size = sObj.size;
      sizeVariantId = sObj._id;
      previousStock = sObj.stockCount;
      sObj.stockCount = numericVal;
    } else {
      // TIER_3_SIMPLE
      variantType = 'SIMPLE';
      previousStock = product.inStockCount;
      product.inStockCount = numericVal;
    }

    // Rollup inStock flags and increment product stockVersion
    recalculateRollups(product);
    product.stockVersion = (product.stockVersion || 0) + 1;

    await product.save({ session: session || null });

    const prevNumeric = typeof previousStock === 'number' ? previousStock : 0;
    const quantityChanged = numericVal - prevNumeric;

    // Create Audit Log
    const logDoc = new InventoryLog({
      productId: product._id,
      productName: product.name,
      category: product.category,
      subcategoryId: product.subcategoryId || null,
      variantType,
      colorVariantId,
      sizeVariantId,
      colorName,
      size,
      previousStock,
      updatedStock: numericVal,
      quantityChanged,
      operation: 'SET_STOCK',
      source: admin.source || 'MANUAL_ADMIN',
      reason,
      referenceId,
      adminUsername: admin.username || 'Admin',
      adminId: admin.id || admin._id || null,
    });

    await logDoc.save({ session: session || null });

    return {
      success: true,
      product,
      log: logDoc,
      newStock: numericVal,
      stockVersion: product.stockVersion,
    };
  });
};

/**
 * ADJUST STOCK: Relative delta (+/-) increment.
 * Atomic and non-negative safe.
 */
const adjustStock = async ({
  productId,
  target = {},
  delta,
  admin = {},
  reason = 'Admin manual adjust stock',
  referenceId = '',
}) => {
  const deltaNum = parseInt(delta, 10);
  if (isNaN(deltaNum) || deltaNum === 0) {
    throw new Error('Valid non-zero adjustment delta is required.');
  }

  return await withTransactionOrFallback(async (session) => {
    const product = await Product.findById(productId).session(session || null);
    if (!product) {
      throw new Error('Product not found.');
    }

    const tier = getProductTier(product);
    let previousStock = 0;
    let updatedStock = 0;
    let variantType = 'SIMPLE';
    let colorName = '';
    let size = '';
    let colorVariantId = null;
    let sizeVariantId = null;

    if (tier === 'TIER_1_COLOR_SIZE') {
      variantType = 'COLOR_SIZE';
      colorVariantId = target.colorVariantId;
      sizeVariantId = target.sizeVariantId;

      const cVar = product.colorVariants.find(
        (c) => c._id?.toString() === colorVariantId?.toString()
      );
      if (!cVar) throw new Error('Color variant not found on product.');
      colorName = cVar.colorName;

      const sObj = cVar.sizes.find(
        (s) => s._id?.toString() === sizeVariantId?.toString() || s.size === target.size
      );
      if (!sObj) throw new Error(`Size variant "${target.size || ''}" not found.`);

      size = sObj.size;
      sizeVariantId = sObj._id;
      previousStock = typeof sObj.stockCount === 'number' ? sObj.stockCount : 0;
      updatedStock = Math.max(0, previousStock + deltaNum);
      sObj.stockCount = updatedStock;
    } else if (tier === 'TIER_2_SIZE') {
      variantType = 'SIZE';
      const sObj = product.sizes.find(
        (s) => s._id?.toString() === target.sizeVariantId?.toString() || s.size === target.size
      );
      if (!sObj) throw new Error(`Size variant "${target.size || ''}" not found.`);

      size = sObj.size;
      sizeVariantId = sObj._id;
      previousStock = typeof sObj.stockCount === 'number' ? sObj.stockCount : 0;
      updatedStock = Math.max(0, previousStock + deltaNum);
      sObj.stockCount = updatedStock;
    } else {
      // TIER_3_SIMPLE
      variantType = 'SIMPLE';
      previousStock = typeof product.inStockCount === 'number' ? product.inStockCount : 0;
      updatedStock = Math.max(0, previousStock + deltaNum);
      product.inStockCount = updatedStock;
    }

    recalculateRollups(product);
    product.stockVersion = (product.stockVersion || 0) + 1;

    await product.save({ session: session || null });

    const logDoc = new InventoryLog({
      productId: product._id,
      productName: product.name,
      category: product.category,
      subcategoryId: product.subcategoryId || null,
      variantType,
      colorVariantId,
      sizeVariantId,
      colorName,
      size,
      previousStock,
      updatedStock,
      quantityChanged: deltaNum,
      operation: 'ADJUST_STOCK',
      source: admin.source || 'MANUAL_ADMIN',
      reason,
      referenceId,
      adminUsername: admin.username || 'Admin',
      adminId: admin.id || admin._id || null,
    });

    await logDoc.save({ session: session || null });

    return {
      success: true,
      product,
      log: logDoc,
      newStock: updatedStock,
      stockVersion: product.stockVersion,
    };
  });
};

/**
 * BATCH / BULK INVENTORY SAVE:
 * Applies multiple updates, detecting any optimistic version conflicts cleanly.
 */
const bulkSaveInventory = async ({ updates = [], admin = {} }) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    return { applied: [], conflicts: [], total: 0 };
  }

  const applied = [];
  const conflicts = [];

  for (const item of updates) {
    try {
      if (item.operation === 'ADJUST_STOCK') {
        const res = await adjustStock({
          productId: item.productId,
          target: item.target,
          delta: item.delta,
          admin: { ...admin, source: 'BULK_ADMIN' },
          reason: item.reason || 'Bulk inventory adjustment',
        });
        applied.push({ productId: item.productId, target: item.target, newStock: res.newStock, version: res.stockVersion });
      } else {
        // Default to SET_STOCK
        const res = await setStock({
          productId: item.productId,
          target: item.target,
          value: item.value,
          expectedVersion: item.expectedVersion,
          admin: { ...admin, source: 'BULK_ADMIN' },
          reason: item.reason || 'Bulk inventory set',
        });
        applied.push({ productId: item.productId, target: item.target, newStock: res.newStock, version: res.stockVersion });
      }
    } catch (err) {
      if (err.status === 409 || err.conflict) {
        conflicts.push({
          productId: item.productId,
          target: item.target,
          message: err.message,
          conflict: err.conflict,
        });
      } else {
        conflicts.push({
          productId: item.productId,
          target: item.target,
          message: err.message || 'Failed to update stock',
        });
      }
    }
  }

  return {
    total: updates.length,
    appliedCount: applied.length,
    conflictCount: conflicts.length,
    applied,
    conflicts,
  };
};

/**
 * PROCESS ORDER DEDUCTION:
 * Idempotently deducts stock during order creation.
 * Checks idempotency on Order / InventoryLog to prevent double deductions.
 */
const processOrderDeduction = async ({ orderId, items = [], session = null }) => {
  if (!orderId || !Array.isArray(items) || items.length === 0) return { deducted: [] };

  // 1. Idempotency guard: check if this order already had stock deducted
  const existingLog = await InventoryLog.findOne({
    referenceId: orderId,
    operation: 'ORDER_DEDUCTION',
  }).session(session || null);

  if (existingLog) {
    console.warn(`[Inventory] Duplicate stock deduction skipped for order: ${orderId}`);
    return { deducted: [], alreadyDeducted: true };
  }

  const deductedLogs = [];

  for (const item of items) {
    if (!item.product) continue;

    const product = await Product.findById(item.product).session(session || null);
    if (!product) continue;

    const tier = getProductTier(product);
    let previousStock = null;
    let updatedStock = null;
    let variantType = 'SIMPLE';
    let colorName = '';
    let size = '';
    let colorVariantId = null;
    let sizeVariantId = null;

    if (tier === 'TIER_1_COLOR_SIZE' && item.colorVariantId && item.sizeVariantId) {
      variantType = 'COLOR_SIZE';
      colorVariantId = item.colorVariantId;
      sizeVariantId = item.sizeVariantId;

      const cVar = product.colorVariants.find(
        (c) => c._id?.toString() === item.colorVariantId.toString()
      );
      if (!cVar) {
        throw new Error(`Color variant not found for item ${item.name}`);
      }
      colorName = cVar.colorName;

      const sObj = cVar.sizes.find(
        (s) => s._id?.toString() === item.sizeVariantId.toString()
      );
      if (!sObj) {
        throw new Error(`Size variant not found for item ${item.name}`);
      }
      size = sObj.size;

      if (typeof sObj.stockCount === 'number') {
        if (sObj.stockCount < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} (${colorName} - Size ${size}). Only ${sObj.stockCount} available.`);
        }
        previousStock = sObj.stockCount;
        updatedStock = sObj.stockCount - item.quantity;
        sObj.stockCount = updatedStock;
      }
    } else if (tier === 'TIER_2_SIZE' && item.size) {
      variantType = 'SIZE';
      const sObj = product.sizes.find((s) => s.size === item.size);
      if (!sObj) {
        throw new Error(`Size ${item.size} not found on bangle ${item.name}`);
      }
      size = sObj.size;
      sizeVariantId = sObj._id;

      if (typeof sObj.stockCount === 'number') {
        if (sObj.stockCount < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} (Size ${size}). Only ${sObj.stockCount} available.`);
        }
        previousStock = sObj.stockCount;
        updatedStock = sObj.stockCount - item.quantity;
        sObj.stockCount = updatedStock;
      }
    } else {
      // TIER_3_SIMPLE
      variantType = 'SIMPLE';
      if (typeof product.inStockCount === 'number') {
        if (product.inStockCount < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Only ${product.inStockCount} available.`);
        }
        previousStock = product.inStockCount;
        updatedStock = product.inStockCount - item.quantity;
        product.inStockCount = updatedStock;
      }
    }

    // Only save and log if this was an actively counted item
    if (typeof updatedStock === 'number') {
      recalculateRollups(product);
      product.stockVersion = (product.stockVersion || 0) + 1;
      await product.save({ session: session || null });

      const log = new InventoryLog({
        productId: product._id,
        productName: product.name,
        category: product.category,
        subcategoryId: product.subcategoryId || null,
        variantType,
        colorVariantId,
        sizeVariantId,
        colorName,
        size,
        previousStock,
        updatedStock,
        quantityChanged: -item.quantity,
        operation: 'ORDER_DEDUCTION',
        source: 'ORDER_DEDUCTION',
        reason: `Order #${orderId} purchase`,
        referenceId: orderId,
        adminUsername: 'System',
      });
      await log.save({ session: session || null });
      deductedLogs.push(log);
    }
  }

  // Update order stockDeducted status
  await Order.updateOne(
    { orderId },
    { $set: { stockDeducted: true } },
    session ? { session } : {}
  );

  return { deducted: deductedLogs, success: true };
};

/**
 * PROCESS ORDER RESTORATION:
 * Restores deducted stock when an order is cancelled or items returned.
 * Idempotently checks order state to prevent double restoration.
 */
const processOrderRestoration = async ({ orderId, admin = {}, session = null, reason = 'Order cancelled' }) => {
  if (!orderId) throw new Error('Order ID is required for stock restoration.');

  const order = await Order.findOne({ orderId }).session(session || null);
  if (!order) throw new Error(`Order #${orderId} not found.`);

  // If order never had stock deducted, or was already restored, skip
  if (!order.stockDeducted) {
    return { restored: [], message: 'Order did not have tracked stock deducted.' };
  }
  if (order.stockRestored) {
    return { restored: [], message: 'Stock for this order was already restored previously.' };
  }

  const restoredLogs = [];

  for (const item of order.items) {
    if (!item.product) continue;

    const product = await Product.findById(item.product).session(session || null);
    if (!product) continue;

    const tier = getProductTier(product);
    let previousStock = null;
    let updatedStock = null;
    let variantType = 'SIMPLE';
    let colorName = '';
    let size = '';
    let colorVariantId = null;
    let sizeVariantId = null;

    if (tier === 'TIER_1_COLOR_SIZE' && item.colorVariantId && item.sizeVariantId) {
      variantType = 'COLOR_SIZE';
      colorVariantId = item.colorVariantId;
      sizeVariantId = item.sizeVariantId;

      const cVar = product.colorVariants.find(
        (c) => c._id?.toString() === item.colorVariantId.toString()
      );
      if (cVar) {
        colorName = cVar.colorName;
        const sObj = cVar.sizes.find(
          (s) => s._id?.toString() === item.sizeVariantId.toString()
        );
        if (sObj && typeof sObj.stockCount === 'number') {
          previousStock = sObj.stockCount;
          updatedStock = sObj.stockCount + item.quantity;
          sObj.stockCount = updatedStock;
          size = sObj.size;
        }
      }
    } else if (tier === 'TIER_2_SIZE' && item.size) {
      variantType = 'SIZE';
      const sObj = product.sizes.find((s) => s.size === item.size);
      if (sObj && typeof sObj.stockCount === 'number') {
        previousStock = sObj.stockCount;
        updatedStock = sObj.stockCount + item.quantity;
        sObj.stockCount = updatedStock;
        size = sObj.size;
        sizeVariantId = sObj._id;
      }
    } else {
      // TIER_3_SIMPLE
      variantType = 'SIMPLE';
      if (typeof product.inStockCount === 'number') {
        previousStock = product.inStockCount;
        updatedStock = product.inStockCount + item.quantity;
        product.inStockCount = updatedStock;
      }
    }

    if (typeof updatedStock === 'number') {
      recalculateRollups(product);
      product.stockVersion = (product.stockVersion || 0) + 1;
      await product.save({ session: session || null });

      const log = new InventoryLog({
        productId: product._id,
        productName: product.name,
        category: product.category,
        subcategoryId: product.subcategoryId || null,
        variantType,
        colorVariantId,
        sizeVariantId,
        colorName,
        size,
        previousStock,
        updatedStock,
        quantityChanged: item.quantity,
        operation: 'ORDER_CANCEL_RESTORE',
        source: 'ORDER_CANCEL_RESTORE',
        reason: `${reason} (#${orderId})`,
        referenceId: orderId,
        adminUsername: admin.username || 'Admin',
        adminId: admin.id || admin._id || null,
      });
      await log.save({ session: session || null });
      restoredLogs.push(log);
    }
  }

  order.stockRestored = true;
  await order.save({ session: session || null });

  return { restored: restoredLogs, success: true };
};

/**
 * GET INVENTORY CATALOG:
 * High-performance paginated inventory query with filters and calculated health.
 */
const getInventoryCatalog = async ({
  page = 1,
  limit = 50,
  search = '',
  category = 'all',
  subcategoryId = null,
  stockStatus = 'ALL',
  globalThreshold = GLOBAL_DEFAULT_LOW_STOCK_THRESHOLD,
}) => {
  const query = {};

  if (category && category !== 'all') {
    query.category = new RegExp(`^${category.trim()}$`, 'i');
  }

  if (subcategoryId) {
    query.subcategoryId = subcategoryId;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: new RegExp(s, 'i') },
      { category: new RegExp(s, 'i') },
      { 'colorVariants.colorName': new RegExp(s, 'i') },
      { 'sizes.size': new RegExp(s, 'i') },
    ];
  }

  // Fetch products matching base filters
  const allMatching = await Product.find(query)
    .populate('subcategoryId', 'name')
    .sort({ order: 1, createdAt: -1 })
    .lean();

  // Compute stock health and aggregate KPIs across all matching items
  let totalProducts = 0;
  let totalTrackedUnits = 0;
  let untrackedCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;
  let inactiveCount = 0;

  const catalogWithHealth = allMatching.map((prod) => {
    totalProducts++;
    const health = calculateProductHealth(prod, globalThreshold);

    if (health.status === 'INACTIVE') {
      inactiveCount++;
    } else if (health.status === 'OUT_OF_STOCK') {
      outOfStockCount++;
    } else if (health.status === 'LOW_STOCK') {
      lowStockCount++;
    } else if (health.status === 'UNTRACKED') {
      untrackedCount++;
    } else {
      inStockCount++;
    }

    if (typeof health.totalTrackedStock === 'number') {
      totalTrackedUnits += health.totalTrackedStock;
    }

    return {
      ...prod,
      tier: getProductTier(prod),
      health,
    };
  });

  // Filter by requested status pill if not ALL
  let filtered = catalogWithHealth;
  if (stockStatus && stockStatus !== 'ALL') {
    if (stockStatus === 'INACTIVE') {
      filtered = catalogWithHealth.filter((p) => p.health.status === 'INACTIVE');
    } else if (stockStatus === 'OUT_OF_STOCK') {
      filtered = catalogWithHealth.filter((p) => p.health.status === 'OUT_OF_STOCK');
    } else if (stockStatus === 'LOW_STOCK') {
      filtered = catalogWithHealth.filter((p) => p.health.status === 'LOW_STOCK');
    } else if (stockStatus === 'IN_STOCK') {
      filtered = catalogWithHealth.filter((p) => p.health.status === 'IN_STOCK');
    } else if (stockStatus === 'UNTRACKED') {
      filtered = catalogWithHealth.filter((p) => p.health.status === 'UNTRACKED');
    }
  }

  // Server-side pagination
  const total = filtered.length;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const totalPages = Math.ceil(total / limitNum) || 1;
  const skip = (pageNum - 1) * limitNum;
  const paginatedProducts = filtered.slice(skip, skip + limitNum);

  return {
    products: paginatedProducts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    kpis: {
      totalProducts,
      totalTrackedUnits,
      untrackedCount,
      lowStockCount,
      outOfStockCount,
      inStockCount,
      inactiveCount,
    },
  };
};

/**
 * PREVIEW CSV / EXCEL IMPORT:
 * Generates validation report and diff table without applying changes.
 */
const previewCsvImport = async (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('CSV file contains no readable data rows.');
  }

  const validDiffs = [];
  const errors = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 2; // account for 1-based header row

    const productId = (row.productId || row['Product ID'] || row.id || '').toString().trim();
    const newStockRaw = row.newStock !== undefined ? row.newStock : row['New Stock'] !== undefined ? row['New Stock'] : row.stock;
    const targetSize = (row.size || row['Size'] || '').toString().trim();
    const targetColor = (row.color || row['Color'] || row.colorName || '').toString().trim();

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      errors.push({ row: rowNum, error: `Invalid or missing Product ID "${productId}"` });
      continue;
    }

    const newStock = parseInt(newStockRaw, 10);
    if (isNaN(newStock) || newStock < 0) {
      errors.push({ row: rowNum, productId, error: `Invalid stock quantity "${newStockRaw}". Must be non-negative integer.` });
      continue;
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      errors.push({ row: rowNum, productId, error: `Product with ID ${productId} not found in database.` });
      continue;
    }

    const tier = getProductTier(product);
    let previousStock = null;
    let target = { size: targetSize };

    if (tier === 'TIER_1_COLOR_SIZE') {
      const cVar = product.colorVariants.find(
        (c) => c.colorName.toLowerCase() === targetColor.toLowerCase()
      );
      if (!cVar) {
        errors.push({ row: rowNum, productId, error: `Color "${targetColor}" not found on product "${product.name}".` });
        continue;
      }
      const sObj = cVar.sizes.find((s) => s.size === targetSize);
      if (!sObj) {
        errors.push({ row: rowNum, productId, error: `Size "${targetSize}" not found under color "${targetColor}".` });
        continue;
      }
      previousStock = sObj.stockCount;
      target = {
        variantType: 'COLOR_SIZE',
        colorVariantId: cVar._id,
        sizeVariantId: sObj._id,
        colorName: cVar.colorName,
        size: sObj.size,
      };
    } else if (tier === 'TIER_2_SIZE') {
      const sObj = product.sizes.find((s) => s.size === targetSize);
      if (!sObj) {
        errors.push({ row: rowNum, productId, error: `Size "${targetSize}" not found on product "${product.name}".` });
        continue;
      }
      previousStock = sObj.stockCount;
      target = {
        variantType: 'SIZE',
        sizeVariantId: sObj._id,
        size: sObj.size,
      };
    } else {
      previousStock = product.inStockCount;
      target = { variantType: 'SIMPLE' };
    }

    const prevNumeric = typeof previousStock === 'number' ? previousStock : 0;
    const delta = newStock - prevNumeric;

    validDiffs.push({
      row: rowNum,
      productId: product._id,
      productName: product.name,
      category: product.category,
      target,
      previousStock,
      newStock,
      delta,
      expectedVersion: product.stockVersion || 1,
    });
  }

  return {
    totalRows: rows.length,
    validCount: validDiffs.length,
    errorCount: errors.length,
    diffs: validDiffs,
    errors,
  };
};

/**
 * CONFIRM CSV IMPORT:
 * Validates stockVersion for each staged row against live DB to prevent overwriting concurrent updates.
 */
const confirmCsvImport = async ({ diffs = [], admin = {} }) => {
  if (!Array.isArray(diffs) || diffs.length === 0) {
    throw new Error('No valid staged import diffs to apply.');
  }

  const updates = diffs.map((d) => ({
    productId: d.productId,
    target: d.target,
    operation: 'SET_STOCK',
    value: d.newStock,
    expectedVersion: d.expectedVersion,
    reason: 'CSV batch import confirmation',
  }));

  const res = await bulkSaveInventory({
    updates,
    admin: { ...admin, source: 'CSV_IMPORT' },
  });

  return res;
};

module.exports = {
  GLOBAL_DEFAULT_LOW_STOCK_THRESHOLD,
  getProductTier,
  isItemAvailable,
  calculateProductHealth,
  recalculateRollups,
  setStock,
  adjustStock,
  bulkSaveInventory,
  processOrderDeduction,
  processOrderRestoration,
  getInventoryCatalog,
  previewCsvImport,
  confirmCsvImport,
};
