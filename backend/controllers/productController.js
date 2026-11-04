const Product = require('../models/Product');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

const sanitizeSizes = (sizes) => {
  if (!Array.isArray(sizes)) return [];
  return sizes.map((s, idx) => ({
    size: typeof s === 'string' ? s.trim() : ((s && s.size) || '').trim(),
    order: (s && s.order !== undefined) ? s.order : idx,
    inStock: (s && s.inStock !== undefined) ? Boolean(s.inStock) : true,
    stockCount: Math.max(0, parseInt(s && s.stockCount, 10) || 0),
  })).filter(s => s.size);
};

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

    const trimmedCat = (category || '').trim();
    const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$/i.test(trimmedCat);
    const isOtherBangles = !isDesignerGlassBangles && trimmedCat.toLowerCase().includes('bangle');

    let productSizes = [];
    let productVariants = [];
    let finalSubcategoryId = undefined;

    if (isDesignerGlassBangles) {
      productVariants = sanitizeColorVariants(colorVariants);
      productSizes = [];
      finalSubcategoryId = subcategoryId || undefined;
    } else if (isOtherBangles) {
      productVariants = [];
      productSizes = sanitizeSizes(sizes);
      finalSubcategoryId = undefined;
    } else {
      productVariants = [];
      productSizes = [];
      if (trimmedCat.toLowerCase() === 'artificial flowers') {
        finalSubcategoryId = subcategoryId || undefined;
      }
    }

    const productPieceCounts = (isDesignerGlassBangles || isOtherBangles) ? (pieceCounts || []) : [];

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      category: isDesignerGlassBangles ? 'Designer Glass Bangles' : trimmedCat,
      subcategoryId: finalSubcategoryId,
      giftBoxDetails,
      inStock: inStock !== undefined ? inStock : true,
      images: Array.isArray(images) ? images : [],
      colorVariants: productVariants,
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

    if (req.query.subcategoryId) {
      query.subcategoryId = req.query.subcategoryId;
    }

    if (req.query.category) {
      const catName = req.query.category.trim();
      const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$|^bangles$/i.test(catName);

      if (isDesignerGlassBangles) {
        // Rollup query: fetch subcategories under Designer Glass Bangles
        const subcategoryDocs = await Subcategory.find({
          category: new RegExp('^(designer\\s+)?glass\\s+bangles$|^bangles$', 'i'),
        }).select('_id');
        const subIds = subcategoryDocs.map((s) => s._id);

        const categoryConditions = [
          { category: new RegExp('^(designer\\s+)?glass\\s+bangles$|^bangles$', 'i') },
        ];
        if (subIds.length > 0) {
          categoryConditions.push({ subcategoryId: { $in: subIds } });
        }

        if (query.subcategoryId) {
          query.$and = [{ $or: categoryConditions }, { subcategoryId: query.subcategoryId }];
          delete query.subcategoryId;
        } else {
          query.$or = categoryConditions;
        }
      } else {
        query.category = new RegExp(`^${catName}$`, 'i');
      }
    }

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

    const newCategory = category !== undefined ? category.trim() : product.category;
    const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$/i.test(newCategory);
    const isOtherBangles = !isDesignerGlassBangles && newCategory.toLowerCase().includes('bangle');

    product.category = isDesignerGlassBangles ? 'Designer Glass Bangles' : newCategory;
    product.giftBoxDetails = giftBoxDetails !== undefined ? giftBoxDetails : product.giftBoxDetails;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.images = images !== undefined ? images : product.images;
    product.isBestseller = isBestseller !== undefined ? isBestseller : product.isBestseller;
    product.isOffer = isOffer !== undefined ? isOffer : product.isOffer;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    // Three-Tier Category & Inventory Logic
    if (isDesignerGlassBangles) {
      if (colorVariants !== undefined) {
        product.colorVariants = sanitizeColorVariants(colorVariants);
      }
      product.sizes = [];
      if (subcategoryId !== undefined) {
        product.subcategoryId = subcategoryId ? subcategoryId : undefined;
      }
      product.pieceCounts = pieceCounts !== undefined ? pieceCounts : product.pieceCounts;
    } else if (isOtherBangles) {
      product.colorVariants = [];
      if (sizes !== undefined) {
        product.sizes = sanitizeSizes(sizes);
      }
      product.subcategoryId = undefined; // strictly no subcategories for other bangles
      product.pieceCounts = pieceCounts !== undefined ? pieceCounts : product.pieceCounts;
    } else {
      product.colorVariants = [];
      product.sizes = [];
      product.pieceCounts = [];
      if (newCategory.toLowerCase() === 'artificial flowers') {
        if (subcategoryId !== undefined) {
          product.subcategoryId = subcategoryId ? subcategoryId : undefined;
        }
      } else {
        product.subcategoryId = undefined;
      }
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
  updateProductOrders: reorderProducts,
};
