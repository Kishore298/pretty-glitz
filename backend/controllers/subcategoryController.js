const Subcategory = require('../models/Subcategory');

const createSubcategory = async (req, res) => {
  try {
    const { name, category, order } = req.body;
    const sub = await Subcategory.create({ name, category, order });
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSubcategories = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    
    const subs = await Subcategory.find(query).sort({ order: 1 });
    res.json(subs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const { name, order } = req.body;
    const sub = await Subcategory.findByIdAndUpdate(req.params.id, { name, order }, { new: true });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subcategory removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSubcategoryOrders = async (req, res) => {
  try {
    const { items } = req.body;
    const updates = items.map(item => 
      Subcategory.findByIdAndUpdate(item.id, { order: item.order })
    );
    await Promise.all(updates);
    res.json({ message: 'Subcategory orders updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSubcategory, getSubcategories, updateSubcategory, deleteSubcategory, updateSubcategoryOrders };
