import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/cloudinary';
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
    if (isOpen) {
      setActiveIndex(initialIndex || 0);
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
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark
              ? 'rgba(10, 10, 16, 0.88)'
              : 'rgba(253, 250, 245, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '16px',
            userSelect: 'none',
          }}
          onClick={onClose}
        >
          {/* Modal Container with Fade and Scale */}
          <motion.div
            key="product-image-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 920,
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px 14px',
                color: 'var(--text)',
              }}
            >
              <div style={{ minWidth: 0, paddingRight: 16 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
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
                style={{
                  width: 42,
                  height: 42,
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
                <X size={20} />
              </button>
            </div>

            {/* Main Enlarged Image Stage with Light Background & Swipe */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                overflow: 'hidden',
                background: isDark ? 'rgba(20, 20, 30, 0.7)' : '#FFFFFF',
                boxShadow: isDark
                  ? '0 20px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                  : '0 20px 60px rgba(196, 56, 108, 0.12), 0 4px 20px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--border)',
                touchAction: images.length > 1 ? 'pan-y' : 'auto',
                minHeight: '260px',
              }}
            >
              <img
                key={activeIndex}
                src={currentImage ? optimizeImageUrl(currentImage, 1600) : logoImg}
                alt={`${product.name} enlarged view`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '66vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 18,
                  transition: 'opacity 0.2s ease',
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = logoImg;
                  e.currentTarget.style.objectFit = 'contain';
                  e.currentTarget.style.padding = '40px';
                }}
              />

              {/* Left Chevron Navigation Button */}
              {images.length > 1 && (
                <button
                  type="button"
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
                    display: 'flex',
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

              {/* Right Chevron Navigation Button */}
              {images.length > 1 && (
                <button
                  type="button"
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
                    display: 'flex',
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

            {/* Bottom Thumbnails & Link Row */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: images.length > 1 ? 'space-between' : 'flex-end',
                paddingTop: 14,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Clickable Image Thumbnails when multiple images exist */}
              {images.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    padding: '4px 2px',
                  }}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Show image ${idx + 1}`}
                      style={{
                        width: 50,
                        height: 50,
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
                        opacity: activeIndex === idx ? 1 : 0.65,
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

              {/* Quick Link to Product Details Page */}
              {product._id && (
                <Link
                  to={`/product/${product._id}`}
                  onClick={onClose}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.05)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    marginLeft: 'auto',
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
                  <span>View Full Details</span>
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductImageModal;
