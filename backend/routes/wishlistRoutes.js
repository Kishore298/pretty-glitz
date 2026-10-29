const express = require('express');
const router = express.Router();
const { protectCustomer } = require('../middleware/authMiddleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  mergeWishlist,
  clearWishlist,
} = require('../controllers/wishlistController');

router.get('/', protectCustomer, getWishlist);
router.put('/items/:productId', protectCustomer, addToWishlist);
router.delete('/items/:productId', protectCustomer, removeFromWishlist);
router.post('/merge', protectCustomer, mergeWishlist);
router.delete('/', protectCustomer, clearWishlist);

module.exports = router;
