const Category = require('../models/Category');

const seedCategories = async () => {
    // Ensures the 3 fixed categories exist
    const cats = await Category.find();
    if(cats.length === 0) {
        await Category.insertMany([
          {name: 'Bangles'}, 
          {name: 'Artificial Flowers'}, 
          {name: 'Hair Accessories'}
        ]);
    }
}

const getCategories = async (req, res) => {
  try {
    await seedCategories();
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { bannerImage, description } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { bannerImage, description }, { new: true });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategoryOrders = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }
    const updates = items.map(item => 
      Category.findByIdAndUpdate(item.id, { order: item.order })
    );
    await Promise.all(updates);
    res.json({ message: 'Category orders updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, updateCategory, updateCategoryOrders };
