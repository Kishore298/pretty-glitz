import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import { useTheme } from '../context/ThemeContext';

/**
 * ColorVariationSelector
 *
 * Polished, responsive colour selector for Designer Bangles and other variable products.
 * Supports:
 * - Collapsed state: displays heading, current selection, first 5 thumbnails, and an expand toggle.
 * - Expanded state: smoothly reveals all available colour variations in a responsive grid.
 * - Selection indicator: accent border, subtle glow, and checkmark badge.
 * - Live stock status: visual indicator for sold-out colour variants.
 */
const ColorVariationSelector = ({
  colorVariants = [],
  selectedColor = null,
  onSelectColor,
  fallbackImage = null,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!Array.isArray(colorVariants) || colorVariants.length === 0) {
    return null;
  }

  const totalCount = colorVariants.length;
  const hasMoreThanFive = totalCount > 5;
  const displayedVariants = (!isExpanded && hasMoreThanFive)
    ? colorVariants.slice(0, 5)
    : colorVariants;

  return (
    <div className="color-variation-selector" style={{ marginBottom: 20 }}>
      {/* Heading & Current Selection Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            Choose Colour
          </span>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            ({totalCount} {totalCount === 1 ? 'option' : 'options'})
          </span>
        </div>

        {selectedColor && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '3px 10px 3px 6px',
              borderRadius: 999,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Mini Color Swatch / Thumbnail */}
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                overflow: 'hidden',
                background: selectedColor.colorCode || '#C4386C',
                border: '1px solid rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {(selectedColor.images?.[0]?.url || fallbackImage) && (
                <img
                  src={optimizeImageUrl(selectedColor.images?.[0]?.url || fallbackImage, 60)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text)',
                textTransform: 'capitalize',
              }}
            >
              {selectedColor.colorName}
            </span>
          </div>
        )}
      </div>

      {/* Colour Variant Thumbnail Cards Grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
          gap: 10,
        }}
      >
        <AnimatePresence initial={false}>
          {displayedVariants.map((cVar) => {
            const isSelected = Boolean(
              (selectedColor?._id && cVar._id && selectedColor._id.toString() === cVar._id.toString()) ||
              (selectedColor?.colorName && cVar.colorName && selectedColor.colorName.toLowerCase() === cVar.colorName.toLowerCase())
            );

            const thumbImg = cVar.images?.[0]?.url || fallbackImage;
            // Variant is in stock if any of its sizes has inStock !== false, or if no sizes and cVar.inStock !== false.
            // Stock counts are optional; unentered counts (0) with inStock=true remain in-stock.
            const isOutOfStock = (
              Array.isArray(cVar.sizes) && cVar.sizes.length > 0
                ? cVar.sizes.every((s) => s.inStock === false)
                : cVar.inStock === false
            );

            return (
              <motion.button
                key={cVar._id || cVar.colorName}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={() => onSelectColor && onSelectColor(cVar)}
                aria-label={`Select colour ${cVar.colorName}${isOutOfStock ? ' (Sold Out)' : ''}`}
                aria-pressed={isSelected}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 6px 8px',
                  borderRadius: 12,
                  border: isSelected
                    ? '2px solid var(--accent, #C4386C)'
                    : '1px solid var(--border)',
                  background: isSelected
                    ? (isDark ? 'rgba(196,56,108,0.16)' : 'rgba(196,56,108,0.05)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'),
                  boxShadow: isSelected
                    ? '0 3px 12px rgba(196,56,108,0.22)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
                  userSelect: 'none',
                  opacity: isOutOfStock ? 0.6 : 1,
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'var(--accent, #C4386C)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(196,56,108,0.4)',
                    }}
                  >
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </span>
                )}

                {/* Sold Out Badge */}
                {isOutOfStock && !isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: '8px',
                      fontWeight: 800,
                      padding: '1px 4px',
                      borderRadius: 4,
                      lineHeight: 1.1,
                      zIndex: 2,
                    }}
                  >
                    Out
                  </span>
                )}

                {/* Thumbnail Image Container - Clean single container without inner border */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: cVar.colorCode || '#FAF6EE',
                    border: 'none',
                    position: 'relative',
                    flexShrink: 0,
                    marginBottom: 6,
                  }}
                >
                  {thumbImg ? (
                    <img
                      src={optimizeImageUrl(thumbImg, 120)}
                      alt={cVar.colorName}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: cVar.colorCode || 'var(--accent, #C4386C)',
                      }}
                    />
                  )}
                </div>

                {/* Colour Name Label */}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent, #C4386C)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    padding: '0 2px',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                  title={cVar.colorName}
                >
                  {cVar.colorName}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Expand / Collapse Control Button (if > 5 colours) */}
      {hasMoreThanFive && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              color: 'var(--accent, #C4386C)',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span>
              {isExpanded ? 'Show fewer colours' : `Show all ${totalCount} colours`}
            </span>
            <ChevronDown
              size={15}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorVariationSelector;

