const express = require('express');
const router = express.Router();
const { getCategories, updateCategory } = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCategories);

router.route('/reorder')
  .put(protectAdmin, require('../controllers/categoryController').updateCategoryOrders);

router.route('/:id')
  .put(protectAdmin, updateCategory);

module.exports = router;
