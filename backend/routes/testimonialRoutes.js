const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials
} = require('../controllers/testimonialController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getTestimonials);                        // Public: active testimonials
router.get('/all', protectAdmin, getAllTestimonials);     // Admin: all testimonials
router.put('/reorder', protectAdmin, reorderTestimonials);// Admin: reorder testimonials
router.post('/', protectAdmin, createTestimonial);
router.put('/:id', protectAdmin, updateTestimonial);
router.delete('/:id', protectAdmin, deleteTestimonial);

module.exports = router;
