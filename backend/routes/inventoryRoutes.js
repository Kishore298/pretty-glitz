const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  getInventory,
  updateSingleStock,
  bulkUpdate,
  getInventoryLogs,
  exportInventory,
  previewImport,
  confirmImport,
} = require('../controllers/inventoryController');

// Memory storage for Excel/CSV parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/', protectAdmin, getInventory);
router.post('/update-stock', protectAdmin, updateSingleStock);
router.post('/bulk-update', protectAdmin, bulkUpdate);
router.get('/logs', protectAdmin, getInventoryLogs);
router.get('/export', protectAdmin, exportInventory);
router.post('/import/preview', protectAdmin, upload.single('file'), previewImport);
router.post('/import/confirm', protectAdmin, confirmImport);

module.exports = router;
