import React, { useState, useContext, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Share2,
  Ruler,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext, resolveStock, isColorCompletelyOutOfStock } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { sortSizesAscending, getBangleSizeParts } from '../utils/sizeHelper';
import { getProductUrl } from '../utils/urlHelper';
import ProductDescriptionDisplay from './ProductDescriptionDisplay';
import BangleSizeChartModal from './BangleSizeChartModal';
import ProductImageModal from './ProductImageModal';
import ColorVariationSelector from './ColorVariationSelector';
import logoImg from '../assets/pretty-glitz-logo.png';

const CollectionProductDetailCard = ({ product, isLast = false }) => {
  const { isDark } = useTheme();
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Color Variant Selection (unselected by default so showcase main image is displayed first)
  const [selectedColor, setSelectedColor] = useState(null);

  const [activeImg, setActiveImg] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const touchMovedRef = useRef(false);
  const [isEnlargedModalOpen, setIsEnlargedModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const inWishlist = isInWishlist(product._id);
  const [error, setError] = useState('');

  // In-stock colour variations
  const availableColorVariants = useMemo(() => {
    return (product?.colorVariants || []).filter((cVar) => !isColorCompletelyOutOfStock(cVar));
  }, [product?.colorVariants]);

  // Available Sizes for currently selected variant - or aggregated by default across in-stock variants
  const activeSizes = useMemo(() => {
    if (selectedColor && !isColorCompletelyOutOfStock(selectedColor) && selectedColor.sizes?.length > 0) {
      return sortSizesAscending(selectedColor.sizes);
    }
    // If no color selected yet, aggregate all available unique sizes across in-stock colorVariants
    if (availableColorVariants.length > 0) {
      const sizeMap = new Map();
      availableColorVariants.forEach((cv) => {
        if (Array.isArray(cv.sizes)) {
          cv.sizes.forEach((s) => {
            if (!sizeMap.has(s.size)) {
              sizeMap.set(s.size, s);
            } else if (s.inStock && !sizeMap.get(s.size)?.inStock) {
              sizeMap.set(s.size, s);
            }
          });
        }
      });
      if (sizeMap.size > 0) {
        return sortSizesAscending(Array.from(sizeMap.values()));
      }
    }
    return sortSizesAscending(product.sizes || []);
  }, [selectedColor, availableColorVariants, product.sizes]);

  // Keep size initially unselected per user instruction
  const [selectedSize, setSelectedSize] = useState(null);

  const [selectedPieceCount, setSelectedPieceCount] = useState(() => {
    if (product.pieceCounts?.length > 0) {
      const sorted = [...product.pieceCounts].sort((a, b) => a.count - b.count);
      return sorted[0];
    }
    return null;
  });

  // Combine overall product showcase images FIRST, followed by in-stock color variant images
  // so the main image is always #1 and color variant images follow next consistently
  const images = React.useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    const addImg = (img, meta = {}) => {
      if (!img) return;
      const url = typeof img === 'string' ? img : img.url;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        list.push(typeof img === 'string' ? { url: img, ...meta } : { ...img, ...meta });
      }
    };

    // 1. Add product showcase images FIRST (main image)
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => addImg(img, { isShowcase: true }));
    } else if (product.image) {
      addImg(product.image, { isShowcase: true });
    }

    // 2. Add images from in-stock color variants next (completely out-of-stock colorways excluded)
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((cVar) => {
        if (isColorCompletelyOutOfStock(cVar)) return;
        if (Array.isArray(cVar.images)) {
          cVar.images.forEach((img) => addImg(img, { colorVariant: cVar }));
        }
      });
    }

    // 3. Fallback / Selected color images if any remaining and in stock
    if (selectedColor && !isColorCompletelyOutOfStock(selectedColor) && Array.isArray(selectedColor.images)) {
      selectedColor.images.forEach((img) => addImg(img, { colorVariant: selectedColor }));
    }

    return list.length > 0 ? list : (product.image ? [{ url: product.image, isShowcase: true }] : []);
  }, [product, selectedColor]);

  const hasMultipleImages = images.length > 1;

  // Resolved dynamic price based on piece count selection
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product.originalPrice;
  const discountPercent = resolvedOriginalPrice
    ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
    : 0;

  // Strict Cart Variant Matching: Stepper and "View Cart" only display when the exact variant matches
  const hasColors = availableColorVariants.length > 0;
  const hasSizes = Boolean(activeSizes && activeSizes.length > 0);
  const isSelectionComplete = (!hasColors || selectedColor) && (!hasSizes || selectedSize);

  const matchedCartItem = useMemo(() => {
    if (!product || !isSelectionComplete) return null;
    return (cartItems || []).find((i) => {
      const pId = (typeof i.product === 'object' ? i.product?._id : i.product)?.toString();
      if (pId !== product._id?.toString()) return false;

      if (hasColors) {
        const itemColorId = i.colorVariantId ? i.colorVariantId.toString() : null;
        const curColorId = selectedColor?._id ? selectedColor._id.toString() : null;
        if (itemColorId && curColorId) {
          if (itemColorId !== curColorId) return false;
        } else if (i.colorName && selectedColor?.colorName) {
          if (i.colorName.toLowerCase() !== selectedColor.colorName.toLowerCase()) return false;
        } else if (itemColorId !== curColorId) {
          return false;
        }
      }

      if (hasSizes) {
        if (i.size !== selectedSize) return false;
      }

      if (selectedPieceCount) {
        if (i.pieceCount !== (selectedPieceCount?.count ?? null)) return false;
      }

      return true;
    });
  }, [product, isSelectionComplete, cartItems, hasColors, selectedColor, hasSizes, selectedSize, selectedPieceCount]);

  const variantInCart = Boolean(matchedCartItem);
  const cartVariantQty = matchedCartItem ? matchedCartItem.quantity : 0;

  // Live stock evaluation for current variant (Scenario A & B)
  const stockInfo = resolveStock(product, selectedSize, selectedColor);
  const isOutOfStock = !product.inStock || !stockInfo.isAvailable;
  const isMaxReached = stockInfo.isStockTracked && cartVariantQty >= stockInfo.availableStock;

  const handleSelectColor = (cVar) => {
    setSelectedColor(cVar);
    setError('');
    // Smoothly jump activeImg to this color variant's image
    const cVarUrl = cVar.images?.[0]?.url || (typeof cVar.images?.[0] === 'string' ? cVar.images[0] : null);
    if (cVarUrl) {
      const targetIdx = images.findIndex((img) => (typeof img === 'string' ? img : img.url) === cVarUrl);
      if (targetIdx !== -1) {
        setActiveImg(targetIdx);
      }
    }
    if (selectedSize && cVar.sizes?.length > 0) {
      const stillValid = cVar.sizes.find((s) => s.size === selectedSize && s.inStock !== false);
      if (!stillValid) {
        setSelectedSize(null);
      }
    }
  };

  const navigateToImageIndex = (idx) => {
    setActiveImg(idx);
    setError('');
    const clickedItem = images[idx];
    const clickedUrl = typeof clickedItem === 'string' ? clickedItem : clickedItem?.url;
    if (clickedItem?.colorVariant) {
      if (!isColorCompletelyOutOfStock(clickedItem.colorVariant)) {
        setSelectedColor(clickedItem.colorVariant);
      }
    } else if (clickedUrl && Array.isArray(product.colorVariants)) {
      const match = product.colorVariants.find(
        (cv) => !isColorCompletelyOutOfStock(cv) && Array.isArray(cv.images) && cv.images.some((img) => (typeof img === 'string' ? img : img?.url) === clickedUrl)
      );
      if (match) {
        setSelectedColor(match);
      } else {
        setSelectedColor(null);
      }
    }
  };

  const handleThumbnailClick = navigateToImageIndex;

  const handleGalleryClick = (e) => {
    if (touchMovedRef.current) return;
    if (!hasMultipleImages) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    if (ratio < 0.45) {
      const prevIdx = (activeImg - 1 + images.length) % images.length;
      navigateToImageIndex(prevIdx);
    } else if (ratio > 0.55) {
      const nextIdx = (activeImg + 1) % images.length;
      navigateToImageIndex(nextIdx);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${getProductUrl(product)}`;
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
    if (product.colorVariants && product.colorVariants.length > 0 && !selectedColor) {
      setError('Please choose a colour to continue');
      return;
    }
    if (activeSizes?.length > 0 && !selectedSize) {
      setError('Please select a size to continue');
      return;
    }
    if (isOutOfStock) return;
    setError('');
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice, selectedColor);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);

    // Smoothly expand specs accordion on next animation frame after cart state updates settle
    if (!detailsOpen) {
      setTimeout(() => {
        setDetailsOpen(true);
      }, 60);
    }
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
    if (!touchStartX || !touchEndX || !hasMultipleImages) return;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > 35) {
      if (distance > 35) {
        navigateToImageIndex((activeImg + 1) % images.length);
      } else {
        navigateToImageIndex((activeImg - 1 + images.length) % images.length);
      }
    }
  };

  const currentImageUrl = images[activeImg]?.url || images[0]?.url;

  return (
    <div className={`collection-product-presentation ${isLast ? 'is-last' : ''}`}>
      <div className="product-detail-layout" style={{ width: '100%' }}>

        {/* ── Left Column: Clean Hero Product Gallery ───────────────── */}
        <div className="product-gallery-wrapper">
          <div className="collection-product-card-header">
            <span className="collection-product-collection-heading">
              {product.category}
            </span>
          </div>

          <div
            className="product-gallery-main collection-product-gallery-main"
            onClick={handleGalleryClick}
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
                objectFit: 'cover',
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
                    navigateToImageIndex((activeImg - 1 + images.length) % images.length);
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
                    navigateToImageIndex((activeImg + 1) % images.length);
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
                        navigateToImageIndex(dotIdx);
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
        </div>

        {/* ── Right Column: Info Wrapper (Identical to Product Detail Section) ── */}
        <div className="product-info-wrapper">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

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
                  to={getProductUrl(product)}
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
                  <Heart
                    size={16}
                    style={{
                      fill: inWishlist ? '#E11D48' : 'rgba(255, 255, 255, 0.65)',
                      stroke: inWishlist ? '#E11D48' : (isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(35, 28, 33, 0.65)'),
                      strokeWidth: 1.6,
                    }}
                  />
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

            {/* Bangle Size Selector with Live Stock Availability (Positioned directly below price) */}
            {activeSizes?.length > 0 && (!hasColors || selectedColor) && (
              <div className="product-detail-section product-size-section">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
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
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--accent, #C4386C)',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      padding: '2px 4px',
                    }}
                  >
                    <Ruler size={13} /> Size Guide
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {activeSizes.map((s, idx) => {
                    const isOutOfStock = s.inStock === false;
                    const isSelected = selectedSize === s.size;
                    const { sizeNumber, cmRange } = getBangleSizeParts(s.size);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          if (!isOutOfStock) {
                            setSelectedSize(s.size);
                            setError('');
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
                          border: isSelected ? '2px solid var(--accent, #C4386C)' : '1px solid var(--border)',
                          borderRadius: 10,
                          boxShadow: isSelected ? '0 4px 14px rgba(196,56,108,0.35)' : 'none',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          textDecoration: isOutOfStock ? 'line-through' : 'none',
                          opacity: isOutOfStock ? 0.5 : 1,
                          position: 'relative',
                        }}
                        title={isOutOfStock ? `${s.size} is currently out of stock` : `Select size ${s.size}`}
                      >
                        <span style={{ fontWeight: 700 }}>{sizeNumber}</span>
                        {cmRange && (
                          <span style={{ fontSize: '0.82em', fontWeight: 500, opacity: 0.9, marginLeft: 4 }}>
                            ({cmRange})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colour Variation Selector with Expand/Collapse */}
            {availableColorVariants && availableColorVariants.length > 0 && (
              <ColorVariationSelector
                colorVariants={availableColorVariants}
                selectedColor={selectedColor}
                onSelectColor={handleSelectColor}
                fallbackImage={product.images?.[0]?.url}
              />
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

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}
              >
                {error}
              </motion.p>
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

                <AnimatePresence initial={false}>
                  {detailsOpen && (
                    <motion.div
                      key="product-details-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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
        onClose={(finalIdx) => {
          setIsEnlargedModalOpen(false);
          if (typeof finalIdx === 'number' && images[finalIdx]) {
            setActiveImg(finalIdx);
            handleThumbnailClick(finalIdx);
          }
        }}
        product={product}
        images={images}
        initialIndex={activeImg}
        showViewDetails={true}
        aspectRatio="3 / 4"
        onImageChange={(newIdx) => {
          setActiveImg(newIdx);
          handleThumbnailClick(newIdx);
        }}
      />
    </div>
  );
};

export default CollectionProductDetailCard;
