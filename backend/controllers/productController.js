const Product = require('../models/Product');

const sanitizeColorVariants = (variants) => {
  if (!Array.isArray(variants)) return [];
  return variants.map((v) => ({
    colorName: (v.colorName || '').trim(),
    colorCode: (v.colorCode || '').trim(),
    images: Array.isArray(v.images) ? v.images : [],
    inStock: Boolean(v.inStock),
    isDefault: Boolean(v.isDefault),
    sizes: Array.isArray(v.sizes)
      ? v.sizes.map((s) => ({
          size: (s.size || '').trim(),
          inStock: Boolean(s.inStock),
          stockCount: Math.max(0, parseInt(s.stockCount, 10) || 0),
          price: s.price !== undefined && s.price !== '' ? Number(s.price) : undefined,
          originalPrice: s.originalPrice !== undefined && s.originalPrice !== '' ? Number(s.originalPrice) : undefined,
        }))
      : [],
  }));
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategoryId,
      giftBoxDetails,
      inStock,
      images,
      sizes,
      pieceCounts,
      colorVariants,
      isBestseller,
      isOffer,
      isActive,
    } = req.body;

    // Core Bangle logic: sizes are ONLY saved for Bangles
    const productSizes = (category || '').toLowerCase().includes('bangles') ? (sizes || []) : [];
    const productPieceCounts = (category || '').toLowerCase().includes('bangles') ? (pieceCounts || []) : [];
    const sanitizedVariants = sanitizeColorVariants(colorVariants);

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      category,
      subcategoryId: subcategoryId || undefined,
      giftBoxDetails,
      inStock: inStock !== undefined ? inStock : true,
      images: Array.isArray(images) ? images : [],
      colorVariants: sanitizedVariants,
      sizes: productSizes,
      pieceCounts: productPieceCounts,
      isBestseller: isBestseller || false,
      isOffer: isOffer || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('[productController] createProduct error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProducts = async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.subcategoryId) query.subcategoryId = req.query.subcategoryId;
    if (req.query.isBestseller === 'true') query.isBestseller = true;
    if (req.query.isOffer === 'true') query.isOffer = true;

    const products = await Product.find(query)
      .populate('subcategoryId', 'name')
      .sort({ order: 1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('[productController] getProducts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('subcategoryId', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('[productController] getProductById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subcategoryId,
      giftBoxDetails,
      inStock,
      images,
      sizes,
      pieceCounts,
      colorVariants,
      isBestseller,
      isOffer,
      isActive,
    } = req.body;

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
    product.isBestseller = isBestseller !== undefined ? isBestseller : product.isBestseller;
    product.isOffer = isOffer !== undefined ? isOffer : product.isOffer;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    if (colorVariants !== undefined) {
      product.colorVariants = sanitizeColorVariants(colorVariants);
    }

    // Core Bangle update logic (preserve existing non-variant products)
    if ((product.category || '').toLowerCase().includes('bangles')) {
      product.sizes = sizes !== undefined ? sizes : product.sizes;
      product.pieceCounts = pieceCounts !== undefined ? pieceCounts : product.pieceCounts;
    } else {
      product.sizes = [];
      product.pieceCounts = [];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('[productController] updateProduct error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('[productController] deleteProduct error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const reorderProducts = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid payload: items must be an array' });
    }
    const updatePromises = items.map((item, index) =>
      Product.findByIdAndUpdate(item.id, { order: index }, { new: true })
    );
    await Promise.all(updatePromises);
    res.json({ message: 'Products reordered successfully' });
  } catch (error) {
    console.error('[productController] reorderProducts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  reorderProducts,
};
