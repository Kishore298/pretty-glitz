/**
 * Optimizes a Cloudinary image URL for delivery.
 * @param {string} url - The original Cloudinary URL
 * @param {number|object} options - Desired width in pixels OR an options object { width, height, crop, gravity }
 * @returns {string} - The optimized URL
 */
export const optimizeImageUrl = (url, options = 600) => {
  if (!url || !url.includes('cloudinary.com/image/upload/')) {
    return url; // Not a Cloudinary URL or invalid format
  }

  let width, height, crop = 'limit', gravity;

  if (typeof options === 'number') {
    width = options;
  } else {
    width = options.width;
    height = options.height;
    crop = options.crop || 'limit';
    gravity = options.gravity;
  }

  let transformations = 'f_auto,q_auto';
  if (crop) transformations += `,c_${crop}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (gravity) transformations += `,g_${gravity}`;

  // Insert transformations after /upload/
  const uploadIndex = url.indexOf('/upload/') + 8;
  return url.substring(0, uploadIndex) + transformations + '/' + url.substring(uploadIndex);
};