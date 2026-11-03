import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductImageModal = ({ isOpen, onClose, product, initialIndex = 0 }) => {
  const images = product?.images && product.images.length > 0
    ? product.images
    : (product?.image ? [{ url: product.image }] : []);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

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

  // Keyboard navigation & lock background scroll
  useEffect(() => {
    if (!isOpen) return;

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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'auto';
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

  if (!isOpen || !product) return null;

  const currentImage = images[activeIndex]?.url || images[0]?.url;

  return (
    <AnimatePresence>
      <div
        className="product-image-modal-root"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 8, 12, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '16px',
          userSelect: 'none',
        }}
        onClick={onClose}
      >
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 880,
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
              color: '#FFFFFF',
            }}
          >
            <div style={{ minWidth: 0, paddingRight: 16 }}>
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  fontWeight: 600,
                  margin: 0,
                  color: '#FAF6EE',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {product.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C4386C' }}>
                  ₹{product.price}
                </span>
                {images.length > 1 && (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                    Image {activeIndex + 1} of {images.length}
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
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, transform 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(196, 56, 108, 0.85)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Enlarged Image Stage with Swipe */}
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
              borderRadius: 16,
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              touchAction: images.length > 1 ? 'pan-y' : 'auto',
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

            {/* Left Chevron Navigation Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous image"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(20, 20, 28, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent, #C4386C)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 20, 28, 0.75)';
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
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(20, 20, 28, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent, #C4386C)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 20, 28, 0.75)';
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
              paddingTop: 12,
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
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      padding: 0,
                      cursor: 'pointer',
                      border: `2px solid ${activeIndex === idx ? '#C4386C' : 'rgba(255,255,255,0.2)'}`,
                      opacity: activeIndex === idx ? 1 : 0.6,
                      background: 'rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={optimizeImageUrl(img.url, 120)}
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
                  color: '#FAF6EE',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  transition: 'background 0.2s',
                  marginLeft: 'auto',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                <span>View Full Details</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductImageModal;
