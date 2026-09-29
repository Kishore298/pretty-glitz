const Subcategory = require('../models/Subcategory');

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
    const subcategories = await Subcategory.find();
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSubcategory, getSubcategories, deleteSubcategory };
