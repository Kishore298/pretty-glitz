import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import ProductDescriptionDisplay from './ProductDescriptionDisplay';
import logoImg from '../assets/pretty-glitz-logo.png';

const CollectionProductDetailCard = ({ product, isLast = false }) => {
  const { isDark } = useTheme();
  const { addToCart, updateQuantity, removeFromCart, getCartItemQuantity, isInCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.length > 0 ? product.sizes[0].size : null
  );
  const [selectedPieceCount, setSelectedPieceCount] = useState(() => {
    if (product.pieceCounts?.length > 0) {
      const sorted = [...product.pieceCounts].sort((a, b) => a.count - b.count);
      return sorted[0];
    }
    return null;
  });
  const [addedFeedback, setAddedFeedback] = useState(false);

  const inWishlist = isInWishlist(product._id);

  // Resolved dynamic price based on piece count selection
  const resolvedPrice = selectedPieceCount ? selectedPieceCount.price : product.price;
  const resolvedOriginalPrice = selectedPieceCount ? selectedPieceCount.originalPrice : product.originalPrice;
  const discountPercent = resolvedOriginalPrice
    ? Math.round(((resolvedOriginalPrice - resolvedPrice) / resolvedOriginalPrice) * 100)
    : 0;

  // Cart variant check
  const cartVariantQty = getCartItemQuantity(product._id, selectedSize, selectedPieceCount?.count ?? null);
  const variantInCart = isInCart(product._id, selectedSize, selectedPieceCount?.count ?? null);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!product.inStock) return;
    addToCart(product, selectedSize, 1, selectedPieceCount?.count ?? null, resolvedPrice);
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
      removeFromCart(product._id, selectedSize, selectedPieceCount?.count ?? null);
    } else {
      updateQuantity(product._id, selectedSize, cartVariantQty - 1, selectedPieceCount?.count ?? null);
    }
  };

  const currentImageUrl = product.images?.[activeImg]?.url || product.images?.[0]?.url;

  return (
    <div
      className={`collection-product-presentation ${isLast ? 'is-last' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 360px) 1fr',
        gap: '32px',
        alignItems: 'start',
        padding: '24px 0 36px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* ── Left Column: Product Image Presentation ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 18,
            overflow: 'hidden',
            background: isDark ? '#14141C' : '#F7F5F2',
            border: '1px solid var(--border)',
            aspectRatio: '1 / 1',
            width: '100%',
          }}
        >
          <Link
            to={`/product/${product._id}`}
            style={{ display: 'block', width: '100%', height: '100%' }}
            aria-label={`View ${product.name}`}
          >
            <img
              src={currentImageUrl ? optimizeImageUrl(currentImageUrl, 700) : logoImg}
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = logoImg;
                e.currentTarget.style.objectFit = 'contain';
                e.currentTarget.style.padding = '24px';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: currentImageUrl ? 'cover' : 'contain',
                padding: currentImageUrl ? 0 : '24px',
                transition: 'transform 0.35s ease',
              }}
            />
          </Link>

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

          {/* Bottom-Right Wishlist Heart Button (Task #5) */}
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

        {/* Thumbnail Selector (if multiple images) */}
        {product.images?.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImg(idx)}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `2px solid ${activeImg === idx ? 'var(--accent, #C4386C)' : 'var(--border)'}`,
                  opacity: activeImg === idx ? 1 : 0.65,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  background: 'var(--bg-secondary)',
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={optimizeImageUrl(img.url, 120)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Column: Product Presentation Matching Single Product Page ─ */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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

        {/* Product Title (links naturally to single product page) */}
        <Link
          to={`/product/${product._id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
              fontWeight: 600,
              lineHeight: 1.25,
              color: 'var(--text)',
              margin: '0 0 12px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent, #C4386C)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text)')}
          >
            {product.name}
          </h3>
        </Link>

        {/* Dynamic Pricing Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '1.65rem',
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
                fontSize: '1rem',
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

        {/* Variant Selection: Bangles Sizes */}
        {product.sizes?.length > 0 && (
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
              Select Size:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.sizes.map((s, i) => {
                const isSelected = selectedSize === s.size;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSize(s.size)}
                    className="product-size-btn"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                      color: isSelected ? '#FFFFFF' : 'var(--text)',
                      border: isSelected ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 14px rgba(196,56,108,0.35)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
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

        {/* Structured Product Details (Task #8) */}
        <div
          style={{
            marginBottom: 20,
            padding: '14px 16px',
            borderRadius: 12,
            background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(26,17,24,0.02)',
            border: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Product Details
          </span>
          <ProductDescriptionDisplay description={product.description} />

          {/* Gift Box Items if applicable */}
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

        {/* Add to Cart Action Area (No View Details button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          {variantInCart ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 380 }}>
              <div className="product-cart-stepper" style={{ height: 46 }}>
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
                style={{ height: 46, fontSize: '0.86rem', flex: 1 }}
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
                maxWidth: 380,
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

        {/* Shipping Guarantee Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>🚚</span>
          <span>All-India Delivery • Handcrafted Packaging</span>
        </div>
      </div>
    </div>
  );
};

export default CollectionProductDetailCard;
