/**
 * urlHelper.js
 * 
 * Provides clean, search-engine-friendly and user-friendly URL utilities
 * that avoid displaying raw MongoDB ObjectIds in browser URLs.
 */

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (except space & hyphen)
    .replace(/[\s_-]+/g, '-')   // Replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
};

export const getProductUrl = (product) => {
  if (!product) return '/';
  if (product.slug && typeof product.slug === 'string' && product.slug.trim()) {
    return `/product/${product.slug.trim()}`;
  }
  const name = product.name || product.title;
  if (name && typeof name === 'string') {
    const slug = slugify(name);
    if (slug) return `/product/${slug}`;
  }
  // Fallback to _id if name is not available
  return product._id ? `/product/${product._id}` : '/';
};