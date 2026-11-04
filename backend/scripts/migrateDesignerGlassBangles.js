const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');

async function migrate() {
  console.log('--- Starting PrettyGlitz Category & Taxonomy Migration ---');
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Ensure Main Categories exist
  const mainCategories = [
    { name: 'Designer Glass Bangles', order: 0 },
    { name: 'Wedding Bangles', order: 1 },
    { name: 'Antique Bangles', order: 2 },
    { name: 'Valaikaappu Bangles', order: 3 },
    { name: 'Artificial Flowers', order: 4 },
    { name: 'Gift Box Combo', order: 5 },
    { name: 'Jumkhas', order: 6 },
    { name: 'Jewels', order: 7 },
  ];

  for (const cat of mainCategories) {
    const existing = await Category.findOne({ name: new RegExp(`^${cat.name}$`, 'i') });
    if (!existing) {
      await Category.create(cat);
      console.log(`Created category: "${cat.name}"`);
    } else if (existing.name !== cat.name) {
      existing.name = cat.name;
      await existing.save();
      console.log(`Renamed category to standard casing: "${cat.name}"`);
    }
  }

  // Remove any legacy category named exactly "Glass Bangles" or "glass bangles" if separate from Designer Glass Bangles
  const legacyGlassCats = await Category.find({ name: /^glass\s+bangles$/i });
  for (const lc of legacyGlassCats) {
    console.log(`Removing duplicate legacy category document: "${lc.name}" (${lc._id})`);
    await Category.findByIdAndDelete(lc._id);
  }

  // 2. Ensure Subcategories under Designer Glass Bangles
  const designerGlassBanglesSubs = [
    { name: 'Daily Wear Bangles', order: 0, category: 'Designer Glass Bangles' },
    { name: 'Velvet Finish Bangles', order: 1, category: 'Designer Glass Bangles' },
    { name: 'Matte Gold Sets', order: 2, category: 'Designer Glass Bangles' },
    { name: 'Bridal Chura Sets', order: 3, category: 'Designer Glass Bangles' },
  ];

  const createdSubs = {};
  for (const sub of designerGlassBanglesSubs) {
    let doc = await Subcategory.findOne({
      name: new RegExp(`^${sub.name}$`, 'i'),
      category: new RegExp('^Designer Glass Bangles$', 'i'),
    });
    if (!doc) {
      doc = await Subcategory.create(sub);
      console.log(`Created subcategory "${sub.name}" under Designer Glass Bangles`);
    }
    createdSubs[sub.name] = doc._id;
  }

  // Normalize flower subcategories
  const flowerSubs = await Subcategory.find({
    name: { $in: [/rose/i, /jasmine/i, /veni/i, /gajra/i] }
  });
  for (const fs of flowerSubs) {
    if (fs.category !== 'Artificial Flowers') {
      fs.category = 'Artificial Flowers';
      await fs.save();
      console.log(`Normalized flower subcategory "${fs.name}" to category "Artificial Flowers"`);
    }
  }

  // 3. Migrate Products
  // 3a. Migrate legacy "Glass Bangles" products to "Designer Glass Bangles"
  const glassProducts = await Product.find({
    category: new RegExp('^glass\\s+bangles$', 'i')
  });

  console.log(`Found ${glassProducts.length} legacy Glass Bangles products to migrate.`);
  for (const p of glassProducts) {
    p.category = 'Designer Glass Bangles';
    // Assign to Daily Wear Bangles subcategory if missing or invalid
    if (!p.subcategoryId || !Object.values(createdSubs).some(id => id.equals(p.subcategoryId))) {
      p.subcategoryId = createdSubs['Daily Wear Bangles'];
    }
    await p.save();
    console.log(`Migrated product "${p.name}" -> Designer Glass Bangles (${p.subcategoryId})`);
  }

  // 3b. Update other bangles: Wedding Bangles, Antique Bangles, Valaikaappu Bangles
  // Ensure size-wise stock (inStock: true, stockCount: 15) and remove subcategoryId
  const otherBangleCats = ['Wedding Bangles', 'Antique Bangles', 'Valaikaappu Bangles'];
  for (const catName of otherBangleCats) {
    const prods = await Product.find({ category: new RegExp(`^${catName}$`, 'i') });
    console.log(`Verifying ${prods.length} products in "${catName}"...`);
    for (const p of prods) {
      let modified = false;
      p.category = catName;
      if (p.subcategoryId) {
        p.subcategoryId = undefined;
        modified = true;
      }
      if (Array.isArray(p.sizes) && p.sizes.length > 0) {
        p.sizes = p.sizes.map((s, idx) => ({
          size: typeof s === 'string' ? s : (s.size || '2.4'),
          order: s.order !== undefined ? s.order : idx,
          inStock: s.inStock !== undefined ? Boolean(s.inStock) : true,
          stockCount: (s.stockCount !== undefined && s.stockCount > 0) ? s.stockCount : 15,
        }));
        modified = true;
      } else {
        p.sizes = [
          { size: '2.4', order: 0, inStock: true, stockCount: 15 },
          { size: '2.6', order: 1, inStock: true, stockCount: 15 },
          { size: '2.8', order: 2, inStock: true, stockCount: 15 },
        ];
        modified = true;
      }
      if (modified) {
        await p.save();
        console.log(`Updated size-wise stock for "${p.name}" in ${catName}`);
      }
    }
  }

  console.log('--- Migration completed successfully! ---');
  await mongoose.disconnect();
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrate;

