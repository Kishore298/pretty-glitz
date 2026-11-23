const express = require('express');
const router = express.Router();
const { protectAdmin, protectCustomer } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  trackOrderPublic,
  getMyOrders,
  updateOrderStatus,
  resendWhatsAppOrderMessage,
} = require('../controllers/orderController');

// Customer places order request
router.post('/', createOrder);

// Customer view their own orders
router.get('/my-orders', protectCustomer, getMyOrders);

// Public Order Tracking (used by customers & push notification links)
router.get('/track/:orderId', trackOrderPublic);

// Admin Order Management
router.get('/', protectAdmin, getOrders);
router.get('/:id', protectAdmin, getOrderById);
router.patch('/:id/status', protectAdmin, updateOrderStatus);
router.post('/:id/resend-whatsapp', protectAdmin, resendWhatsAppOrderMessage);

module.exports = router;

