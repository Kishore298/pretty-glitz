/**
 * sizeHelper.js
 * 
 * Provides robust size sorting for jewellery, bangles, and rings.
 * Ensures smaller numeric bangle sizes (e.g., 2.2, 2-2) always precede larger sizes (e.g., 2.4, 2.6, 2.8, 2.10)
 * irrespective of the order they were inserted into the database.
 */

export const BANGLE_DIAMETER_MAP = {
  '2.2': '5.4 cm',
  '2.4': '5.7 cm',
  '2.6': '6.0 cm',
  '2.8': '6.4 cm',
  '2.10': '6.7 cm',
  '2.12': '7.0 cm',
};

/**
 * Formats bangle size into standard display format: "2.2 (5.4 cm)"
 */
export const formatBangleSize = (sizeValue) => {
  if (sizeValue === null || sizeValue === undefined) return '';
  const raw = typeof sizeValue === 'object' ? (sizeValue.size ?? '') : String(sizeValue);
  const str = String(raw).trim();
  if (!str) return '';

  if (str.includes('(') || str.toLowerCase().includes('cm')) {
    return str;
  }

  const normalized = str.replace(/[-\s]/g, '.');
  if (BANGLE_DIAMETER_MAP[normalized]) {
    return `${normalized} (${BANGLE_DIAMETER_MAP[normalized]})`;
  }

  return str;
};

export const parseBangleSize = (sizeValue) => {
  if (sizeValue === null || sizeValue === undefined) return 999999;
  const raw = typeof sizeValue === 'object' ? (sizeValue.size ?? '') : String(sizeValue);
  const str = String(raw).trim();
  
  // Normalize hyphens/spaces to dots, e.g. "2-2", "2 2", "2.2" -> "2.2"
  const cleaned = str.replace(/[-\s]/g, '.');
  const parts = cleaned.split('.');
  if (parts.length >= 2) {
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    if (!isNaN(major) && !isNaN(minor)) {
      // 2.2 -> 2*100 + 2 = 202; 2.4 -> 204; 2.8 -> 208; 2.10 -> 210
      return major * 100 + minor;
    }
  }

  const match = cleaned.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 999999;
};

export const sortSizesAscending = (sizesArray) => {
  if (!Array.isArray(sizesArray)) return [];
  return [...sizesArray].sort((a, b) => {
    const aVal = typeof a === 'object' && a !== null ? (a.size ?? '') : String(a);
    const bVal = typeof b === 'object' && b !== null ? (b.size ?? '') : String(b);

    const aNum = parseBangleSize(aVal);
    const bNum = parseBangleSize(bVal);

    if (aNum !== bNum) {
      return aNum - bNum;
    }

    // Secondary fallback to natural string comparison
    return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
  });
};
