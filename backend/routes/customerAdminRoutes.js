const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const { getCustomers, getCustomerOrders, sendCustomerWhatsAppOffer } = require('../controllers/customerAdminController');

// All routes protected by admin authentication
router.get('/', protectAdmin, getCustomers);
router.post('/send-whatsapp-offer', protectAdmin, sendCustomerWhatsAppOffer);
router.get('/:phone/orders', protectAdmin, getCustomerOrders);

module.exports = router;
