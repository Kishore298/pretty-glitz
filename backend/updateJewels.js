const mongoose = require('mongoose');
const dns = require("node:dns");

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const Category = require('./models/Category');
const Subcategory = require('./models/Subcategory');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const updateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pretty_glitz');
    console.log('Connected to MongoDB');

    // Update Category
    const catRes = await Category.updateOne({ name: 'Hair Accessories' }, { $set: { name: 'Jewels' } });
    console.log('Category update:', catRes);

    // Update Subcategories
    const subRes = await Subcategory.updateMany({ category: 'Hair Accessories' }, { $set: { category: 'Jewels' } });
    console.log('Subcategories update:', subRes);

    // Update Products
    const prodRes = await Product.updateMany({ category: 'Hair Accessories' }, { $set: { category: 'Jewels' } });
    console.log('Products update:', prodRes);

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateData();
