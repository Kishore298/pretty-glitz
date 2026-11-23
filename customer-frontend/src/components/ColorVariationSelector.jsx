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
 * - "Show all / Show fewer" toggle integrated directly into the "Choose Colour" header line.
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
    <div className="color-variation-selector" style={{ marginBottom: 10 }}>
      {/* Heading & Current Selection Header Row */}
      <div
        className="color-variation-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ({totalCount} {totalCount === 1 ? 'colour' : 'colours'}
            {hasMoreThanFive && (
              <>
                <span style={{ opacity: 0.5, margin: '0 2px' }}>•</span>
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--accent, #C4386C)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    textDecoration: 'underline',
                  }}
                  title={isExpanded ? 'Collapse to 5 colours' : `Show all ${totalCount} colours`}
                >
                  <span>{isExpanded ? 'Show fewer' : 'Show all'}</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </>
            )}
            )
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
                color: 'var(--accent, #C4386C)',
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
        className="color-variation-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))',
          gap: 8,
        }}
      >
        <AnimatePresence initial={false}>
          {displayedVariants.map((cVar) => {
            const isSelected = Boolean(
              (selectedColor?._id && cVar._id && selectedColor._id.toString() === cVar._id.toString()) ||
              (selectedColor?.colorName && cVar.colorName && selectedColor.colorName.toLowerCase() === cVar.colorName.toLowerCase())
            );

            const thumbImg = cVar.images?.[0]?.url || fallbackImage;
            const isOutOfStock = (
              Array.isArray(cVar.sizes) && cVar.sizes.length > 0
                ? cVar.sizes.every((s) => s.inStock === false)
                : cVar.inStock === false
            );

            return (
              <motion.button
                key={cVar._id || cVar.colorName}
                layout
                className={`color-variation-card ${isSelected ? 'is-selected' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={() => onSelectColor && onSelectColor(cVar)}
                title={`${cVar.colorName}${isOutOfStock ? ' (Sold Out)' : ''}`}
                aria-label={`Select colour ${cVar.colorName}${isOutOfStock ? ' (Sold Out)' : ''}`}
                aria-pressed={isSelected}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  border: isSelected
                    ? '2px solid var(--accent, #C4386C)'
                    : '1px solid var(--border)',
                  background: isSelected
                    ? (isDark ? 'rgba(196,56,108,0.18)' : 'rgba(196,56,108,0.06)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF'),
                  boxShadow: isSelected
                    ? '0 3px 12px rgba(196,56,108,0.25)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                  userSelect: 'none',
                  opacity: isOutOfStock ? 0.5 : 1,
                  minWidth: 0,
                  width: '100%',
                }}
              >
                {/* Thumbnail Image Container */}
                <div
                  className="color-variation-thumb-box"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 7,
                    overflow: 'hidden',
                    background: cVar.colorCode || '#FAF6EE',
                    border: 'none',
                    position: 'relative',
                    flexShrink: 0,
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

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      background: 'var(--accent, #C4386C)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      boxShadow: '0 1px 4px rgba(196,56,108,0.5)',
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
                      top: 3,
                      right: 3,
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: '7px',
                      fontWeight: 800,
                      padding: '1px 3px',
                      borderRadius: 3,
                      lineHeight: 1,
                      zIndex: 2,
                    }}
                  >
                    Out
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Expand / Collapse Control Button (if > 5 colours) */}
      {hasMoreThanFive && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: '4px 0',
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
              size={14}
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
