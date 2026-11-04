const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  reorderProducts,
} = require('../controllers/productController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protectAdmin, createProduct)
  .get(getProducts);

router.route('/reorder')
  .put(protectAdmin, reorderProducts);

router.route('/:id')
  .get(getProductById)
  .put(protectAdmin, updateProduct)
  .delete(protectAdmin, deleteProduct);

module.exports = router;
