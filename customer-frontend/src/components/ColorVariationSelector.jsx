import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import { useTheme } from '../context/ThemeContext';
import { isColorCompletelyOutOfStock } from '../utils/stockValidator';

/**
 * ColorVariationSelector
 *
 * Smooth, responsive colour selector without FLIP layout jumping:
 * - Collapsed: Single horizontal-scroll strip matching the expanded card size.
 * - Expanded: Responsive CSS Grid animated smoothly via height measurement (useLayoutEffect)
 *   and gentle staggered fade-in so cards and surrounding sections glide instead of jumping.
 */
const ColorVariationSelector = ({
  colorVariants = [],
  selectedColor = null,
  onSelectColor,
  fallbackImage = null,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const outerWrapperRef = useRef(null);
  const containerRef = useRef(null);
  const selectedCardRef = useRef(null);
  const prevHeightRef = useRef(null);
  const isFirstMountRef = useRef(true);
  const animTimeoutRef = useRef(null);

  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 560) : 400
  );

  // Measure container width smoothly (debounced resize + ResizeObserver)
  const updateWidth = useCallback(() => {
    if (!outerWrapperRef.current) return;
    const width = outerWrapperRef.current.clientWidth;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    const el = outerWrapperRef.current;
    if (!el) return undefined;

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateWidth());
      ro.observe(el);
    }
    window.addEventListener('resize', updateWidth, { passive: true });
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [updateWidth, colorVariants]);

  const availableColorVariants = useMemo(
    () => (colorVariants || []).filter((cVar) => !isColorCompletelyOutOfStock(cVar)),
    [colorVariants]
  );

  const isMobile = containerWidth < 520;
  const gridGap = isMobile ? 6 : 8;
  const minCardWidth = containerWidth < 360 ? 64 : isMobile ? 70 : 74;
  const columnsPerRow = Math.max(1, Math.floor((containerWidth + gridGap) / (minCardWidth + gridGap)));
  // Exact card width so collapsed row cards match expanded grid column width seamlessly
  const cardWidth = Math.max(
    minCardWidth,
    Math.min(80, Math.floor((containerWidth - gridGap * (columnsPerRow - 1)) / columnsPerRow))
  );

  const totalCount = availableColorVariants.length;
  const hasMore = totalCount > columnsPerRow;

  // Toggle expand/collapse while capturing pre-toggle height for smooth transition
  const handleToggleExpand = useCallback(() => {
    const outer = outerWrapperRef.current;
    if (outer) {
      prevHeightRef.current = outer.getBoundingClientRect().height;
    }
    setIsExpanded((prev) => !prev);
  }, []);

  // Animate outer wrapper height smoothly when expanding or collapsing
  useLayoutEffect(() => {
    const outer = outerWrapperRef.current;
    const inner = containerRef.current;
    if (!outer || !inner) return undefined;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return undefined;
    }

    const fromHeight = prevHeightRef.current;
    prevHeightRef.current = null;
    if (fromHeight === null || fromHeight === undefined) return undefined;

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    // Measure natural target height cleanly
    outer.style.transition = 'none';
    outer.style.height = 'auto';
    outer.style.overflow = 'hidden';
    const targetHeight = outer.getBoundingClientRect().height;

    if (Math.abs(targetHeight - fromHeight) < 2) {
      outer.style.height = 'auto';
      outer.style.overflow = 'visible';
      return undefined;
    }

    // Lock to starting height, force reflow, then animate cleanly to targetHeight
    outer.style.height = `${fromHeight}px`;
    void outer.offsetHeight;
    outer.style.transition = 'height 0.34s cubic-bezier(0.22, 1, 0.36, 1)';
    outer.style.height = `${targetHeight}px`;

    const finish = () => {
      if (outerWrapperRef.current) {
        outerWrapperRef.current.style.transition = '';
        outerWrapperRef.current.style.height = 'auto';
        outerWrapperRef.current.style.overflow = 'visible';
      }
    };

    animTimeoutRef.current = setTimeout(finish, 360);
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isExpanded]);

  // When in collapsed horizontal scroll mode, scroll selected card smoothly into view
  useEffect(() => {
    if (!isExpanded && selectedCardRef.current) {
      try {
        selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch {
        // ignore older browser scrollIntoView option error
      }
    }
  }, [selectedColor, isExpanded]);

  if (!Array.isArray(availableColorVariants) || availableColorVariants.length === 0) {
    return null;
  }

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
                onClick={handleToggleExpand}
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
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </button>
            ) : (
              <span>
                {totalCount} {totalCount === 1 ? 'colour' : 'colours'}
              </span>
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

      {/* Smooth Height-Animated Outer Wrapper */}
      <div ref={outerWrapperRef} style={{ width: '100%' }}>
        <div
          ref={containerRef}
          className={`color-variation-container ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
          style={
            isExpanded
              ? {
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
                  gap: gridGap,
                  width: '100%',
                  padding: '2px 1px 4px',
                  boxSizing: 'border-box',
                }
              : {
                  display: 'flex',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  gap: gridGap,
                  width: '100%',
                  padding: '2px 1px 4px',
                  boxSizing: 'border-box',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }
          }
        >
          {availableColorVariants.map((cVar, idx) => {
            const isSelected = Boolean(
              (selectedColor?._id && cVar._id && selectedColor._id.toString() === cVar._id.toString()) ||
              (selectedColor?.colorName && cVar.colorName && selectedColor.colorName.toLowerCase() === cVar.colorName.toLowerCase())
            );

            const thumbImg = cVar.images?.[0]?.url || fallbackImage;
            const isOutOfStock =
              Array.isArray(cVar.sizes) && cVar.sizes.length > 0
                ? cVar.sizes.every((s) => s.inStock === false)
                : cVar.inStock === false;

            // Gentle staggered reveal only for extra rows when expanded
            const isExtraRowItem = isExpanded && idx >= columnsPerRow;

            return (
              <button
                key={cVar._id || cVar.colorName}
                ref={isSelected ? selectedCardRef : null}
                className={`color-variation-card ${isSelected ? 'is-selected' : ''} ${
                  isExtraRowItem ? 'pg-color-reveal' : ''
                }`}
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
                    ? isDark
                      ? 'rgba(196,56,108,0.18)'
                      : 'rgba(196,56,108,0.06)'
                    : isDark
                    ? 'rgba(255,255,255,0.03)'
                    : '#FFFFFF',
                  boxShadow: isSelected ? '0 3px 12px rgba(196,56,108,0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.16s ease, box-shadow 0.16s ease, transform 0.14s ease',
                  userSelect: 'none',
                  opacity: isOutOfStock ? 0.5 : 1,
                  width: isExpanded ? '100%' : cardWidth,
                  minWidth: isExpanded ? 0 : cardWidth,
                  flex: isExpanded ? 'unset' : '0 0 auto',
                  boxSizing: 'border-box',
                  animationDelay: isExtraRowItem ? `${Math.min((idx - columnsPerRow) * 22, 180)}ms` : undefined,
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
                      decoding="async"
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
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .color-variation-container.is-collapsed::-webkit-scrollbar {
          display: none;
        }
        @keyframes pgColorItemReveal {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pg-color-reveal {
          animation: pgColorItemReveal 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
};

export default React.memo(ColorVariationSelector);
