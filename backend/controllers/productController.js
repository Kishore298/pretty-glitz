const Product = require('../models/Product');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, subcategoryId, giftBoxDetails, inStock, images, sizes, isFlagship, isOffer, isActive } = req.body;
    
    // Core Bangle logic: sizes are ONLY saved for Bangles.
    const productSizes = (category || '').toLowerCase().includes('bangles') ? sizes : [];

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      category,
      subcategoryId: subcategoryId || undefined,
      giftBoxDetails,
      inStock,
      images,
      sizes: productSizes,
      isFlagship,
      isOffer,
      isActive
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProducts = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.isFlagship === 'true') query.isFlagship = true;
    if (req.query.isOffer === 'true') query.isOffer = true;
    
    const products = await Product.find(query)
      .populate('subcategoryId', 'name')
      .sort({ order: 1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('subcategoryId', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, subcategoryId, giftBoxDetails, inStock, images, sizes, isFlagship, isOffer, isActive } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name = name !== undefined ? name : product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
    product.category = category !== undefined ? category : product.category;
    product.subcategoryId = subcategoryId !== undefined ? subcategoryId : product.subcategoryId;
    product.giftBoxDetails = giftBoxDetails !== undefined ? giftBoxDetails : product.giftBoxDetails;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.images = images !== undefined ? images : product.images;
    product.isFlagship = isFlagship !== undefined ? isFlagship : product.isFlagship;
    product.isOffer = isOffer !== undefined ? isOffer : product.isOffer;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    // Core Bangle update logic
    if ((product.category || '').toLowerCase().includes('bangles')) {
      product.sizes = sizes !== undefined ? sizes : product.sizes;
    } else {
      product.sizes = []; // Strips out sizes if category changed away from Bangles
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProductOrders = async (req, res) => {
  try {
    const { items } = req.body;
    const updates = items.map(item => 
      Product.findByIdAndUpdate(item.id, { order: item.order })
    );
    await Promise.all(updates);
    res.json({ message: 'Product orders updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, updateProductOrders };
