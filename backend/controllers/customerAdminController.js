const Order = require('../models/Order');
const User = require('../models/User');
const whatsappService = require('../services/whatsappService');

/**
 * GET /api/admin/customers
 * Aggregates all customer accounts and order records to provide actionable business intelligence.
 */
const getCustomers = async (req, res) => {
  try {
    const { search, sortBy = 'totalSpend', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

    // 1. Fetch all orders (active & completed)
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    // 2. Fetch all registered customer users
    const registeredUsers = await User.find({ role: 'customer' }).lean();

    // Map by cleaned 10-digit mobile number
    const customerMap = new Map();

    // Add registered users first
    registeredUsers.forEach((u) => {
      const cleanPhone = String(u.mobile || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        customerMap.set(cleanPhone, {
          id: u._id,
          name: u.name || 'Customer',
          phone: cleanPhone,
          isRegistered: true,
          registeredAt: u.createdAt,
          totalOrders: 0,
          totalSpend: 0,
          orders: [],
          statusCounts: {},
          lastOrderDate: null,
          firstOrderDate: null,
          city: '',
          address: '',
        });
      }
    });

    // Aggregate orders
    orders.forEach((ord) => {
      const rawPhone = ord.customerPhone || ord.shippingAddress?.phone || '';
      const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
      if (!cleanPhone) return;

      let cust = customerMap.get(cleanPhone);
      if (!cust) {
        cust = {
          id: ord.userId || null,
          name: ord.customerName || ord.shippingAddress?.fullName || 'Guest Customer',
          phone: cleanPhone,
          isRegistered: false,
          registeredAt: null,
          totalOrders: 0,
          totalSpend: 0,
          orders: [],
          statusCounts: {},
          lastOrderDate: null,
          firstOrderDate: null,
          city: '',
          address: '',
        };
        customerMap.set(cleanPhone, cust);
      }

      // Update name if customer has a more specific name on order
      if (ord.customerName && (cust.name === 'Customer' || cust.name === 'Guest Customer')) {
        cust.name = ord.customerName;
      }

      cust.totalOrders += 1;
      const orderAmount = Number(ord.totalAmount) || 0;
      cust.totalSpend += orderAmount;

      // Status breakdown
      const status = ord.status || 'PENDING';
      cust.statusCounts[status] = (cust.statusCounts[status] || 0) + 1;

      // Dates
      const ordDate = new Date(ord.createdAt);
      if (!cust.lastOrderDate || ordDate > new Date(cust.lastOrderDate)) {
        cust.lastOrderDate = ord.createdAt;
      }
      if (!cust.firstOrderDate || ordDate < new Date(cust.firstOrderDate)) {
        cust.firstOrderDate = ord.createdAt;
      }

      // Latest address & city
      if (!cust.city && (ord.customerCity || ord.shippingAddress?.city)) {
        cust.city = ord.customerCity || ord.shippingAddress?.city;
      }
      if (!cust.address && (ord.customerAddress || ord.shippingAddress?.streetAddress)) {
        cust.address = ord.customerAddress || ord.shippingAddress?.streetAddress;
      }
    });

    // Convert map to array and compute derived metrics
    let customerList = Array.from(customerMap.values()).map((c) => ({
      ...c,
      averageOrderValue: c.totalOrders > 0 ? Math.round(c.totalSpend / c.totalOrders) : 0,
      repeatCustomer: c.totalOrders > 1,
    }));

    // Filter by search query if provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      customerList = customerList.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }

    // Sort customers
    customerList.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'lastOrderDate') {
        valA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        valB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      }
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    // Overall KPI statistics
    const totalCustomers = customerMap.size;
    const repeatCustomers = Array.from(customerMap.values()).filter((c) => c.totalOrders > 1).length;
    const totalRevenue = Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalSpend, 0);
    const totalOrdersCount = orders.length;
    const overallAOV = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        repeatCustomers,
        repeatRate,
        totalRevenue,
        totalOrdersCount,
        overallAOV,
      },
      customers: customerList,
    });
  } catch (err) {
    console.error('[customerAdminController] getCustomers error:', err);
    return res.status(500).json({ message: 'Failed to retrieve customer analytics.' });
  }
};

/**
 * GET /api/admin/customers/:phone/orders
 * Retrieves the complete order history and detailed line items for a specific customer.
 */
const getCustomerOrders = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    const orders = await Order.find({
      $or: [
        { customerPhone: cleanPhone },
        { customerPhone: `+91${cleanPhone}` },
        { 'shippingAddress.phone': cleanPhone },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Registered user profile if available
    const user = await User.findOne({ mobile: cleanPhone, role: 'customer' }).select('-password').lean();

    return res.status(200).json({
      success: true,
      phone: cleanPhone,
      user,
      orders,
    });
  } catch (err) {
    console.error('[customerAdminController] getCustomerOrders error:', err);
    return res.status(500).json({ message: 'Failed to retrieve customer order details.' });
  }
};

/**
 * POST /api/admin/customers/send-whatsapp-offer
 * Allows admins to dispatch custom offer WhatsApp messages to customers.
 */
const sendCustomerWhatsAppOffer = async (req, res) => {
  try {
    const { customerPhone, customerName, offerMessage } = req.body;

    if (!customerPhone) {
      return res.status(400).json({ message: 'Customer phone number is required.' });
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number.' });
    }

    if (!offerMessage || !offerMessage.trim()) {
      return res.status(400).json({ message: 'Offer message text cannot be empty.' });
    }

    const result = await whatsappService.sendCustomOffer({
      phone: cleanPhone,
      customerName: customerName ? customerName.trim() : '',
      offerText: offerMessage.trim(),
    });

    const waLink = whatsappService.generateWhatsAppDeepLink(
      cleanPhone,
      `✨ PrettyGlitz Special Offer ✨\n\n${customerName ? `Dear ${customerName},\n\n` : ''}${offerMessage.trim()}`
    );

    return res.status(200).json({
      success: true,
      message: 'Custom offer message sent successfully to customer WhatsApp.',
      simulated: result.simulated || false,
      messageId: result.messageId,
      waLink,
    });
  } catch (err) {
    console.error('[customerAdminController] sendCustomerWhatsAppOffer error:', err);
    return res.status(500).json({ message: err.message || 'Failed to dispatch WhatsApp offer message.' });
  }
};

module.exports = {
  getCustomers,
  getCustomerOrders,
  sendCustomerWhatsAppOffer,
};
