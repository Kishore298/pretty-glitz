const mongoose = require('mongoose');
const XLSX = require('xlsx');
const User = require('../models/User');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const inventoryService = require('../services/inventoryService');

/**
 * Helper: Extract admin identity securely from authenticated JWT session.
 */
const getAdminInfo = async (req) => {
  try {
    if (req.user?.username) {
      return { id: req.user.userId || req.user._id, username: req.user.username };
    }
    if (req.user?.userId) {
      const u = await User.findById(req.user.userId).select('username role').lean();
      return { id: u?._id, username: u?.username || 'Admin' };
    }
  } catch (err) {
    console.error('[Inventory] getAdminInfo lookup error:', err.message);
  }
  return { id: null, username: 'Admin' };
};

/**
 * GET /api/inventory
 * Paginated catalog with health calculations and KPIs.
 */
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = 'all',
      subcategoryId,
      stockStatus = 'ALL',
      threshold,
    } = req.query;

    const parsedThreshold = threshold ? parseInt(threshold, 10) : inventoryService.GLOBAL_DEFAULT_LOW_STOCK_THRESHOLD;

    const result = await inventoryService.getInventoryCatalog({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      category,
      subcategoryId: subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId) ? subcategoryId : null,
      stockStatus: stockStatus.toUpperCase(),
      globalThreshold: isNaN(parsedThreshold) ? 5 : parsedThreshold,
    });

    res.json(result);
  } catch (error) {
    console.error('[inventoryController] getInventory error:', error);
    res.status(500).json({ message: 'Failed to retrieve inventory catalog.', error: error.message });
  }
};

/**
 * POST /api/inventory/update-stock
 * Dedicated endpoint for single item Set / Adjust stock operation.
 */
const updateSingleStock = async (req, res) => {
  try {
    const {
      productId,
      target = {},
      operation = 'SET_STOCK',
      value,
      delta,
      expectedVersion,
      reason,
    } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Valid productId is required.' });
    }

    const admin = await getAdminInfo(req);

    if (operation === 'ADJUST_STOCK') {
      const result = await inventoryService.adjustStock({
        productId,
        target,
        delta,
        admin,
        reason: reason || 'Admin quick adjust stock',
      });
      return res.json(result);
    }

    // Default to SET_STOCK
    const result = await inventoryService.setStock({
      productId,
      target,
      value,
      expectedVersion,
      admin,
      reason: reason || 'Admin manual set stock',
    });

    return res.json(result);
  } catch (error) {
    console.error('[inventoryController] updateSingleStock error:', error);
    if (error.status === 409 || error.conflict) {
      return res.status(409).json({
        message: error.message,
        conflict: error.conflict,
      });
    }
    return res.status(400).json({ message: error.message || 'Failed to update stock.' });
  }
};

/**
 * POST /api/inventory/update-variants
 * Batch update variant tree for a single product from Drawer.
 */
const updateVariants = async (req, res) => {
  try {
    const {
      productId,
      expectedVersion,
      tier,
      colorVariants,
      sizes,
      reason,
    } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Valid productId is required.' });
    }

    const admin = await getAdminInfo(req);
    const result = await inventoryService.updateProductVariants({
      productId,
      expectedVersion,
      tier,
      colorVariants,
      sizes,
      admin: { ...admin, source: 'DRAWER_ADMIN' },
      reason: reason || 'Drawer variant stock update',
    });

    return res.json(result);
  } catch (error) {
    console.error('[inventoryController] updateVariants error:', error);
    if (error.status === 409 || error.conflict) {
      return res.status(409).json({
        message: error.message,
        conflict: error.conflict,
      });
    }
    return res.status(400).json({ message: error.message || 'Failed to update variant stock.' });
  }
};

/**
 * POST /api/inventory/bulk-update
 * Batch update staged changes across multiple products and variants.
 */
const bulkUpdate = async (req, res) => {
  try {
    const { updates = [] } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided in batch payload.' });
    }

    const admin = await getAdminInfo(req);
    const result = await inventoryService.bulkSaveInventory({
      updates,
      admin,
    });

    return res.json(result);
  } catch (error) {
    console.error('[inventoryController] bulkUpdate error:', error);
    return res.status(500).json({ message: 'Failed to process bulk update.', error: error.message });
  }
};

/**
 * GET /api/inventory/logs
 * Audit history ledger with search and filters.
 */
const getInventoryLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      productId,
      operation,
      source,
      search,
    } = req.query;

    const query = {};

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    if (operation && operation !== 'ALL') {
      query.operation = operation;
    }

    if (source && source !== 'ALL') {
      query.source = source;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { productName: new RegExp(s, 'i') },
        { category: new RegExp(s, 'i') },
        { colorName: new RegExp(s, 'i') },
        { size: new RegExp(s, 'i') },
        { adminUsername: new RegExp(s, 'i') },
        { referenceId: new RegExp(s, 'i') },
        { reason: new RegExp(s, 'i') },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      InventoryLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InventoryLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[inventoryController] getInventoryLogs error:', error);
    res.status(500).json({ message: 'Failed to retrieve inventory logs.', error: error.message });
  }
};

/**
 * GET /api/inventory/export
 * Flattens catalog into structured rows for Excel / CSV export.
 */
const exportInventory = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('subcategoryId', 'name')
      .sort({ category: 1, order: 1, name: 1 })
      .lean();

    const rows = [];

    products.forEach((prod) => {
      const tier = inventoryService.getProductTier(prod);
      const subcatName = prod.subcategoryId?.name || '';
      const threshold = prod.lowStockThreshold || 5;

      if (tier === 'TIER_1_COLOR_SIZE') {
        prod.colorVariants.forEach((cVar) => {
          if (Array.isArray(cVar.sizes) && cVar.sizes.length > 0) {
            cVar.sizes.forEach((s) => {
              rows.push({
                'Product ID': prod._id.toString(),
                'Product Name': prod.name,
                'Category': prod.category,
                'Subcategory': subcatName,
                'Variant Type': 'COLOR_SIZE',
                'Color': cVar.colorName,
                'Size': s.size,
                'Current Stock': typeof s.stockCount === 'number' ? s.stockCount : 0,
                'Tracked': typeof s.stockCount === 'number' ? 'YES' : 'NO',
                'In Stock Flag': s.inStock ? 'YES' : 'NO',
                'Low Stock Threshold': threshold,
                'Stock Version': prod.stockVersion || 1,
                'Status': prod.isActive ? (s.stockCount <= 0 ? 'Out of Stock' : (s.stockCount <= threshold ? 'Low Stock' : 'In Stock')) : 'Inactive',
              });
            });
          }
        });
      } else if (tier === 'TIER_2_SIZE') {
        if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
          prod.sizes.forEach((s) => {
            rows.push({
              'Product ID': prod._id.toString(),
              'Product Name': prod.name,
              'Category': prod.category,
              'Subcategory': subcatName,
              'Variant Type': 'SIZE',
              'Color': 'N/A',
              'Size': s.size,
              'Current Stock': typeof s.stockCount === 'number' ? s.stockCount : 0,
              'Tracked': typeof s.stockCount === 'number' ? 'YES' : 'NO',
              'In Stock Flag': s.inStock ? 'YES' : 'NO',
              'Low Stock Threshold': threshold,
              'Stock Version': prod.stockVersion || 1,
              'Status': prod.isActive ? (s.stockCount <= 0 ? 'Out of Stock' : (s.stockCount <= threshold ? 'Low Stock' : 'In Stock')) : 'Inactive',
            });
          });
        }
      } else {
        // TIER_3_SIMPLE
        const isTracked = typeof prod.inStockCount === 'number';
        rows.push({
          'Product ID': prod._id.toString(),
          'Product Name': prod.name,
          'Category': prod.category,
          'Subcategory': subcatName,
          'Variant Type': 'SIMPLE',
          'Color': 'N/A',
          'Size': 'N/A',
          'Current Stock': isTracked ? prod.inStockCount : 'Untracked',
          'Tracked': isTracked ? 'YES' : 'NO',
          'In Stock Flag': prod.inStock ? 'YES' : 'NO',
          'Low Stock Threshold': threshold,
          'Stock Version': prod.stockVersion || 1,
          'Status': prod.isActive ? (!prod.inStock || prod.inStockCount === 0 ? 'Out of Stock' : (isTracked && prod.inStockCount <= threshold ? 'Low Stock' : 'In Stock')) : 'Inactive',
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    const format = (req.query.format || 'xlsx').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="prettyglitz-inventory-${dateStr}.csv"`);
      return res.send(csvOutput);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="prettyglitz-inventory-${dateStr}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    console.error('[inventoryController] exportInventory error:', error);
    res.status(500).json({ message: 'Failed to export inventory catalog.', error: error.message });
  }
};

/**
 * POST /api/inventory/import/preview
 * Validates uploaded sheet and generates dry-run diff report.
 */
const previewImport = async (req, res) => {
  try {
    let rows = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      return res.status(400).json({ message: 'Please upload an Excel/CSV file or provide rows array.' });
    }

    const previewResult = await inventoryService.previewCsvImport(rows);
    res.json(previewResult);
  } catch (error) {
    console.error('[inventoryController] previewImport error:', error);
    res.status(400).json({ message: error.message || 'Failed to parse import file.' });
  }
};

/**
 * POST /api/inventory/import/confirm
 * Validates stockVersion for each diff and commits batch updates.
 */
const confirmImport = async (req, res) => {
  try {
    const { diffs = [] } = req.body;
    if (!Array.isArray(diffs) || diffs.length === 0) {
      return res.status(400).json({ message: 'No diffs provided for confirmation.' });
    }

    const admin = await getAdminInfo(req);
    const result = await inventoryService.confirmCsvImport({
      diffs,
      admin,
    });

    res.json(result);
  } catch (error) {
    console.error('[inventoryController] confirmImport error:', error);
    res.status(500).json({ message: 'Failed to commit import updates.', error: error.message });
  }
};

module.exports = {
  getInventory,
  updateSingleStock,
  updateVariants,
  bulkUpdate,
  getInventoryLogs,
  exportInventory,
  previewImport,
  confirmImport,
};
