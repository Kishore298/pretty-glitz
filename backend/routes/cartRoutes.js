const express = require('express');
const router = express.Router();
const { protectCustomer } = require('../middleware/authMiddleware');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  mergeCart,
  clearCart,
  validateCartStock,
} = require('../controllers/cartController');

// Public validation endpoint for both guest and authenticated carts
router.post('/validate', validateCartStock);

router.get('/', protectCustomer, getCart);
router.post('/items', protectCustomer, addItem);
router.put('/items/:variantKey', protectCustomer, updateItem);
router.delete('/items/:variantKey', protectCustomer, removeItem);
router.post('/merge', protectCustomer, mergeCart);
router.delete('/', protectCustomer, clearCart);

module.exports = router;
