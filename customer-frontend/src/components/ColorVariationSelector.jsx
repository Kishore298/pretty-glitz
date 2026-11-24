import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import { useTheme } from '../context/ThemeContext';
import { isColorCompletelyOutOfStock } from '../utils/stockValidator';

/**
 * ColorVariationSelector
 *
 * Fully dynamic, responsive colour selector for Designer Bangles and other variable products.
 * - Dynamically calculates the exact number of thumbnails that fit per row for the available device/container width.
 * - Collapsed state: Row 1 fills 100% of the available horizontal space with zero empty gap on the right.
 * - Expanded state: All colourways flow seamlessly into the exact same responsive grid structure.
 * - "Show all / Show fewer" toggle available both in the header line and below the grid.
 * - Auto-expands if a user selects or views a colour located beyond the first row.
 */
const ColorVariationSelector = ({
  colorVariants = [],
  selectedColor = null,
  onSelectColor,
  fallbackImage = null,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);
  const selectedCardRef = useRef(null);

  // Initial estimate of columns based on window width
  const [columnsPerRow, setColumnsPerRow] = useState(() => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w < 360) return 5;
      if (w < 420) return 6;
      if (w < 520) return 6;
      if (w < 768) return 7;
      if (w < 1024) return 8;
      return 8;
    }
    return 5;
  });

  // Dynamically measure container width and calculate how many thumbnail cards fit in a single row
  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    if (!width || width <= 0) return;

    // Mobile: ~70px min card width with 8px gap; Larger: ~76px min card width with 10px gap
    const isMobile = width < 520;
    const gap = isMobile ? 8 : 10;
    const minCardWidth = width < 360 ? 64 : (isMobile ? 70 : 76);

    const cols = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)));
    setColumnsPerRow(cols);
  }, []);

  useEffect(() => {
    updateColumns();
    if (!containerRef.current) return;

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateColumns();
      });
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', updateColumns);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateColumns);
    };
  }, [updateColumns, colorVariants]);

  // Filter out any colorway that is completely out of stock across all of its sizes
  const availableColorVariants = useMemo(() => {
    return (colorVariants || []).filter((cVar) => !isColorCompletelyOutOfStock(cVar));
  }, [colorVariants]);

  const totalCount = availableColorVariants.length;
  // Has more than one visible row on current screen width
  const hasMore = totalCount > columnsPerRow;

  // When in collapsed horizontal scroll mode, scroll selected card into view
  useEffect(() => {
    if (!isExpanded && selectedCardRef.current) {
      try {
        selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch {}
    }
  }, [selectedColor, isExpanded]);

  if (!Array.isArray(availableColorVariants) || availableColorVariants.length === 0) {
    return null;
  }

  const gridGap = (containerRef.current?.clientWidth || 400) < 520 ? 6 : 8;

  return (
    <div className="color-variation-selector" style={{ marginBottom: 6 }}>
      {/* Heading & Current Selection Header Row */}
      <div
        className="color-variation-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            Choose Colour
          </span>
          <span
            style={{
              fontSize: '0.80rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            (
            {hasMore ? (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--accent, #C4386C)',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  textDecoration: 'underline',
                }}
                title={isExpanded ? 'Collapse to single row' : `Show all ${totalCount} colours`}
              >
                <span>{isExpanded ? 'Show fewer' : `Show all (${totalCount})`}</span>
                <ChevronDown
                  size={13}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            ) : (
              <span>{totalCount} {totalCount === 1 ? 'colour' : 'colours'}</span>
            )}
            )
          </span>
        </div>

        {selectedColor && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 8px 2px 4px',
              borderRadius: 999,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Mini Color Swatch */}
            <div
              style={{
                width: 16,
                height: 16,
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
                fontSize: '0.76rem',
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

      {/* Colour Variant Thumbnail Cards: Horizontal Scroll by default, Multi-row Grid when expanded */}
      <motion.div
        ref={containerRef}
        layout
        className="color-variation-container"
        style={
          isExpanded
            ? {
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(70px, 1fr))`,
                gap: gridGap,
                width: '100%',
              }
            : {
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                gap: gridGap,
                width: '100%',
                paddingBottom: 4,
                paddingTop: 1,
                paddingLeft: 1,
                paddingRight: 1,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }
        }
      >
        <AnimatePresence initial={false}>
          {availableColorVariants.map((cVar) => {
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
                ref={isSelected ? selectedCardRef : null}
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '5px 4px 6px',
                  borderRadius: 12,
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
                  minWidth: isExpanded ? 0 : 70,
                  width: isExpanded ? '100%' : 70,
                  flex: isExpanded ? 'unset' : '0 0 auto',
                  maxWidth: 80,
                  boxSizing: 'border-box',
                }}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      background: 'var(--accent, #C4386C)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(196,56,108,0.4)',
                    }}
                  >
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
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

                {/* Thumbnail Image Container */}
                <div
                  className="color-variation-thumb-box"
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: cVar.colorCode || '#FAF6EE',
                    border: 'none',
                    position: 'relative',
                    flexShrink: 0,
                    marginBottom: 5,
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
                  className="color-variation-label"
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent, #C4386C)' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    padding: '0 1px',
                    textAlign: 'center',
                    lineHeight: 1.15,
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
    </div>
  );
};

export default ColorVariationSelector;
