const express = require('express');
const router = express.Router();
const { createSubcategory, getSubcategories, deleteSubcategory } = require('../controllers/subcategoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/', protectAdmin, createSubcategory);
router.get('/', getSubcategories);
router.delete('/:id', protectAdmin, deleteSubcategory);

module.exports = router;
