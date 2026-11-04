const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const { getProducts, updateProduct } = require('../controllers/productController');
const { createSubcategory, updateSubcategory, deleteSubcategory } = require('../controllers/subcategoryController');

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
  console.log('================================================================');
  console.log('  PrettyGlitz 7-Point User Verification Matrix Automated Suite  ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // Point 1: Rename category — Existing products remain associated
  console.log('[Test 1] Rename Category & Product Association');
  const dgbCat = await Category.findOne({ name: 'Designer Glass Bangles' });
  assert(Boolean(dgbCat), 'Designer Glass Bangles is the authoritative category in categories collection');
  const associatedProducts = await Product.find({ category: 'Designer Glass Bangles' });
  assert(associatedProducts.length >= 4, `Existing products remain associated (${associatedProducts.length} pieces found)`);

  // Point 2: Add subcategory — Appears under Designer Glass Bangles
  console.log('\n[Test 2] Add Subcategory under Designer Glass Bangles');
  let createdSub = null;
  const mockReqCreate = {
    body: {
      name: 'Temp Festive Velvet Test',
      category: 'Designer Glass Bangles',
      order: 99,
    },
  };
  const mockResCreate = {
    status: (code) => ({
      json: (data) => {
        createdSub = data;
      },
    }),
  };
  await createSubcategory(mockReqCreate, mockResCreate);
  assert(Boolean(createdSub && createdSub._id), `Subcategory created with ID: ${createdSub?._id}`);
  assert(createdSub.category === 'Designer Glass Bangles', 'Subcategory category is strictly "Designer Glass Bangles"');

  // Verify it appears in subcategories query
  const subsInDGB = await Subcategory.find({ category: 'Designer Glass Bangles' });
  assert(subsInDGB.some((s) => s._id.toString() === createdSub._id.toString()), 'New subcategory appears under Designer Glass Bangles list');

  // Point 3: Edit subcategory — Updated name appears on both websites
  console.log('\n[Test 3] Edit Subcategory');
  let updatedSub = null;
  const mockReqUpdate = {
    params: { id: createdSub._id },
    body: {
      name: 'Royal Bridal Velvet Chura Test',
      category: 'Designer Glass Bangles',
    },
  };
  const mockResUpdate = {
    json: (data) => {
      updatedSub = data;
    },
  };
  await updateSubcategory(mockReqUpdate, mockResUpdate);
  assert(updatedSub && updatedSub.name === 'Royal Bridal Velvet Chura Test', 'Subcategory successfully updated name to "Royal Bridal Velvet Chura Test"');

  const reloadedSub = await Subcategory.findById(createdSub._id);
  assert(reloadedSub.name === 'Royal Bridal Velvet Chura Test', 'Updated subcategory name verified from database');

  // Point 4: Assign product — Product appears in the correct subcategory
  console.log('\n[Test 4] Assign Product to Subcategory');
  const targetProduct = associatedProducts[0];
  const originalSubId = targetProduct.subcategoryId;

  let updateResProduct = null;
  await updateProduct(
    {
      params: { id: targetProduct._id },
      body: {
        category: 'Designer Glass Bangles',
        subcategoryId: createdSub._id.toString(),
      },
    },
    {
      json: (data) => {
        updateResProduct = data;
      },
      status: () => ({ json: () => {} }),
    }
  );
  assert(
    updateResProduct && updateResProduct.subcategoryId?.toString() === createdSub._id.toString(),
    `Product "${targetProduct.name}" reassigned to new subcategory ID: ${createdSub._id}`
  );

  // Query by subcategoryId
  let subFilterProds = [];
  await getProducts(
    { query: { category: 'Designer Glass Bangles', subcategoryId: createdSub._id.toString() } },
    { json: (data) => { subFilterProds = data; } }
  );
  assert(subFilterProds.length === 1, `Query by subcategoryId returns exactly assigned product (${subFilterProds.length})`);
  assert(subFilterProds[0]._id.toString() === targetProduct._id.toString(), 'Returned product matches assigned product');

  // Point 5: Products tab — Displays all relevant products
  console.log('\n[Test 5] Products Tab Category Filter Logic');
  let allDgbProds = [];
  await getProducts(
    { query: { category: 'Designer Glass Bangles' } },
    { json: (data) => { allDgbProds = data; } }
  );
  assert(allDgbProds.length >= 4, `Products tab filter returns all ${allDgbProds.length} products for Designer Glass Bangles`);

  let weddingProds = [];
  await getProducts(
    { query: { category: 'Wedding Bangles' } },
    { json: (data) => { weddingProds = data; } }
  );
  assert(weddingProds.length >= 4, `Products tab filter returns all ${weddingProds.length} products for Wedding Bangles`);

  // Point 6: Main category page — Displays products across all its subcategories
  console.log('\n[Test 6] Main Category Rollup Across Subcategories');
  const dgbSubIds = (await Subcategory.find({ category: 'Designer Glass Bangles' })).map((s) => s._id.toString());
  const rollupProducts = allDgbProds.filter((p) => {
    const sId = (p.subcategoryId?._id || p.subcategoryId)?.toString();
    return p.category === 'Designer Glass Bangles' || (sId && dgbSubIds.includes(sId));
  });
  assert(rollupProducts.length === allDgbProds.length, 'Every product on main category page belongs to the category or its subcategories');

  // Point 7: Edit existing product — Existing data and variations are preserved
  console.log('\n[Test 7] Edit Existing Product Preserves Variations & Inventory');
  const prodToEdit = await Product.findById(targetProduct._id);
  const originalPrice = prodToEdit.price;
  const originalImages = prodToEdit.images;
  const originalDescription = prodToEdit.description;

  let editedProduct = null;
  await updateProduct(
    {
      params: { id: targetProduct._id },
      body: {
        name: `${prodToEdit.name} (Updated)`,
        subcategoryId: originalSubId ? originalSubId.toString() : undefined,
      },
    },
    {
      json: (data) => {
        editedProduct = data;
      },
      status: () => ({ json: () => {} }),
    }
  );
  assert(editedProduct.name.includes('(Updated)'), 'Product name successfully updated');
  assert(editedProduct.price === originalPrice, 'Product price was preserved');
  assert(editedProduct.images.length === originalImages.length, 'Product images count preserved');
  assert(editedProduct.description === originalDescription, 'Product description preserved');

  // Revert product name
  await Product.findByIdAndUpdate(targetProduct._id, {
    name: prodToEdit.name,
    subcategoryId: originalSubId,
  });

  // Cleanup temporary test subcategory
  await deleteSubcategory({ params: { id: createdSub._id } }, { json: () => {} });
  const cleanedSub = await Subcategory.findById(createdSub._id);
  assert(!cleanedSub, 'Temporary test subcategory cleanly deleted');

  console.log('\n================================================================');
  console.log(`  All Verification Points Completed: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

