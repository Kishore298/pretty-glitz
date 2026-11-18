/**
 * stockValidator.js
 * 
 * Provides unified, authoritative client-side stock validation for PrettyGlitz.
 * Supports:
 * - Scenario A: Tracked stock (numeric stock count exists) -> clamp to available stock, block at 0.
 * - Scenario B: Untracked stock (boolean inStock flag only) -> allow any quantity if inStock is true.
 * - Multi-tiered hierarchy: Color Variant -> Size Variant -> Top-Level Sizes -> Simple Product.
 */

export const resolveStock = (product, size = null, colorVariant = null) => {
  if (!product) {
    return {
      isAvailable: false,
      isStockTracked: false,
      availableStock: 0,
      reason: 'Product no longer available',
    };
  }

  // Master product level availability
  if (product.isActive === false || product.inStock === false) {
    return {
      isAvailable: false,
      isStockTracked: false,
      availableStock: 0,
      reason: 'Currently out of stock',
    };
  }

  // 1. Color Variant hierarchy
  if (product.colorVariants && product.colorVariants.length > 0) {
    const colorId = typeof colorVariant === 'object' ? colorVariant?._id : colorVariant;
    const colorObj = colorId
      ? product.colorVariants.find(
          (c) => c._id?.toString() === colorId.toString() || c.colorName === colorId
        )
      : product.colorVariants.find((c) => c.isDefault) || product.colorVariants[0];

    if (!colorObj) {
      return {
        isAvailable: false,
        isStockTracked: false,
        availableStock: 0,
        reason: 'Selected colour is unavailable',
      };
    }

    if (colorObj.inStock === false) {
      return {
        isAvailable: false,
        isStockTracked: false,
        availableStock: 0,
        reason: `Colour "${colorObj.colorName}" is out of stock`,
      };
    }

    // Size within color variant
    if (colorObj.sizes && colorObj.sizes.length > 0) {
      const sizeVal = typeof size === 'object' ? size?.size : size;
      const sizeId = typeof size === 'object' ? size?._id : null;
      const sizeObj = sizeVal
        ? colorObj.sizes.find(
            (s) => s.size === sizeVal || (sizeId && s._id?.toString() === sizeId.toString())
          )
        : colorObj.sizes[0];

      if (!sizeObj) {
        return {
          isAvailable: false,
          isStockTracked: false,
          availableStock: 0,
          reason: 'Selected size is unavailable',
        };
      }

      if (sizeObj.inStock === false) {
        return {
          isAvailable: false,
          isStockTracked: false,
          availableStock: 0,
          reason: `Size ${sizeObj.size} is out of stock`,
        };
      }

      // Scenario A for variant size
      if (typeof sizeObj.stockCount === 'number') {
        const available = Math.max(0, sizeObj.stockCount);
        return {
          isAvailable: available > 0,
          isStockTracked: true,
          availableStock: available,
          reason: available > 0 ? '' : `Size ${sizeObj.size} is sold out`,
        };
      }

      // Scenario B for variant size
      return {
        isAvailable: true,
        isStockTracked: false,
        availableStock: Infinity,
        reason: '',
      };
    }

    // Color variant with no sizes
    return {
      isAvailable: true,
      isStockTracked: false,
      availableStock: Infinity,
      reason: '',
    };
  }

  // 2. Top-level Bangles Sizes (Wedding Bangles, Antique Bangles, Valaikaappu Bangles)
  if (product.sizes && product.sizes.length > 0) {
    const sizeVal = typeof size === 'object' ? size?.size : size;
    const sizeId = typeof size === 'object' ? size?._id : null;
    const sizeObj = sizeVal
      ? product.sizes.find(
          (s) => s.size === sizeVal || (sizeId && s._id?.toString() === sizeId.toString())
        )
      : product.sizes[0];

    if (!sizeObj) {
      return {
        isAvailable: false,
        isStockTracked: false,
        availableStock: 0,
        reason: 'Selected size is unavailable',
      };
    }

    if (sizeObj.inStock === false) {
      return {
        isAvailable: false,
        isStockTracked: false,
        availableStock: 0,
        reason: `Size ${sizeObj.size} is out of stock`,
      };
    }

    // Scenario A for top-level size
    if (typeof sizeObj.stockCount === 'number') {
      const available = Math.max(0, sizeObj.stockCount);
      return {
        isAvailable: available > 0,
        isStockTracked: true,
        availableStock: available,
        reason: available > 0 ? '' : `Size ${sizeObj.size} is sold out`,
      };
    }

    // Scenario B for top-level size
    return {
      isAvailable: true,
      isStockTracked: false,
      availableStock: Infinity,
      reason: '',
    };
  }

  // 3. Simple Product
  if (typeof product.inStockCount === 'number') {
    // Scenario A: Tracked numeric count
    const available = Math.max(0, product.inStockCount);
    return {
      isAvailable: available > 0,
      isStockTracked: true,
      availableStock: available,
      reason: available > 0 ? '' : 'Product is sold out',
    };
  }

  // Scenario B: Untracked count
  return {
    isAvailable: true,
    isStockTracked: false,
    availableStock: Infinity,
    reason: '',
  };
};
