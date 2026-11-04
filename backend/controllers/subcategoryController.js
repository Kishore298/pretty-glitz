const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');

const createSubcategory = async (req, res) => {
  try {
    const subcategory = new Subcategory(req.body);
    await subcategory.save();
    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubcategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      const catTrim = req.query.category.trim();
      if (/^(designer\s+)?glass\s+bangles$|^bangles$/i.test(catTrim)) {
        filter.category = new RegExp('^(designer\\s+)?glass\\s+bangles$|^bangles$', 'i');
      } else {
        filter.category = new RegExp(`^${catTrim}$`, 'i');
      }
    }
    const subcategories = await Subcategory.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    // Unset subcategoryId on assigned products to maintain referential integrity
    await Product.updateMany({ subcategoryId: req.params.id }, { $unset: { subcategoryId: 1 } });
    res.json({ message: 'Subcategory deleted and products unlinked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const updated = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reorderSubcategories = async (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      await Subcategory.findByIdAndUpdate(item.id, { order: item.order });
    }
    res.json({ message: 'Subcategories reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSubcategory, getSubcategories, deleteSubcategory, updateSubcategory, reorderSubcategories };
