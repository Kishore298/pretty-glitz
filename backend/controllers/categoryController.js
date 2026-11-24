const Category = require('../models/Category');
const Product = require('../models/Product');
const Subcategory = require('../models/Subcategory');

let isCategoriesSeeded = false;
let categoryCache = null;
let categoryCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const invalidateCategoryCache = () => {
  categoryCache = null;
  categoryCacheTimestamp = 0;
};

const seedCategories = async () => {
  if (isCategoriesSeeded) return;
  try {
    const count = await Category.estimatedDocumentCount();
    if (count === 0) {
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
    isCategoriesSeeded = true;
  } catch (err) {
    console.error('[categoryController] seedCategories error:', err);
  }
};

const getCategories = async (req, res) => {
  try {
    const now = Date.now();
    if (categoryCache && (now - categoryCacheTimestamp < CACHE_TTL_MS)) {
      return res.json(categoryCache);
    }

    await seedCategories();

    // Fetch categories and subcategories in parallel
    const [categories, allSubcats] = await Promise.all([
      Category.find().sort({ order: 1 }).lean(),
      Subcategory.find().lean()
    ]);

    const dgbSubIds = allSubcats
      .filter((s) => /^(designer\s+)?glass\s+bangles$/i.test(s.category))
      .map((s) => s._id);

    const afSubcats = allSubcats
      .filter((s) => /^artificial\s+flowers$/i.test(s.category));

    // Parallelize product count calculations across categories
    await Promise.all(
      categories.map(async (cat) => {
        const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$/i.test(cat.name);
        const isArtificialFlowers = /^artificial\s+flowers$/i.test(cat.name);

        if (isDesignerGlassBangles) {
          cat.subcategoryCount = dgbSubIds.length;
          cat.productCount = await Product.countDocuments({
            $or: [
              { category: new RegExp('^(designer\\s+)?glass\\s+bangles$', 'i') },
              ...(dgbSubIds.length > 0 ? [{ subcategoryId: { $in: dgbSubIds } }] : []),
            ],
          });
        } else if (isArtificialFlowers) {
          cat.subcategoryCount = afSubcats.length;
          cat.productCount = await Product.countDocuments({
            category: new RegExp('^artificial\\s+flowers$', 'i'),
          });
        } else {
          cat.subcategoryCount = 0; // Top-level categories without subcategories
          cat.productCount = await Product.countDocuments({
            category: new RegExp(`^${cat.name}$`, 'i'),
          });
        }
      })
    );

    categoryCache = categories;
    categoryCacheTimestamp = Date.now();

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
    invalidateCategoryCache();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, bannerImage } = req.body;
    const existing = await Category.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const oldName = existing.name;

    existing.name = name || existing.name;
    if (bannerImage !== undefined) existing.bannerImage = bannerImage;
    const updatedCategory = await existing.save();

    // If the category name was updated, cascade to all associated products and subcategories
    if (name && name.trim() && name.trim().toLowerCase() !== oldName.trim().toLowerCase()) {
      const trimmedOld = oldName.trim();
      const trimmedNew = name.trim();
      const escapedOld = trimmedOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const oldRegex = new RegExp(`^${escapedOld}$`, 'i');

      await Product.updateMany(
        { category: { $regex: oldRegex } },
        { $set: { category: trimmedNew } }
      );

      await Subcategory.updateMany(
        { category: { $regex: oldRegex } },
        { $set: { category: trimmedNew } }
      );
    }

    invalidateCategoryCache();
    res.json(updatedCategory);
  } catch (error) {
    console.error('[categoryController] updateCategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    invalidateCategoryCache();
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
    invalidateCategoryCache();
    res.json({ message: 'Category orders updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrders };
