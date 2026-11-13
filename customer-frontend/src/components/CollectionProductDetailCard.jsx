import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Sparkles,
  Ruler,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import ProductDescriptionDisplay from './ProductDescriptionDisplay';
import BangleSizeChartModal from './BangleSizeChartModal';
import ProductImageModal from './ProductImageModal';
import ColorVariationSelector from './ColorVariationSelector';
import logoImg from '../assets/pretty-glitz-logo.png';

const CollectionProductDetailCard = ({ product, isLast = false }) => {
  const { isDark } = useTheme();
  const { addToCart, updateQuantity, removeFromCart, getCartItemQuantity, isInCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Color Variant Selection
  const [selectedColor, setSelectedColor] = useState(() => {
    if (product.colorVariants && product.colorVariants.length > 0) {
      return product.colorVariants.find(c => c.isDefault) || product.colorVariants[0];
    }
    return null;
  });

  const [activeImg, setActiveImg] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [didSwipe, setDidSwipe] = useState(false);
  const [isEnlargedModalOpen, setIsEnlargedModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Available Sizes for currently selected variant
  const activeSizes = (selectedColor && selectedColor.sizes?.length > 0)
    ? selectedColor.sizes
    : (product.sizes || []);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (selectedColor?.sizes?.length > 0) {
      const firstInStock = selectedColor.sizes.find(s => s.inStock && (s.stockCount > 0));
      return firstInStock ? firstInStock.size : selectedColor.sizes[0].size;
    }
    return product.sizes?.length > 0 ? product.sizes[0].size : null;
  });

  const [selectedPieceCount, setSelectedPieceCount] = useState(() => {
    if (product.pieceCounts?.length > 0) {
      const sorted = [...product.pieceCounts].sort((a, b) => a.count - b.count);
      return sorted[0];
    }
    return null;
  });

  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const inWishlist = isInWishlist(product._id);

  // Images for currently selected variant
  const images = (selectedColor && selectedColor.images?.length > 0)
    ? selectedColor.images
    : (product.images && product.images.length > 0 ? product.images : []);

  const hasMultipleImages = images.length > 1;

  // Resolved dynamic price based on piece count selection
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product.originalPrice;
  const discountPercent = resolvedOriginalPrice
    ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
    : 0;

  // Cart variant check
  const cartVariantQty = getCartItemQuantity(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);
  const variantInCart = isInCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);

  const handleSelectColor = (cVar) => {
    setSelectedColor(cVar);
    setActiveImg(0); // Reset gallery to index 0 on colour switch
    if (cVar.sizes?.length > 0) {
      const stillValid = cVar.sizes.find(s => s.size === selectedSize && s.inStock && (s.stockCount > 0));
      if (!stillValid) {
        const firstAvailable = cVar.sizes.find(s => s.inStock && (s.stockCount > 0));
        setSelectedSize(firstAvailable ? firstAvailable.size : cVar.sizes[0].size);
      }
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!product.inStock) return;
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    updateQuantity(product._id, selectedSize, cartVariantQty + 1, selectedPieceCount?.count ?? null);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    if (cartVariantQty <= 1) {
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null);
    }
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setDidSwipe(false);
  };
  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    if (touchStartX && Math.abs(e.targetTouches[0].clientX - touchStartX) > 10) {
      setDidSwipe(true);
    }
  };
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !hasMultipleImages) return;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > 35) {
      setDidSwipe(true);
      if (distance > 35) {
        setActiveImg((prev) => (prev + 1) % images.length);
      } else {
        setActiveImg((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    if (didSwipe) {
      setDidSwipe(false);
      return;
    }
    setIsEnlargedModalOpen(true);
  };

  const currentImageUrl = images[activeImg]?.url || images[0]?.url;

  return (
    <div className={`collection-product-presentation ${isLast ? 'is-last' : ''}`}>
      <div className="product-detail-layout" style={{ width: '100%' }}>

        {/* ── Left Column: Clean Hero Product Gallery ───────────────── */}
        <div className="product-gallery-wrapper">
          <div
            className="product-gallery-main"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleImageClick}
            style={{
              position: 'relative',
              touchAction: hasMultipleImages ? 'pan-y' : 'auto',
              borderRadius: 18,
              overflow: 'hidden',
              background: isDark ? '#14141C' : '#F7F5F2',
              aspectRatio: '1 / 1',
              width: '100%',
              maxWidth: 540,
              cursor: 'zoom-in',
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsEnlargedModalOpen(true);
              }
            }}
            aria-label={`View enlarged images for ${product.name}`}
          >
            <img
              src={currentImageUrl ? optimizeImageUrl(currentImageUrl, 1000) : logoImg}
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = logoImg;
                e.currentTarget.style.objectFit = 'contain';
                e.currentTarget.style.padding = '40px';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: currentImageUrl ? 'cover' : 'contain',
                display: 'block',
                transition: 'transform 0.35s ease',
              }}
            />

            {/* Desktop Previous / Next Chevron Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous photo"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'rgba(10, 10, 16, 0.65)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 4,
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev + 1) % images.length);
                  }}
                  aria-label="Next photo"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'rgba(10, 10, 16, 0.65)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 4,
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Tap to Enlarge Indicator */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
              title="Click to enlarge"
            >
              <ZoomIn size={16} />
            </div>

            {/* Mobile swipe dot indicators */}
            {hasMultipleImages && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  zIndex: 2,
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  padding: '3px 7px',
                  borderRadius: 999,
                  pointerEvents: 'none',
                }}
              >
                {images.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === activeImg ? 12 : 5,
                      height: 5,
                      borderRadius: 999,
                      background: i === activeImg ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Top-Left Discount Pill */}
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }}>
              {discountPercent > 0 && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 8px rgba(196,56,108,0.35)',
                  }}
                >
                  {discountPercent}% OFF
                </span>
              )}
              {product.isBestseller && !discountPercent && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #B8860B, #E5C158)',
                    color: '#2A1800',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Sparkles size={11} /> Bestseller
                </span>
              )}
            </div>

            {/* Bottom-Right Wishlist Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isDark ? 'rgba(20,20,28,0.85)' : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1px solid ${inWishlist ? 'rgba(225,29,72,0.4)' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3,
                color: inWishlist ? '#E11D48' : (isDark ? '#F5F0EA' : '#1A1118'),
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: inWishlist ? '0 4px 12px rgba(225,29,72,0.35)' : '0 2px 8px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Heart
                size={17}
                style={{
                  fill: inWishlist ? '#E11D48' : 'transparent',
                  stroke: inWishlist ? '#E11D48' : 'currentColor',
                  strokeWidth: 2,
                  transition: 'fill 0.2s ease, stroke 0.2s ease',
                }}
              />
            </button>
          </div>
        </div>

        {/* ── Right Column: Info Wrapper (Complete In-Place Purchasing, No Redirection) ── */}
        <div className="product-info-wrapper">
          {/* Category & Stock Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--accent, #C4386C)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {product.subcategoryId?.name || product.category}
            </span>

            {product.inStock ? (
              typeof product.inStockCount === 'number' && product.inStockCount <= 5 ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#D97706',
                    background: 'rgba(217,119,6,0.1)',
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: '1px solid rgba(217,119,6,0.25)',
                  }}
                >
                  Only {product.inStockCount} left
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#10B981',
                    background: 'rgba(16,185,129,0.1)',
                    padding: '3px 9px',
                    borderRadius: 999,
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  ✓ In Stock
                </span>
              )
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#EF4444',
                  background: 'rgba(239,68,68,0.1)',
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                Sold Out
              </span>
            )}
          </div>

          {/* Product Title (In-Place viewing, NO REDIRECTION link away from page!) */}
          <h3
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--text)',
              margin: '0 0 12px',
            }}
          >
            {product.name}
          </h3>

          {/* Dynamic Pricing Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              ₹{resolvedPrice}
            </span>
            {resolvedOriginalPrice && (
              <span
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  fontWeight: 500,
                }}
              >
                ₹{resolvedOriginalPrice}
              </span>
            )}
            {discountPercent > 0 && resolvedOriginalPrice && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#C4386C',
                  background: 'rgba(196,56,108,0.1)',
                  padding: '3px 9px',
                  borderRadius: 6,
                }}
              >
                Save ₹{resolvedOriginalPrice - resolvedPrice}
              </span>
            )}
          </div>

          {/* Colour Variation Selector with Expand/Collapse */}
          {product.colorVariants && product.colorVariants.length > 0 && (
            <ColorVariationSelector
              colorVariants={product.colorVariants}
              selectedColor={selectedColor}
              onSelectColor={handleSelectColor}
              fallbackImage={product.images?.[0]?.url}
            />
          )}

          {/* Variant Selection: Bangles Sizes */}
          {activeSizes?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text)',
                    display: 'block',
                  }}
                >
                  Select Size:
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeChart(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: 'var(--accent, #C4386C)',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    padding: 0,
                  }}
                >
                  <Ruler size={13} /> Size Guide
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activeSizes.map((s, i) => {
                  const isOutOfStock = s.inStock === false || (typeof s.stockCount === 'number' && s.stockCount <= 0);
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => !isOutOfStock && setSelectedSize(s.size)}
                      className="product-size-btn"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        background: isOutOfStock
                          ? 'rgba(0,0,0,0.06)'
                          : isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                        color: isOutOfStock
                          ? 'var(--text-muted)'
                          : isSelected ? '#FFFFFF' : 'var(--text)',
                        border: isSelected ? 'none' : '1px solid var(--border)',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        textDecoration: isOutOfStock ? 'line-through' : 'none',
                        boxShadow: isSelected ? '0 4px 14px rgba(196,56,108,0.35)' : 'none',
                        opacity: isOutOfStock ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                      title={isOutOfStock ? `${s.size} is out of stock` : `Size ${s.size}`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Selection: Piece Counts */}
          {product.pieceCounts?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Select Piece Count:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[...product.pieceCounts].sort((a, b) => a.count - b.count).map((pc, i) => {
                  const isSelected = selectedPieceCount?.count === pc.count;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPieceCount(pc)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                        color: isSelected ? '#FFFFFF' : 'var(--text)',
                        border: isSelected ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 14px rgba(196,56,108,0.35)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{pc.count} pcs</span>
                      <span style={{ opacity: 0.85, fontSize: '0.78rem' }}>₹{pc.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Action Area (In-place purchasing) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18, marginTop: 4 }}>
            {variantInCart ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 400 }}>
                <div className="product-cart-stepper" style={{ height: 48 }}>
                  <button
                    type="button"
                    onClick={handleDecrease}
                    className="product-cart-stepper-btn"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="product-cart-stepper-qty">{cartVariantQty}</span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    className="product-cart-stepper-btn"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <Link
                  to="/cart"
                  className="product-view-cart-btn"
                  style={{ height: 48, fontSize: '0.88rem', flex: 1 }}
                >
                  <ShoppingBag size={16} /> View Cart
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="product-add-cart-btn"
                style={{
                  height: 48,
                  maxWidth: 400,
                  width: '100%',
                  background: product.inStock ? 'var(--accent-gradient)' : 'var(--input-bg)',
                  color: product.inStock ? '#FFFFFF' : 'var(--text-muted)',
                  cursor: product.inStock ? 'pointer' : 'not-allowed',
                  boxShadow: product.inStock ? '0 8px 24px rgba(196,56,108,0.3)' : 'none',
                }}
              >
                {addedFeedback ? (
                  <>
                    <Check size={18} /> Added to Cart
                  </>
                ) : product.inStock ? (
                  <>
                    <ShoppingBag size={18} /> Add to Cart
                  </>
                ) : (
                  'Out of Stock'
                )}
              </button>
            )}
          </div>

          {/* Collapsible Product Details Accordion */}
          <div
            style={{
              marginBottom: 16,
              borderRadius: 14,
              background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(26,17,24,0.02)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setDetailsOpen(!detailsOpen)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span>Product Details & Specs</span>
              <motion.div animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.div>
            </button>

            <AnimatePresence>
              {detailsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 10 }}>
                      <ProductDescriptionDisplay description={product.description} />
                    </div>
                    {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          Included Items:
                        </span>
                        <ProductDescriptionDisplay description={product.giftBoxDetails} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shipping Info Card */}
          <div className="product-shipping-card" style={{ marginTop: 0 }}>
            <h4 className="product-shipping-title">
              <span>🚚</span> Shipping & Returns
            </h4>
            <p className="product-shipping-text">
              All-India delivery available. We take extreme care in packaging your products to ensure they arrive in perfect condition. Handcrafted pieces are dispatched within 2-3 business days.
            </p>
          </div>
        </div>

      </div>

      {/* Bangle Sizing Chart Modal */}
      <BangleSizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
      />

      {/* Enlarged Product Image Modal with Swipe */}
      <ProductImageModal
        isOpen={isEnlargedModalOpen}
        onClose={() => setIsEnlargedModalOpen(false)}
        product={product}
        images={images}
        initialIndex={activeImg}
      />
    </div>
  );
};

export default CollectionProductDetailCard;
