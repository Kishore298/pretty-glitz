const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const { getProducts } = require('../controllers/productController');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('  PrettyGlitz Taxonomy & Three-Tier Stock Verification  ');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // Test 1: Category Taxonomy
  console.log('[Test 1] Category Taxonomy Integrity');
  const dgbCategory = await Category.findOne({ name: 'Designer Glass Bangles' });
  assert(Boolean(dgbCategory), 'Category "Designer Glass Bangles" exists as a main category');

  const weddingCategory = await Category.findOne({ name: 'Wedding Bangles' });
  assert(Boolean(weddingCategory), 'Category "Wedding Bangles" exists as a top-level main category');

  const antiqueCategory = await Category.findOne({ name: 'Antique Bangles' });
  assert(Boolean(antiqueCategory), 'Category "Antique Bangles" exists as a top-level main category');

  const valaikaappuCategory = await Category.findOne({ name: 'Valaikaappu Bangles' });
  assert(Boolean(valaikaappuCategory), 'Category "Valaikaappu Bangles" exists as a top-level main category');

  const legacyGlassCategory = await Category.findOne({ name: /^glass\s+bangles$/i });
  assert(!legacyGlassCategory, 'No duplicate standalone top-level category named "Glass Bangles"');

  // Test 2: Subcategory Scoping
  console.log('\n[Test 2] Subcategory Scoping');
  const dgbSubs = await Subcategory.find({ category: 'Designer Glass Bangles' });
  assert(dgbSubs.length >= 4, `Designer Glass Bangles has ${dgbSubs.length} subcategories (expected >= 4)`);

  const otherBangleSubs = await Subcategory.find({
    category: { $in: ['Wedding Bangles', 'Antique Bangles', 'Valaikaappu Bangles'] },
  });
  assert(otherBangleSubs.length === 0, 'Wedding, Antique, and Valaikaappu Bangles have 0 subcategories (strictly top-level)');

  // Test 3: Product Queries & Rollup
  console.log('\n[Test 3] Product Queries & Main Category Rollup');
  
  // Test mock controller req/res for Designer Glass Bangles rollup
  let dgbResult = [];
  await getProducts(
    { query: { category: 'Designer Glass Bangles' } },
    { json: (data) => { dgbResult = data; } }
  );
  assert(dgbResult.length >= 4, `Querying "Designer Glass Bangles" returns ${dgbResult.length} products (rollup across subcategories)`);

  // Test legacy alias rollup
  let legacyResult = [];
  await getProducts(
    { query: { category: 'Glass Bangles' } },
    { json: (data) => { legacyResult = data; } }
  );
  assert(legacyResult.length === dgbResult.length, `Legacy query "Glass Bangles" correctly returns identical rollup count (${legacyResult.length})`);

  // Test specific subcategory query
  const dailyWearSub = dgbSubs.find((s) => s.name === 'Daily Wear Bangles') || dgbSubs[0];
  let subResult = [];
  await getProducts(
    { query: { category: 'Designer Glass Bangles', subcategoryId: dailyWearSub._id.toString() } },
    { json: (data) => { subResult = data; } }
  );
  assert(subResult.length > 0, `Querying subcategory "${dailyWearSub.name}" returns ${subResult.length} assigned products`);
  assert(
    subResult.every((p) => p.subcategoryId && (p.subcategoryId._id || p.subcategoryId).toString() === dailyWearSub._id.toString()),
    'All returned products strictly belong to the queried subcategory'
  );

  // Test other bangles direct query
  let weddingResult = [];
  await getProducts(
    { query: { category: 'Wedding Bangles' } },
    { json: (data) => { weddingResult = data; } }
  );
  assert(weddingResult.length >= 4, `Querying "Wedding Bangles" returns ${weddingResult.length} direct products`);

  // Test 4: Three-Tier Stock Model Verification
  console.log('\n[Test 4] Three-Tier Stock Management Model');

  // Tier 1: Designer Glass Bangles
  const sampleDGB = await Product.findOne({ category: 'Designer Glass Bangles' });
  assert(Boolean(sampleDGB), 'Found Designer Glass Bangles product');
  assert(Boolean(sampleDGB.subcategoryId), 'Designer Glass Bangles product has subcategoryId assigned');

  // Tier 2: Other Bangles (Wedding / Antique / Valaikaappu)
  const sampleWedding = await Product.findOne({ category: 'Wedding Bangles' });
  assert(Boolean(sampleWedding), 'Found Wedding Bangles product');
  assert(!sampleWedding.subcategoryId, 'Wedding Bangles product has no subcategoryId');
  assert(Array.isArray(sampleWedding.sizes) && sampleWedding.sizes.length > 0, 'Wedding Bangles product has sizes array');
  assert(sampleWedding.sizes.every((s) => typeof s.inStock === 'boolean' && typeof s.stockCount === 'number'),
    'Wedding Bangles sizes have independent inStock toggle and stockCount number');

  // Tier 3: Other collections (e.g. Artificial Flowers, Jumkhas)
  const sampleJumkha = await Product.findOne({ category: 'Jumkhas' });
  assert(Boolean(sampleJumkha), 'Found Jumkhas product');
  assert(typeof sampleJumkha.inStock === 'boolean', 'Jumkhas product uses product-level inStock toggle');

  console.log('\n========================================================');
  console.log(`  Tests Completed: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

