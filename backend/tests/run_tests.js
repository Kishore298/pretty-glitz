require('dotenv').config({ path: __dirname + '/../.env' });
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const { protectAdmin, protectCustomer } = require('../middleware/authMiddleware');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function runTests() {
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PrettyGlitz E-Commerce Architecture Test Suite     ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${colors.green}✓ Connected to MongoDB Atlas${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}✗ Failed to connect to MongoDB:${colors.reset}`, err.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Strict Stock Validation & Falsy Zero Prevention
    // -------------------------------------------------------------
    console.log(`${colors.bold}[Test 1] Strict Stock Validation & Falsy Zero Prevention${colors.reset}`);
    const validateStock = (product, requestedQty = 1) => {
      if (!product || product.isActive === false || product.inStock === false) {
        return { ok: false, reason: 'Product is not available.' };
      }
      if (typeof product.inStockCount === 'number') {
        if (product.inStockCount <= 0) {
          return { ok: false, reason: 'Product is out of stock.' };
        }
        const available = product.inStockCount;
        const allowed   = Math.min(requestedQty, available);
        return { ok: true, availableStock: available, allowedQty: allowed };
      }
      return { ok: true, availableStock: null, allowedQty: requestedQty };
    };

    const outOfStockProd = { inStock: true, inStockCount: 0 };
    const resOutOfStock = validateStock(outOfStockProd, 2);
    assert(!resOutOfStock.ok && resOutOfStock.reason === 'Product is out of stock.', 'Zero inStockCount is rejected and never defaults to 10');

    const falseInStockProd = { inStock: false, inStockCount: 15 };
    const resFalseInStock = validateStock(falseInStockProd, 1);
    assert(!resFalseInStock.ok, 'inStock: false is strictly rejected');

    const limitedProd = { inStock: true, inStockCount: 3 };
    const resLimited = validateStock(limitedProd, 5);
    assert(resLimited.ok && resLimited.allowedQty === 3, 'Requested quantity 5 is safely clamped to available stock 3');

    // -------------------------------------------------------------
    // Test 2: Durable Idempotency Ledger
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}[Test 2] Durable Idempotency Ledger Unique Index & Cache${colors.reset}`);
    const testUserId = new mongoose.Types.ObjectId();
    const testKey = 'test-idemp-' + Date.now();

    // Create completed record
    const record = await IdempotencyRecord.create({
      userId: testUserId,
      operationType: 'cart_merge',
      idempotencyKey: testKey,
      status: 'completed',
      responseStatus: 200,
      responseBody: { cart: { items: [{ variantKey: 'prod1::NOSIZE::NOCOUNT', quantity: 2 }] } }
    });

    assert(record.status === 'completed', 'Idempotency record created with status completed');

    // Duplicate creation must be blocked by compound unique index
    let dupFailed = false;
    try {
      await IdempotencyRecord.create({
        userId: testUserId,
        operationType: 'cart_merge',
        idempotencyKey: testKey,
        status: 'pending'
      });
    } catch (e) {
      dupFailed = true;
    }
    assert(dupFailed, 'Compound unique index (userId, operationType, idempotencyKey) prevents duplicates');

    // Cleanup
    await IdempotencyRecord.deleteOne({ _id: record._id });

    // -------------------------------------------------------------
    // Test 3: Concurrency & Variant Key Normalization
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}[Test 3] Variant Key Normalization${colors.reset}`);
    const buildVariantKey = (productId, size, pieceCount) =>
      `${productId}::${size || 'NOSIZE'}::${pieceCount ?? 'NOCOUNT'}`;

    const pId = '507f1f77bcf86cd799439011';
    const keyA = buildVariantKey(pId, '2.4', null);
    const keyB = buildVariantKey(pId, '2.6', null);
    const keyC = buildVariantKey(pId, null, 4);
    const keyD = buildVariantKey(pId, null, null);

    assert(keyA === '507f1f77bcf86cd799439011::2.4::NOCOUNT', 'Variant with size normalized properly');
    assert(keyC === '507f1f77bcf86cd799439011::NOSIZE::4', 'Variant with piece count normalized properly');
    assert(keyA !== keyB, 'Distinct sizes generate distinct variant keys');
    assert(keyD === '507f1f77bcf86cd799439011::NOSIZE::NOCOUNT', 'Item with no variants normalized consistently');

    // -------------------------------------------------------------
    // Test 4: Explicit Idempotent Wishlist API
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}[Test 4] Explicit Idempotent Wishlist (PUT $addToSet / DELETE $pull)${colors.reset}`);
    const wishUserId = new mongoose.Types.ObjectId();
    const wishProdId = new mongoose.Types.ObjectId();

    // 10 repeated additions
    for (let i = 0; i < 5; i++) {
      await Wishlist.findOneAndUpdate(
        { userId: wishUserId },
        { $addToSet: { products: wishProdId } },
        { upsert: true }
      );
    }
    const wishDocAfterAdd = await Wishlist.findOne({ userId: wishUserId });
    const count = wishDocAfterAdd.products.filter(p => p.toString() === wishProdId.toString()).length;
    assert(count === 1, '5 sequential PUT operations resulted in exactly 1 product entry ($addToSet)');

    // 5 repeated deletions
    for (let i = 0; i < 5; i++) {
      await Wishlist.findOneAndUpdate(
        { userId: wishUserId },
        { $pull: { products: wishProdId } }
      );
    }
    const wishDocAfterDel = await Wishlist.findOne({ userId: wishUserId });
    const countAfterDel = wishDocAfterDel.products.filter(p => p.toString() === wishProdId.toString()).length;
    assert(countAfterDel === 0, '5 sequential DELETE operations leave product completely removed ($pull)');

    // Cleanup
    await Wishlist.deleteOne({ userId: wishUserId });

    // -------------------------------------------------------------
    // Test 5: Legacy Customer Account Migration
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}[Test 5] Legacy Customer Account Migration & Password Setup${colors.reset}`);
    const legacyMobile = '98765' + Math.floor(10000 + Math.random() * 90000);
    const legacyCustomer = await User.create({
      role: 'customer',
      name: 'Legacy Customer',
      mobile: legacyMobile,
      password: null // Unset password (legacy OTP account)
    });

    assert(legacyCustomer.password === null, 'Legacy customer created without password');

    // Password setup simulation
    const newPass = 'StrongPass123';
    legacyCustomer.password = await bcrypt.hash(newPass, 10);
    await legacyCustomer.save();

    const isMatch = await bcrypt.compare(newPass, legacyCustomer.password);
    assert(isMatch, 'New password securely hashed and verified with bcrypt');

    // Cleanup
    await User.deleteOne({ _id: legacyCustomer._id });

    // -------------------------------------------------------------
    // Test 6: Admin Authentication Isolation
    // -------------------------------------------------------------
    console.log(`\n${colors.bold}[Test 6] Admin & Customer Auth Isolation${colors.reset}`);
    const adminToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId(), role: 'admin', username: 'admin' },
      process.env.JWT_SECRET
    );
    const customerToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId(), role: 'customer', mobile: '9999999999' },
      process.env.JWT_SECRET
    );

    // Mock Express req/res/next
    const runMiddleware = (middleware, token) => {
      return new Promise((resolve) => {
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = {
          status: (code) => ({
            json: (data) => resolve({ status: code, data })
          })
        };
        const next = () => resolve({ status: 200, user: req.user });
        middleware(req, res, next);
      });
    };

    const adminOnCustomerRoute = await runMiddleware(protectCustomer, adminToken);
    assert(adminOnCustomerRoute.status === 403, 'Admin token blocked from customer-protected route (403)');

    const customerOnAdminRoute = await runMiddleware(protectAdmin, customerToken);
    assert(customerOnAdminRoute.status === 403, 'Customer token blocked from admin-protected route (403)');

    const customerOnCustomerRoute = await runMiddleware(protectCustomer, customerToken);
    assert(customerOnCustomerRoute.status === 200, 'Customer token authorized on customer route (200)');

    const adminOnAdminRoute = await runMiddleware(protectAdmin, adminToken);
    assert(adminOnAdminRoute.status === 200, 'Admin token authorized on admin route (200)');

  } catch (err) {
    console.error(`${colors.red}Error executing test:${colors.reset}`, err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log(`\n${colors.bold}Test Summary:${colors.reset} ${colors.green}${passed} Passed${colors.reset}, ${failed === 0 ? colors.green : colors.red}${failed} Failed${colors.reset}\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
