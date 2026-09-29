const express = require('express');
const router = express.Router();
const { createSubcategory, getSubcategories, deleteSubcategory } = require('../controllers/subcategoryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSubcategory);
router.get('/', getSubcategories);
router.delete('/:id', protect, deleteSubcategory);

module.exports = router;
