const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrders } = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCategories)
  .post(protectAdmin, createCategory);

router.route('/reorder')
  .put(protectAdmin, updateCategoryOrders);

router.route('/:id')
  .put(protectAdmin, updateCategory)
  .delete(protectAdmin, deleteCategory);

module.exports = router;
