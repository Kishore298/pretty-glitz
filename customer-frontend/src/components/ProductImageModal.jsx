import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/cloudinary';
import { getProductUrl } from '../utils/urlHelper';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/pretty-glitz-logo.png';

/**
 * ProductImageModal
 *
 * Enlarged product image popup gallery matching the wireframe layout:
 * - Top: Full-width image card (1:1 on Main Product, 3:4 on Complete Your Look).
 * - Middle: [<prev 1/9 next>] on left (or centered when view details is omitted);
 *   [view details] on right.
 * - Thumbnail Section (Enclosed Box matching wireframe):
 *   - Transparent background (no white card).
 *   - Line 1 of thumbnails (occupies full width, starts from left).
 *   - Divider line.
 *   - Line 2 of thumbnails (starts from left, aligns with line 1).
 *   - Divider line (if line 3 exists).
 *   - Line 3 of thumbnails (starts from left).
 *   - Omitted for single-image products or products without color thumbnails.
 * - Bottom right: [Back with icon] fully visible on initial viewport without scrolling.
 */
const ProductImageModal = ({
  isOpen,
  onClose,
  product,
  images: overrideImages = null,
  initialIndex = 0,
  onImageChange = null,
  showViewDetails = true,
  aspectRatio = '1 / 1',
}) => {
  const { isDark } = useTheme();

  const images = React.useMemo(() => {
    const rawImages = overrideImages && overrideImages.length > 0
      ? overrideImages
      : (product?.images && product.images.length > 0
        ? product.images
        : (product?.image ? [{ url: product.image }] : []));
    return Array.isArray(rawImages) ? rawImages : [];
  }, [overrideImages, product?.images, product?.image]);

  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const activeIndexRef = useRef(initialIndex || 0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const touchMovedRef = useRef(false);
  const scrollYRef = useRef(0);
  const activeThumbRef = useRef(null);

  const updateActiveIndex = useCallback((newIndex) => {
    activeIndexRef.current = newIndex;
    setActiveIndex(newIndex);
    if (typeof onImageChange === 'function') {
      onImageChange(newIndex);
    }
  }, [onImageChange]);

  // Sync active index when opening or when initialIndex changes
  useEffect(() => {
    if (isOpen && typeof initialIndex === 'number' && initialIndex >= 0) {
      activeIndexRef.current = initialIndex;
      setActiveIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex, isOpen]);

  // Navigate next / previous
  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const next = (activeIndexRef.current + 1) % images.length;
    updateActiveIndex(next);
  }, [images.length, updateActiveIndex]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const prev = (activeIndexRef.current - 1 + images.length) % images.length;
    updateActiveIndex(prev);
  }, [images.length, updateActiveIndex]);

  const handleClose = useCallback(() => {
    if (typeof onImageChange === 'function') {
      onImageChange(activeIndexRef.current);
    }
    if (typeof onClose === 'function') {
      onClose(activeIndexRef.current);
    }
  }, [onClose, onImageChange]);

  // Scroll lock + Keyboard navigation + Scroll position restoration
  useEffect(() => {
    if (!isOpen) return;

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || '';

      const savedY = scrollYRef.current;
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      try {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, savedY);
      }
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });
    };
  }, [isOpen, handleClose, handleNext, handlePrev]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchMovedRef.current = false;
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    if (touchStartX && Math.abs(e.targetTouches[0].clientX - touchStartX) > 8) {
      touchMovedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || images.length <= 1) return;
    const distance = touchStartX - touchEndX;
    if (distance > 35) {
      handleNext();
    } else if (distance < -35) {
      handlePrev();
    }
  };

  // Image stage tap navigation (left side <45% = prev, right side >55% = next)
  const handleStageClick = (e) => {
    if (touchMovedRef.current) return;
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    if (ratio < 0.45) {
      handlePrev();
    } else if (ratio > 0.55) {
      handleNext();
    }
  };

  const currentItem = images[activeIndex];
  const currentImageUrl = typeof currentItem === 'string' ? currentItem : currentItem?.url;
  const currentLabel = typeof currentItem === 'object'
    ? (currentItem?.colorVariant?.colorName || currentItem?.label || '')
    : '';

  // Determine if product has color thumbnail images
  const hasColorThumbnails = Boolean(
    (product?.colorVariants && product.colorVariants.length > 0) ||
    images.some((img) => img?.colorVariant || img?.type === 'color')
  );

  // Show thumbnail section only if product has color thumbnail images and more than 1 image
  const showThumbnailSection = hasColorThumbnails && images.length > 1;

  // Distribute thumbnails into lines of 5 items per line (matching wireframe line 1, line 2, line 3)
  const thumbnailRows = React.useMemo(() => {
    if (!showThumbnailSection || images.length === 0) return [];
    const total = images.length;
    const itemsPerRow = 5;
    const rows = [];
    for (let i = 0; i < total; i += itemsPerRow) {
      const start = i;
      const rowSlice = images.slice(start, start + itemsPerRow);
      rows.push(
        rowSlice.map((item, idx) => ({
          item,
          globalIdx: start + idx,
        }))
      );
    }
    return rows;
  }, [images, showThumbnailSection]);

  const hasViewDetailsButton = Boolean(showViewDetails && product);
  const isPortraitMode = aspectRatio === '3 / 4' || aspectRatio === '9 / 16';

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          key="product-image-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="product-image-modal-root"
          onClick={handleClose}
        >
          {/* Centered Modal Container */}
          <motion.div
            key="product-image-modal-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`product-image-modal-card ${isPortraitMode ? 'is-portrait-card' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, Price, Active Label & Close Button */}
            <div className="product-image-modal-header">
              <div style={{ minWidth: 0, flex: '1 1 auto', paddingRight: 10 }}>
                <h3 className="product-image-modal-title">
                  {product.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--accent, #C4386C)' }}>
                    ₹{product.price}
                  </span>
                  {currentLabel && (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--accent, #C4386C)',
                        background: isDark ? 'rgba(196,56,108,0.22)' : 'rgba(196,56,108,0.08)',
                        border: '1px solid rgba(196,56,108,0.25)',
                        padding: '1px 7px',
                        borderRadius: 6,
                        textTransform: 'capitalize',
                      }}
                    >
                      {currentLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close image popup"
                className="product-image-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Image Stage (1:1 on Main Product, 3:4 on Complete Your Look - Image Fits Card) */}
            <div
              className={`product-image-modal-stage ${isPortraitMode ? 'is-portrait-stage' : 'is-square-stage'}`}
              style={{
                aspectRatio: aspectRatio || '1 / 1',
              }}
              onClick={handleStageClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={activeIndex}
                src={currentImageUrl ? optimizeImageUrl(currentImageUrl, 1600) : logoImg}
                alt={`${product.name} enlarged preview`}
                className="product-image-modal-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = logoImg;
                  e.currentTarget.style.objectFit = 'contain';
                  e.currentTarget.style.padding = '40px';
                }}
              />
            </div>

            {/* Controls Row: [<prev 1/9 next>] on left (or centered when view details is omitted) | [view details] on right */}
            <div
              className="modal-controls-row"
              style={{
                justifyContent: hasViewDetailsButton ? 'space-between' : 'center',
              }}
            >
              {/* <prev 1/9 next> rectangular button group */}
              <div
                className="modal-nav-capsule"
                style={{
                  margin: hasViewDetailsButton ? '0' : '0 auto',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  disabled={images.length <= 1}
                  className="modal-nav-capsule-btn"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span className="modal-nav-capsule-count">
                  {images.length > 0 ? `${activeIndex + 1} / ${images.length}` : '1 / 1'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={images.length <= 1}
                  className="modal-nav-capsule-btn"
                  aria-label="Next image"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* View Full Details Button: shown only when showViewDetails is true (e.g. Complete Your Look) */}
              {hasViewDetailsButton && (
                <Link
                  to={getProductUrl(product)}
                  onClick={handleClose}
                  className="modal-view-details-btn"
                >
                  <span>View Details</span>
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>

            {/* Thumbnail Section (Enclosed Box with Lines & Dividers matching Wireframe) */}
            {showThumbnailSection && (
              <div className="modal-thumbnail-section">
                {thumbnailRows.map((row, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    {rowIdx > 0 && <div className="modal-thumbnail-row-divider" />}
                    <div className="modal-thumbnail-row">
                      {row.map(({ item, globalIdx }) => {
                        const imgUrl = typeof item === 'string' ? item : item?.url;
                        const isThumbActive = globalIdx === activeIndex;
                        const thumbLabel = typeof item === 'object'
                          ? (item?.colorVariant?.colorName || item?.label || `Photo ${globalIdx + 1}`)
                          : `Photo ${globalIdx + 1}`;

                        return (
                          <button
                            key={globalIdx}
                            ref={isThumbActive ? activeThumbRef : null}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateActiveIndex(globalIdx);
                            }}
                            aria-label={`Select ${thumbLabel}`}
                            title={thumbLabel}
                            className={`modal-thumb-btn ${isThumbActive ? 'is-active' : ''}`}
                          >
                            <img
                              src={optimizeImageUrl(imgUrl, 200)}
                              alt={thumbLabel}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Bottom Right: Clean ArrowLeft Icon paired with Back */}
            <div className="modal-footer-row">
              <button
                type="button"
                onClick={handleClose}
                className="modal-back-btn"
                aria-label="Back to page"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            </div>

            <style>{`
              .product-image-modal-root {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${isDark ? 'rgba(10, 10, 16, 0.88)' : 'rgba(253, 250, 245, 0.90)'};
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                user-select: none;
                padding: 10px 12px;
                box-sizing: border-box;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
              }

              .product-image-modal-card {
                position: relative;
                width: 100%;
                max-width: 500px;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: auto;
                box-sizing: border-box;
                transform: none !important;
                max-height: 98vh;
              }

              .product-image-modal-card.is-portrait-card {
                max-width: 420px;
              }

              .product-image-modal-header {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
                padding: 0 2px;
                box-sizing: border-box;
              }

              .product-image-modal-title {
                font-family: "Cormorant Garamond", Georgia, serif;
                font-size: clamp(1.1rem, 2.6vw, 1.35rem);
                font-weight: 700;
                margin: 0;
                color: var(--text);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.2;
              }

              .product-image-modal-close-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 17, 24, 0.06)'};
                border: 1px solid var(--border);
                color: var(--text);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                flex-shrink: 0;
              }

              .product-image-modal-close-btn:hover {
                background: var(--accent, #C4386C);
                color: #FFFFFF;
                border-color: var(--accent, #C4386C);
                transform: scale(1.08);
              }

              /* Full-Width Image Card */
              .product-image-modal-stage {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                border-radius: 14px;
                overflow: hidden;
                background: ${isDark ? '#14141e' : '#f7f4ee'};
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
                cursor: pointer;
              }

              .product-image-modal-stage.is-square-stage {
                aspect-ratio: 1 / 1;
                max-height: min(44vh, 360px);
              }

              .product-image-modal-stage.is-portrait-stage {
                aspect-ratio: 3 / 4;
                max-height: min(48vh, 390px);
              }

              .product-image-modal-img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 14px;
              }

              /* Controls Row */
              .modal-controls-row {
                display: flex;
                align-items: center;
                width: 100%;
                margin-top: 8px;
                gap: 10px;
                box-sizing: border-box;
              }

              /* Nav Capsule Navigator: <prev 1/9 next> */
              .modal-nav-capsule {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)'};
                border: 1.5px solid var(--border);
                border-radius: 8px;
                padding: 3px 6px;
                user-select: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
              }

              .modal-nav-capsule-btn {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                background: transparent;
                border: none;
                color: var(--text);
                font-size: 0.78rem;
                font-weight: 600;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.15s ease;
              }

              .modal-nav-capsule-btn:not(:disabled):hover {
                background: var(--accent, #C4386C);
                color: #FFFFFF;
              }

              .modal-nav-capsule-btn:disabled {
                opacity: 0.35;
                cursor: not-allowed;
              }

              .modal-nav-capsule-count {
                font-size: 0.78rem;
                font-weight: 700;
                color: var(--text);
                padding: 0 5px;
                letter-spacing: 0.02em;
              }

              /* View Details Button */
              .modal-view-details-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: #FFFFFF;
                font-size: 0.78rem;
                font-weight: 700;
                text-decoration: none;
                padding: 6px 16px;
                border-radius: 8px;
                background: var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2));
                box-shadow: 0 3px 12px rgba(196, 56, 108, 0.3);
                border: none;
                transition: all 0.2s ease;
                white-space: nowrap;
              }

              .modal-view-details-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 5px 16px rgba(196, 56, 108, 0.4);
              }

              /* Enclosed Box for Thumbnail Section (Wireframe Design: Lines 1, 2, 3 with Dividers) */
              .modal-thumbnail-section {
                width: 100%;
                background: transparent;
                border: 1.5px solid var(--border);
                border-radius: 12px;
                padding: 8px 10px;
                margin-top: 8px;
                box-sizing: border-box;
              }

              .modal-thumbnail-row {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
                width: 100%;
                box-sizing: border-box;
                justify-items: start;
              }

              .modal-thumbnail-row-divider {
                width: 100%;
                height: 1px;
                background: var(--border);
                margin: 6px 0;
                opacity: 0.55;
              }

              .modal-thumb-btn {
                width: 100%;
                aspect-ratio: 1 / 1;
                border-radius: 8px;
                overflow: hidden;
                padding: 0;
                cursor: pointer;
                border: 1.5px solid var(--border);
                background: transparent;
                opacity: 0.88;
                box-sizing: border-box;
                transition: all 0.18s ease;
              }

              .modal-thumb-btn.is-active {
                border-color: var(--accent, #C4386C);
                border-width: 2.5px;
                box-shadow: 0 3px 12px rgba(196, 56, 108, 0.42);
                transform: scale(1.04);
                opacity: 1;
              }

              .modal-thumb-btn:hover {
                opacity: 1;
                transform: scale(1.03);
              }

              /* Bottom Right Back with Previous Icon */
              .modal-footer-row {
                display: flex;
                justify-content: flex-end;
                width: 100%;
                margin-top: 6px;
                padding: 2px 2px 0;
                box-sizing: border-box;
                flex-shrink: 0;
              }

              .modal-back-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: transparent;
                border: none;
                cursor: pointer;
                font-family: inherit;
                font-size: 0.84rem;
                font-weight: 700;
                color: var(--text-secondary);
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.18s ease;
              }

              .modal-back-btn:hover {
                color: var(--accent, #C4386C);
                background: ${isDark ? 'rgba(196, 56, 108, 0.16)' : 'rgba(196, 56, 108, 0.08)'};
                transform: translateX(-3px);
              }

              @media (min-width: 769px) {
                .product-image-modal-root {
                  padding: 16px;
                }
                .product-image-modal-stage.is-square-stage {
                  max-height: min(48vh, 400px);
                }
                .product-image-modal-stage.is-portrait-stage {
                  max-height: min(52vh, 430px);
                }
              }

              @media (max-width: 480px) {
                .modal-nav-capsule-btn {
                  font-size: 0.74rem;
                  padding: 3px 6px;
                }
                .modal-nav-capsule-count {
                  font-size: 0.74rem;
                  padding: 0 4px;
                }
                .modal-view-details-btn {
                  font-size: 0.74rem;
                  padding: 5px 12px;
                }
                .modal-back-btn {
                  font-size: 0.80rem;
                  padding: 3px 6px;
                }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductImageModal;
