const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Category = require('./models/Category');
const SubCategory = require('./models/Subcategory');
const Product = require('./models/Product');

mongoose.connect('mongodb+srv://kishsabi298_db_user:AAAIQvdp2CIF2Hbj@cluster0.eitgxrr.mongodb.net/pretty-glitz')
.then(async () => {
  console.log('Connected to DB');

  const ensureCategory = async (name) => {
    let cat = await Category.findOne({ name });
    if (!cat) cat = await Category.create({ name });
    return cat._id;
  };

  const ensureSub = async (name, catId) => {
    let sub = await SubCategory.findOne({ name });
    if (!sub) sub = await SubCategory.create({ name, category: catId });
    return sub._id;
  };

  const banglesId = await ensureCategory('Bangles');
  const flowersId = await ensureCategory('Artificial Flowers');
  const giftboxesId = await ensureCategory('Gift Box Combo');
  const jumkhasId = await ensureCategory('Jumkhas');
  const jewelsId = await ensureCategory('Jewels');

  const bangleSubs = ['Glass Bangles', 'Valaikaappu Bangles', 'Antique Bangles', 'Wedding Bangles'];
  const flowerSubs = ['Rose Garlands', 'Jasmine Strings', 'Veni', 'Bridal Gajra'];

  let count = 0;

  for (const sub of bangleSubs) {
    const subId = await ensureSub(sub, banglesId);
    for (let i = 1; i <= 4; i++) {
      await Product.create({
        name: `Premium ${sub} - Style ${i}`,
        description: 'Exquisite handcrafted bangles for all your special occasions.',
        price: 499 + (i * 100),
        originalPrice: 499 + (i * 100) + 200,
        category: 'Bangles',
        subcategoryId: subId,
        inStock: true,
        sizes: [{size: '2.2', order: 1}, {size: '2.4', order: 2}, {size: '2.6', order: 3}, {size: '2.8', order: 4}],
        isOffer: i === 1
      });
      count++;
    }
  }

  for (const sub of flowerSubs) {
    const subId = await ensureSub(sub, flowersId);
    for (let i = 1; i <= 4; i++) {
      await Product.create({
        name: `Elegant ${sub} - Style ${i}`,
        description: 'Beautiful artificial flowers that look just like the real ones.',
        price: 299 + (i * 50),
        originalPrice: 299 + (i * 50) + 100,
        category: 'Artificial Flowers',
        subcategoryId: subId,
        inStock: true,
        isOffer: i === 2
      });
      count++;
    }
  }

  for (let i = 1; i <= 4; i++) {
    await Product.create({
      name: `Luxury Gift Box Combo - ${i}`,
      description: 'The perfect gift box combo curated with love and elegance.',
      giftBoxDetails: '1x Statement Necklace\n1x Pair of Matching Earrings\n1x Beautiful Veni\n1x Handcrafted Bangle Set',
      price: 999 + (i * 200),
      originalPrice: 999 + (i * 200) + 500,
      category: 'Gift Box Combo',
      inStock: true,
      isOffer: i === 3
    });
    count++;
  }

  for (let i = 1; i <= 4; i++) {
    await Product.create({
      name: `Traditional Jumkha - Design ${i}`,
      description: 'Stunning jumkhas to match your ethnic wear perfectly.',
      price: 349 + (i * 150),
      originalPrice: 349 + (i * 150) + 100,
      category: 'Jumkhas',
      inStock: true,
      isOffer: i === 4
    });
    count++;
  }

  for (let i = 1; i <= 4; i++) {
    await Product.create({
      name: `Royal Jewels Set - ${i}`,
      description: 'A masterpiece jewelry set to make you feel like royalty.',
      price: 1499 + (i * 500),
      originalPrice: 1499 + (i * 500) + 500,
      category: 'Jewels',
      inStock: true,
      isOffer: i === 1
    });
    count++;
  }

  console.log(`Successfully added ${count} products.`);
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
