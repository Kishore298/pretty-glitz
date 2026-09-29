const Category = require('../models/Category');

const seedCategories = async () => {
    const cats = await Category.find();
    if(cats.length === 0) {
        await Category.insertMany([
          {name: 'glass bangles'}, 
          {name: 'Valaikaappu bangles'}, 
          {name: 'Antique bangles'},
          {name: 'wedding bangles'},
          {name: 'Gift box combo'},
          {name: 'artifical flowers'},
          {name: 'jumkhas'},
          {name: 'jewels'}
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

const createCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    const saved = await newCategory.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, bannerImage, description } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name, bannerImage, description }, { new: true });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategoryOrders = async (req, res) => {
  try {
    const { items } = req.body;
    const updates = items.map(item => 
      Category.findByIdAndUpdate(item.id, { order: item.order })
    );
    await Promise.all(updates);
    res.json({ message: 'Category orders updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrders };
