const mongoose = require('mongoose');
const Subscriber = require('../models/Subscriber');

// Email regex validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * @desc   Register a new email subscriber (Public)
 * @route  POST /api/subscribers
 * @access Public
 */
const subscribe = async (req, res) => {
  try {
    const { email, source } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format (e.g. name@example.com).',
      });
    }

    // Check if subscriber already exists
    const existing = await Subscriber.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        existing.source = source || existing.source;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated successfully.',
          subscriber: existing,
        });
      }
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to PrettyGlitz exclusive offers!',
      });
    }

    const newSubscriber = await Subscriber.create({
      email: normalizedEmail,
      source: source || 'exclusive_offers_banner',
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! You will receive our latest exclusive offers and updates.',
      subscriber: newSubscriber,
    });
  } catch (error) {
    console.error('Subscriber error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to PrettyGlitz exclusive offers!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to process subscription. Please try again later.',
    });
  }
};

/**
 * @desc   Get all subscribers with pagination & search (Admin)
 * @route  GET /api/subscribers
 * @access Admin
 */
const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.email = { $regex: escapedSearch, $options: 'i' };
    }

    const skip = (safePage - 1) * safeLimit;
    const [filteredTotal, subscribers, totalActive, totalUnsubscribed] = await Promise.all([
      Subscriber.countDocuments(query),
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Subscriber.countDocuments({ status: 'active' }),
      Subscriber.countDocuments({ status: 'unsubscribed' }),
    ]);

    res.json({
      success: true,
      subscribers,
      pagination: {
        total: filteredTotal,
        page: safePage,
        pages: Math.max(1, Math.ceil(filteredTotal / safeLimit)),
        limit: safeLimit,
      },
      counts: {
        total: totalActive + totalUnsubscribed,
        active: totalActive,
        unsubscribed: totalUnsubscribed,
      },
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving subscribers' });
  }
};

/**
 * @desc   Delete a subscriber (Admin)
 * @route  DELETE /api/subscribers/:id
 * @access Admin
 */
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subscriber ID' });
    }
    const deleted = await Subscriber.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }
    res.json({ success: true, message: 'Subscriber removed successfully' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting subscriber' });
  }
};

/**
 * @desc   Toggle subscriber status (active/unsubscribed) (Admin)
 * @route  PATCH /api/subscribers/:id/status
 * @access Admin
 */
const toggleSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subscriber ID' });
    }
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    subscriber.status = subscriber.status === 'active' ? 'unsubscribed' : 'active';
    await subscriber.save();

    res.json({
      success: true,
      message: `Subscriber marked as ${subscriber.status}`,
      subscriber,
    });
  } catch (error) {
    console.error('Toggle subscriber status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating subscriber status' });
  }
};

module.exports = {
  subscribe,
  getSubscribers,
  deleteSubscriber,
  toggleSubscriberStatus,
};
