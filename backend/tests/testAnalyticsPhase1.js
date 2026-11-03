const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ProductAnalytics = require('../models/ProductAnalytics');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { trackEvent } = require('../controllers/analyticsController');

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find a test product
    const testProduct = await Product.findOne({});
    if (!testProduct) {
      console.log('No products found in DB. Skipping test.');
      process.exit(0);
    }
    console.log(`Found test product: "${testProduct.name}" (ID: ${testProduct._id})`);

    const testSessionId = 'test_session_' + Date.now();

    // 2. Test trackEvent call 1 (should insert and increment)
    console.log('\n--- Test 1: First Event (should record & increment) ---');
    const mockReq1 = {
      body: {
        productId: testProduct._id.toString(),
        eventType: 'CART_ADD',
        sessionId: testSessionId,
        quantity: 2,
      },
      headers: {},
    };
    let resData1 = null;
    const mockRes1 = {
      status: (code) => ({
        json: (data) => {
          resData1 = { code, ...data };
          return resData1;
        },
      }),
    };

    await trackEvent(mockReq1, mockRes1);
    console.log('Event 1 Result:', resData1);

    // Verify ProductAnalytics document
    const pa1 = await ProductAnalytics.findOne({ productId: testProduct._id });
    console.log('ProductAnalytics after event 1:', {
      lifetimeCartAdds: pa1?.lifetimeCartAdds,
      lifetimeCartQty: pa1?.lifetimeCartQty,
    });

    // 3. Test trackEvent call 2 within cooldown (should be deduplicated!)
    console.log('\n--- Test 2: Rapid Repeated Event (should deduplicate) ---');
    const mockReq2 = {
      body: {
        productId: testProduct._id.toString(),
        eventType: 'CART_ADD',
        sessionId: testSessionId,
        quantity: 2,
      },
      headers: {},
    };
    let resData2 = null;
    const mockRes2 = {
      status: (code) => ({
        json: (data) => {
          resData2 = { code, ...data };
          return resData2;
        },
      }),
    };

    await trackEvent(mockReq2, mockRes2);
    console.log('Event 2 Result (Deduplication):', resData2);

    const pa2 = await ProductAnalytics.findOne({ productId: testProduct._id });
    console.log('ProductAnalytics after event 2 (should be UNCHANGED):', {
      lifetimeCartAdds: pa2?.lifetimeCartAdds,
      lifetimeCartQty: pa2?.lifetimeCartQty,
    });

    // Assert deduplication succeeded
    if (resData2.deduplicated === true && pa2.lifetimeCartAdds === pa1.lifetimeCartAdds) {
      console.log(' SUCCESS: Deduplication prevented duplicate counter inflation!');
    } else {
      console.error(' FAILURE: Deduplication did not work as expected.');
    }

    // 4. Test Cleanup of test event
    await AnalyticsEvent.deleteMany({ sessionId: testSessionId });
    console.log('\nCleaned up test session analytics events.');

    console.log('\nAll Phase 1 backend analytics tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runTest();
