const express = require('express');
const router = express.Router();
const { createSubcategory, getSubcategories, deleteSubcategory, updateSubcategory, reorderSubcategories } = require('../controllers/subcategoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/', protectAdmin, createSubcategory);
router.get('/', getSubcategories);
router.put('/reorder', protectAdmin, reorderSubcategories);
router.put('/:id', protectAdmin, updateSubcategory);
router.delete('/:id', protectAdmin, deleteSubcategory);

module.exports = router;
