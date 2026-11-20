import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/cloudinary';
import { getProductUrl } from '../utils/urlHelper';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/pretty-glitz-logo.png';

/**
 * ProductImageModal
 *
 * Light luxury enlarged product image pop-out viewer.
 * Complements the website's soft ivory & blush aesthetics instead of a harsh black screen.
 * Features:
 * - Soft off-white / warm ivory backdrop with backdrop blur.
 * - Smooth fade & scale open/close transitions via AnimatePresence.
 * - Scroll lock during preview + instant scroll position restoration on close.
 * - Touch swipe support on mobile devices.
 * - Keyboard navigation (Esc to close, left/right arrows to navigate).
 */
const ProductImageModal = ({
  isOpen,
  onClose,
  product,
  images: overrideImages = null,
  initialIndex = 0,
}) => {
  const { isDark } = useTheme();

  // Prefer images passed explicitly (e.g. from currently active colour variant), fallback to product.images
  const rawImages = overrideImages && overrideImages.length > 0
    ? overrideImages
    : (product?.images && product.images.length > 0
      ? product.images
      : (product?.image ? [{ url: product.image }] : []));

  const images = Array.isArray(rawImages) ? rawImages : [];
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const scrollYRef = useRef(0);

  // Sync active index when opening or when initialIndex changes
  useEffect(() => {
    if (isOpen && typeof initialIndex === 'number' && initialIndex >= 0) {
      setActiveIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Navigate next / previous
  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Scroll lock + Keyboard navigation + Exact scroll position restoration
  useEffect(() => {
    if (!isOpen) return;

    // Capture exact scroll position when opening
    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
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

      // Restore the exact previous scroll position immediately
      const savedY = scrollYRef.current;
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      try {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      } catch (err) {
        window.scrollTo(0, savedY);
      }
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prevBehavior;
      });
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || images.length <= 1) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNext(); // swipe left -> next
    } else if (distance < -40) {
      handlePrev(); // swipe right -> prev
    }
  };

  const currentImage = images[activeIndex]?.url || images[0]?.url;

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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            background: isDark
              ? 'rgba(10, 10, 16, 0.88)'
              : 'rgba(253, 250, 245, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            userSelect: 'none',
            padding: 0,
          }}
          onClick={onClose}
        >
          {/* Modal Container with Fade and Scale & Upward Lift */}
          <motion.div
            key="product-image-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -36 }}
            exit={{ opacity: 0, scale: 0.94, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="product-image-modal-card"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div
              className="product-image-modal-header"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text)',
              }}
            >
              <div style={{ minWidth: 0, paddingRight: 12 }}>
                <h3
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: 'clamp(1.15rem, 2.5vw, 1.55rem)',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {product.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent, #C4386C)' }}>
                    ₹{product.price}
                  </span>
                  {images.length > 1 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Photo {activeIndex + 1} of {images.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close enlarged preview"
                className="product-image-modal-close-btn"
                style={{
                  borderRadius: '50%',
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 17, 24, 0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent, #C4386C)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 17, 24, 0.06)';
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={19} />
              </button>
            </div>

            {/* Main Enlarged Image Stage with Transparent Background & Natural Aspect Ratio */}
            <div
              className="product-image-modal-stage"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'transparent',
                boxShadow: 'none',
                touchAction: images.length > 1 ? 'pan-y' : 'auto',
              }}
            >
              <div
                className="product-image-modal-img-wrapper"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                <img
                  key={activeIndex}
                  src={currentImage ? optimizeImageUrl(currentImage, 1600) : logoImg}
                  alt={`${product.name} enlarged view`}
                  className="product-image-modal-img"
                  style={{
                    display: 'block',
                    borderRadius: 14,
                    transition: 'opacity 0.2s ease',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = logoImg;
                    e.currentTarget.style.objectFit = 'contain';
                    e.currentTarget.style.padding = '40px';
                  }}
                />

                {/* Interactive Dot Indicators (Placed directly on the image at the bottom) */}
                {images.length > 1 && (
                  <div
                    className="modal-gallery-dots"
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      zIndex: 10,
                      background: 'rgba(0, 0, 0, 0.45)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      padding: '3px 8px',
                      borderRadius: 999,
                    }}
                  >
                    {images.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIndex(dotIdx);
                        }}
                        aria-label={`View photo ${dotIdx + 1}`}
                        style={{
                          width: dotIdx === activeIndex ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: dotIdx === activeIndex ? 'var(--accent, #C4386C)' : 'rgba(255, 255, 255, 0.65)',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Left Chevron Navigation Button (Desktop only) */}
              {images.length > 1 && (
                <button
                  type="button"
                  className="modal-gallery-nav-btn"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(28, 28, 40, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent, #C4386C)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(28, 28, 40, 0.88)' : 'rgba(255, 255, 255, 0.94)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Right Chevron Navigation Button (Desktop only) */}
              {images.length > 1 && (
                <button
                  type="button"
                  className="modal-gallery-nav-btn"
                  onClick={handleNext}
                  aria-label="Next image"
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(28, 28, 40, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent, #C4386C)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(28, 28, 40, 0.88)' : 'rgba(255, 255, 255, 0.94)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Manual Image Navigation Buttons (← →) Below the Image */}
            {images.length > 1 && (
              <div
                className="modal-manual-nav-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  paddingTop: 8,
                  paddingBottom: 4,
                  width: '100%',
                }}
              >
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  title="Previous image"
                  className="modal-manual-arrow-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent, #C4386C)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                  <span>Prev</span>
                </button>

                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {activeIndex + 1} / {images.length}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  title="Next image"
                  className="modal-manual-arrow-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent, #C4386C)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)';
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Bottom Thumbnails & Action Controls Row */}
            <div
              className="product-image-modal-bottom"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: images.length > 1 ? 'space-between' : 'flex-end',
                paddingTop: 10,
                gap: 12,
                flexWrap: 'nowrap',
              }}
            >
              {/* Responsive Clickable Image Thumbnails when multiple images exist */}
              {images.length > 1 && (
                <div
                  className="modal-thumbnails-scroll-container"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    padding: '4px 2px 6px',
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: '100%',
                    scrollbarWidth: 'thin',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Show image ${idx + 1}`}
                      style={{
                        width: 'clamp(42px, 7vw, 50px)',
                        height: 'clamp(42px, 7vw, 50px)',
                        borderRadius: 10,
                        overflow: 'hidden',
                        padding: 0,
                        cursor: 'pointer',
                        border: activeIndex === idx
                          ? '2px solid var(--accent, #C4386C)'
                          : '1px solid var(--border)',
                        boxShadow: activeIndex === idx
                          ? '0 4px 12px rgba(196, 56, 108, 0.35)'
                          : 'none',
                        opacity: 1, // Unshaded, crystal clear on all thumbnails
                        background: '#FFFFFF',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={optimizeImageUrl(img.url, 140)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Action Column: View Full Details + Back Button (Back button placed slightly lower) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 8,
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                {product && (
                  <Link
                    to={getProductUrl(product)}
                    onClick={onClose}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      padding: '8px 18px',
                      borderRadius: 999,
                      background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                      boxShadow: '0 4px 16px rgba(196, 56, 108, 0.35)',
                      border: 'none',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(196, 56, 108, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 56, 108, 0.35)';
                    }}
                  >
                    <span>View Full Details</span>
                    <ExternalLink size={13} />
                  </Link>
                )}

                {/* Back button below View Full Details, positioned slightly lower */}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    marginTop: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent, #C4386C)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span>← Back</span>
                </button>
              </div>
            </div>

            <style>{`
              .product-image-modal-root {
                justify-content: center !important;
                align-items: center !important;
                padding: 12px 10px !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
              }
              .product-image-modal-card {
                width: auto !important;
                max-width: min(94vw, 560px) !important;
                min-height: auto !important;
                height: auto !important;
                max-height: 94dvh !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                margin: auto !important;
                padding: 4px 6px !important;
                box-sizing: border-box !important;
                transform: translateY(-36px) !important;
              }
              .product-image-modal-header {
                flex-shrink: 0 !important;
                padding: 0 2px 6px !important;
                width: 100% !important;
              }
              .product-image-modal-close-btn {
                width: 36px !important;
                height: 36px !important;
              }
              .product-image-modal-stage {
                flex: 0 1 auto !important;
                width: auto !important;
                max-width: 100% !important;
                min-height: auto !important;
                max-height: min(60vh, 520px) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                position: relative !important;
                background: transparent !important;
                box-shadow: none !important;
              }
              .product-image-modal-img {
                width: auto !important;
                height: auto !important;
                max-width: min(92vw, 540px) !important;
                max-height: min(58vh, 500px) !important;
                object-fit: contain !important;
                border-radius: 14px !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25) !important;
              }
              .product-image-modal-bottom {
                flex-shrink: 0 !important;
                padding-top: 8px !important;
                padding-bottom: 2px !important;
                width: 100% !important;
              }
              .modal-gallery-nav-btn {
                display: none !important;
              }
              .modal-gallery-dots {
                display: flex !important;
              }
              .modal-thumbnails-scroll-container::-webkit-scrollbar {
                height: 4px !important;
              }
              .modal-thumbnails-scroll-container::-webkit-scrollbar-thumb {
                background: var(--border, rgba(0,0,0,0.25)) !important;
                border-radius: 4px !important;
              }
              @media (min-width: 769px) {
                .product-image-modal-root {
                  justify-content: center !important;
                  padding: 24px !important;
                }
                .product-image-modal-card {
                  height: auto !important;
                  max-height: 94vh !important;
                  max-width: 820px !important;
                  justify-content: center !important;
                  transform: translateY(-44px) !important;
                }
                .product-image-modal-header {
                  padding: 0 4px 8px !important;
                }
                .product-image-modal-close-btn {
                  width: 40px !important;
                  height: 40px !important;
                }
                .product-image-modal-stage {
                  flex: 0 1 auto !important;
                  min-height: auto !important;
                  max-height: 70vh !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
                .product-image-modal-img {
                  height: auto !important;
                  width: auto !important;
                  max-width: 80vw !important;
                  max-height: 68vh !important;
                  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3) !important;
                }
                .product-image-modal-bottom {
                  padding-top: 10px !important;
                }
                .modal-gallery-nav-btn {
                  display: flex !important;
                }
                .modal-gallery-dots {
                  display: flex !important;
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
