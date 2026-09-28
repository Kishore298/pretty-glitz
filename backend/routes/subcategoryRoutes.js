const express = require('express');
const router = express.Router();
const { createSubcategory, getSubcategories, updateSubcategory, deleteSubcategory } = require('../controllers/subcategoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protectAdmin, createSubcategory)
  .get(getSubcategories);

router.route('/reorder')
  .put(protectAdmin, require('../controllers/subcategoryController').updateSubcategoryOrders);

router.route('/:id')
  .put(protectAdmin, updateSubcategory)
  .delete(protectAdmin, deleteSubcategory);

module.exports = router;
