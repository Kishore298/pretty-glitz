import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Ruler,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext, resolveStock } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import ProductDescriptionDisplay from './ProductDescriptionDisplay';
import BangleSizeChartModal from './BangleSizeChartModal';
import ProductImageModal from './ProductImageModal';
import ColorVariationSelector from './ColorVariationSelector';
import logoImg from '../assets/pretty-glitz-logo.png';

const CollectionProductDetailCard = ({ product, isLast = false }) => {
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
  const [isEnlargedModalOpen, setIsEnlargedModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const inWishlist = isInWishlist(product._id);

  // Available Sizes for currently selected variant
  const activeSizes = (selectedColor && selectedColor.sizes?.length > 0)
    ? selectedColor.sizes
    : (product.sizes || []);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (selectedColor?.sizes?.length > 0) {
      const firstInStock = selectedColor.sizes.find(s => s.inStock !== false);
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

  // Live stock evaluation for current variant (Scenario A & B)
  const stockInfo = resolveStock(product, selectedSize, selectedColor);
  const isOutOfStock = !product.inStock || !stockInfo.isAvailable;
  const isMaxReached = stockInfo.isStockTracked && cartVariantQty >= stockInfo.availableStock;

  const handleSelectColor = (cVar) => {
    setSelectedColor(cVar);
    setActiveImg(0); // Reset gallery to index 0 on colour switch
    if (cVar.sizes?.length > 0) {
      const stillValid = cVar.sizes.find(s => s.size === selectedSize && s.inStock !== false);
      if (!stillValid) {
        const firstAvailable = cVar.sizes.find(s => s.inStock !== false);
        setSelectedSize(firstAvailable ? firstAvailable.size : cVar.sizes[0].size);
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/product/${product._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on PrettyGlitz!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2500);
      } catch {
        // Fallback
      }
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    if (isMaxReached) return;
    updateQuantity(product._id, selectedSize, cartVariantQty + 1, selectedPieceCount?.count ?? null, selectedColor?._id);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    if (cartVariantQty <= 1) {
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null, selectedColor?._id);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null, selectedColor?._id);
    }
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX || !hasMultipleImages) return;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > 35) {
      if (distance > 35) {
        setActiveImg((prev) => (prev + 1) % images.length);
      } else {
        setActiveImg((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const currentImageUrl = images[activeImg]?.url || images[0]?.url;

  return (
    <div className={`collection-product-presentation ${isLast ? 'is-last' : ''}`}>
      <div className="product-detail-layout" style={{ width: '100%' }}>

        {/* ── Left Column: Clean Hero Product Gallery ───────────────── */}
        <div className="product-gallery-wrapper">
          <div
            className="product-gallery-main product-detail-gallery-main collection-product-gallery-main"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative',
              touchAction: hasMultipleImages ? 'pan-y' : 'auto',
            }}
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

            {/* Desktop Previous / Next Chevron Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  className="product-gallery-nav-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous photo"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(10, 10, 16, 0.65)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.65)')}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  className="product-gallery-nav-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev + 1) % images.length);
                  }}
                  aria-label="Next photo"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(10, 10, 16, 0.65)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 3,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.65)')}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Swipe & Click Dot Indicators (Always visible when multiple images exist) */}
            {hasMultipleImages && (
              <div
                className="collection-gallery-dots"
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                {images.map((_, dotIdx) => {
                  const isCurrent = dotIdx === activeImg;
                  return (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImg(dotIdx);
                      }}
                      aria-label={`Go to photo ${dotIdx + 1}`}
                      style={{
                        width: isCurrent ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: isCurrent ? 'var(--accent, #C4386C)' : 'rgba(255, 255, 255, 0.55)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Dedicated Expand Button to open enlarged image pop-up */}
            <button
              type="button"
              className="product-gallery-zoom-badge"
              onClick={(e) => {
                e.stopPropagation();
                setIsEnlargedModalOpen(true);
              }}
              title="Click to enlarge"
              aria-label="Enlarge image"
            >
              <Maximize2 size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* Thumbnail Strip: Showcase & Colour Variant Images */}
          {images.length > 1 && (
            <div
              className="product-gallery-thumbnails"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 14,
                overflowX: 'auto',
                padding: '4px 2px 8px',
                scrollbarWidth: 'thin',
              }}
            >
              {images.map((item, idx) => {
                const isActive = idx === activeImg;
                return (
                  <button
                    key={item._id || idx}
                    type="button"
                    onClick={() => setActiveImg(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    title={`Photo ${idx + 1}`}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      overflow: 'hidden',
                      padding: 0,
                      border: isActive
                        ? '2px solid var(--accent, #C4386C)'
                        : '1.5px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: isActive
                        ? '0 4px 12px rgba(196, 56, 108, 0.28)'
                        : 'none',
                      opacity: isActive ? 1 : 0.72,
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isActive ? 'scale(1.02)' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.opacity = '0.72';
                    }}
                  >
                    <img
                      src={optimizeImageUrl(item.url, 140)}
                      alt={`${product.name} ${idx + 1}`}
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
          )}
        </div>

        {/* ── Right Column: Info Wrapper (Identical to Product Detail Section) ── */}
        <div className="product-info-wrapper">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            <p className="product-detail-category">
              {product.category}
            </p>

            {/* Toast for copied link */}
            {copyToast && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10B981',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} /> Product link copied to clipboard!
              </motion.div>
            )}

            {/* Clickable Product Title Link with Glowing Golden Underline & Sparkle */}
            <div className="product-detail-title-row">
              <h3 className="complete-look-title-container" style={{ margin: 0 }}>
                <Link
                  to={`/product/${product._id}`}
                  className="complete-look-title-link"
                >
                  <span>{product.name}</span>
                </Link>
              </h3>

              <div className="product-detail-actions-group">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="product-detail-share-btn"
                  title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  style={{
                    color: inWishlist ? '#E11D48' : 'var(--text-secondary)',
                    borderColor: inWishlist ? 'rgba(225,29,72,0.3)' : 'var(--border)',
                    background: inWishlist ? 'rgba(225,29,72,0.08)' : 'transparent',
                  }}
                >
                  <Heart size={16} style={{ fill: inWishlist ? '#E11D48' : 'transparent', stroke: inWishlist ? '#E11D48' : 'currentColor' }} />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="product-detail-share-btn"
                  title="Share product"
                  aria-label="Share product"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Dynamic Price Display */}
            <div className="product-detail-price-row">
              <span className="product-detail-price">
                ₹{resolvedPrice}
              </span>
              {resolvedOriginalPrice && (
                <span className="product-detail-original-price">
                  ₹{resolvedOriginalPrice}
                </span>
              )}
              {product.packagingType && (
                <span
                  className="product-detail-packaging-type"
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    fontFamily: 'Outfit, sans-serif',
                    alignSelf: 'center',
                  }}
                >
                  ({(() => {
                    const qty = product.packagingQuantity && Number(product.packagingQuantity) > 0 ? Number(product.packagingQuantity) : 1;
                    const unit = (product.packagingType || '').trim();
                    const lower = unit.toLowerCase();
                    if (lower === 'set') return `${qty} ${qty > 1 ? 'Sets' : 'Set'}`;
                    if (lower === 'dozen') return `${qty} Dozen`;
                    if (lower === 'pieces' || lower === 'piece') return `${qty} ${qty === 1 ? 'Piece' : 'Pieces'}`;
                    if (lower === 'pair' || lower === 'pairs') return `${qty} ${qty === 1 ? 'Pair' : 'Pairs'}`;
                    if (lower === 'pack' || lower === 'packs') return `${qty} ${qty === 1 ? 'Pack' : 'Packs'}`;
                    if (lower === 'box' || lower === 'boxes') return `${qty} ${qty === 1 ? 'Box' : 'Boxes'}`;
                    return `${qty} ${unit}`;
                  })()})
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
                    marginBottom: 2,
                  }}
                >
                  Save ₹{resolvedOriginalPrice - resolvedPrice}
                </span>
              )}
              {!product.inStock && (
                <span className="product-detail-stock-badge">
                  Out of Stock
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

            {/* Bangle Size Selector with Live Stock Availability */}
            {activeSizes?.length > 0 && (
              <div className="product-detail-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="product-detail-label" style={{ margin: 0 }}>
                    Select Size
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
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--accent, #C4386C)',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      padding: 0,
                    }}
                  >
                    <Ruler size={14} /> Size Guide
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {activeSizes.map((s, idx) => {
                    const isOutOfStock = s.inStock === false;
                    const isSelected = selectedSize === s.size;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          if (!isOutOfStock) {
                            setSelectedSize(s.size);
                          }
                        }}
                        className="product-size-btn"
                        style={{
                          background: isOutOfStock
                            ? 'rgba(0,0,0,0.06)'
                            : isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          color: isOutOfStock
                            ? 'var(--text-muted)'
                            : isSelected ? 'white' : 'var(--text)',
                          border: isSelected ? 'none' : '1px solid var(--border)',
                          boxShadow: isSelected ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          textDecoration: isOutOfStock ? 'line-through' : 'none',
                          opacity: isOutOfStock ? 0.5 : 1,
                          position: 'relative',
                          minWidth: 46,
                        }}
                        title={isOutOfStock ? `${s.size} is currently out of stock` : `Select size ${s.size}`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Piece Count Selector */}
            {product.pieceCounts?.length > 0 && (
              <div className="product-detail-section">
                <span className="product-detail-label">
                  Piece Count
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[...product.pieceCounts].sort((a, b) => a.count - b.count).map((pc, idx) => {
                    const isSelected = selectedPieceCount?.count === pc.count;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPieceCount(pc)}
                        className="product-piece-btn"
                        style={{
                          background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                          color: isSelected ? 'white' : 'var(--text)',
                          border: isSelected ? 'none' : `1px solid var(--border)`,
                          boxShadow: isSelected ? '0 8px 20px rgba(196,56,108,0.4)' : 'none',
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{pc.count} pcs</span>
                        <span style={{ opacity: isSelected ? 0.85 : 0.7 }}>₹{pc.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cart Controls with Live Stock Validation */}
            {!isOutOfStock ? (
              <div className="product-cart-section">
                {variantInCart ? (
                  /* Quantity Stepper when variant is in cart */
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="product-cart-stepper">
                      <button type="button" onClick={handleDecrease} className="product-cart-stepper-btn" aria-label="Decrease quantity">
                        <Minus size={16} />
                      </button>
                      <span className="product-cart-stepper-qty">
                        {cartVariantQty}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrease}
                        disabled={isMaxReached}
                        className="product-cart-stepper-btn"
                        aria-label="Increase quantity"
                        style={{
                          opacity: isMaxReached ? 0.35 : 1,
                          cursor: isMaxReached ? 'not-allowed' : 'pointer',
                        }}
                        title={isMaxReached ? `Only ${stockInfo.availableStock} available` : 'Add one more'}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <Link to="/cart" className="product-view-cart-btn">
                      <ShoppingBag size={16} /> View Cart
                    </Link>
                  </div>
                ) : (
                  /* Add to Cart */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="product-add-cart-btn"
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(196,56,108,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,56,108,0.3)'; }}
                  >
                    {addedFeedback ? <><Check size={18} /> Added to Cart</> : 'Add to Cart'}
                  </button>
                )}
              </div>
            ) : (
              <div className="product-cart-section">
                <button
                  disabled
                  className="product-add-cart-btn"
                  style={{
                    background: '#374151',
                    color: '#9CA3AF',
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                    opacity: 0.8,
                  }}
                >
                  Out of Stock
                </button>
              </div>
            )}

            {/* Collapsible Sections for Details and Shipping (Uniform styling & arrows) */}
            <div className="product-accordions-group" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Accordion 1: Product Details & Specifications */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                }}
              >
                <button
                  type="button"
                  className="product-accordion-btn"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                  }}
                >
                  <span>Product Details & Specifications</span>
                  <motion.div
                    animate={{ rotate: detailsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', color: 'var(--text)' }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {detailsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ paddingTop: 14 }}>
                          <ProductDescriptionDisplay description={product.description} />
                        </div>
                        {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
                          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
                              Included Items
                            </h4>
                            <ProductDescriptionDisplay description={product.giftBoxDetails} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Shipping & Returns */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                }}
              >
                <button
                  type="button"
                  className="product-accordion-btn"
                  onClick={() => setShippingOpen(!shippingOpen)}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                  }}
                >
                  <span>🚚 Shipping & Returns</span>
                  <motion.div
                    animate={{ rotate: shippingOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', color: 'var(--text)' }}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {shippingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '14px 18px 18px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                          All-India delivery available. We take extreme care in packaging your products to ensure they arrive in perfect condition. Handcrafted pieces are dispatched within 2-3 business days.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </motion.div>
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
