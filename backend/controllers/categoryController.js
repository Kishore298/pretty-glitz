const Category = require('../models/Category');
const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');

const seedCategories = async () => {
  const cats = await Category.find();
  if (cats.length === 0) {
    await Category.insertMany([
      { name: 'Designer Glass Bangles', order: 0 },
      { name: 'Wedding Bangles', order: 1 },
      { name: 'Antique Bangles', order: 2 },
      { name: 'Valaikaappu Bangles', order: 3 },
      { name: 'Artificial Flowers', order: 4 },
      { name: 'Gift Box Combo', order: 5 },
      { name: 'Jumkhas', order: 6 },
      { name: 'Jewels', order: 7 },
    ]);
  }
};

const getCategories = async (req, res) => {
  try {
    await seedCategories();
    const categories = await Category.find().sort({ order: 1 }).lean();

    // Add aggregate product & subcategory counts
    for (let cat of categories) {
      const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$/i.test(cat.name);
      const isArtificialFlowers = /^artificial\s+flowers$/i.test(cat.name);

      if (isDesignerGlassBangles) {
        const subcatDocs = await Subcategory.find({
          category: new RegExp('^(designer\\s+)?glass\\s+bangles$', 'i'),
        }).select('_id');
        const subIds = subcatDocs.map((s) => s._id);

        cat.productCount = await Product.countDocuments({
          $or: [
            { category: new RegExp('^(designer\\s+)?glass\\s+bangles$', 'i') },
            ...(subIds.length > 0 ? [{ subcategoryId: { $in: subIds } }] : []),
          ],
        });
        cat.subcategoryCount = subcatDocs.length;
      } else if (isArtificialFlowers) {
        const subcatDocs = await Subcategory.find({
          category: new RegExp('^artificial\\s+flowers$', 'i'),
        }).select('_id');
        cat.productCount = await Product.countDocuments({
          category: new RegExp('^artificial\\s+flowers$', 'i'),
        });
        cat.subcategoryCount = subcatDocs.length;
      } else {
        cat.productCount = await Product.countDocuments({
          category: new RegExp(`^${cat.name}$`, 'i'),
        });
        cat.subcategoryCount = 0; // Top-level categories without subcategories
      }
    }

    res.json(categories);
  } catch (error) {
    console.error('[categoryController] getCategories error:', error);
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
    const { name, bannerImage } = req.body;
    const category = await Category.findByIdAndUpdate(req.params.id, { name, bannerImage }, { returnDocument: 'after' });
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
