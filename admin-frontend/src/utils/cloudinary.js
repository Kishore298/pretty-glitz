/**
 * Optimizes a Cloudinary image URL for delivery.
 * @param {string} url - The original Cloudinary URL
 * @param {number} width - The desired width in pixels
 * @returns {string} - The optimized URL
 */
export const optimizeImageUrl = (url, width = 600) => {
  if (!url || !url.includes('cloudinary.com/image/upload/')) {
    return url; // Not a Cloudinary URL or invalid format
  }

  // Insert transformations after /upload/
  const uploadIndex = url.indexOf('/upload/') + 8;
  const transformations = `f_auto,q_auto,c_limit,w_${width}/`;

  return url.substring(0, uploadIndex) + transformations + url.substring(uploadIndex);
};