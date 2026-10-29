import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Plus, Minus, Check, ArrowRight, Sparkles } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

const CollectionProductDetailCard = ({ product }) => {
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
    <div className="collection-full-detail-card">
      {/* ── Left Column: Product Image Gallery ───────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          background: isDark ? '#161622' : '#F7F5F2',
          aspectRatio: '1 / 1',
          width: '100%',
        }}>
          <Link to={`/product/${product._id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
            <img
              src={currentImageUrl ? optimizeImageUrl(currentImageUrl, 600) : logoImg}
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
                transition: 'transform 0.4s ease',
              }}
            />
          </Link>

          {/* Discount Pill */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }}>
            {discountPercent > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
                color: '#FFF',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 999,
                letterSpacing: '0.04em',
                boxShadow: '0 2px 8px rgba(196,56,108,0.35)',
              }}>
                {discountPercent}% OFF
              </span>
            )}
            {product.isBestseller && !discountPercent && (
              <span style={{
                background: 'linear-gradient(135deg, #B8860B, #E5C158)',
                color: '#2A1800',
                fontSize: '9px',
                fontWeight: 800,
                padding: '4px 8px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <Sparkles size={10} /> Bestseller
              </span>
            )}
          </div>

          {/* Top-Right Wishlist Heart */}
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
              top: 10,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: isDark ? 'rgba(20,20,28,0.8)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${inWishlist ? 'rgba(225,29,72,0.35)' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              color: inWishlist ? '#E11D48' : (isDark ? '#F5F0EA' : '#1A1118'),
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: inWishlist ? '0 2px 10px rgba(225,29,72,0.35)' : '0 2px 6px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart
              size={16}
              style={{
                fill: inWishlist ? '#E11D48' : 'transparent',
                stroke: inWishlist ? '#E11D48' : 'currentColor',
                strokeWidth: 2,
                transition: 'fill 0.2s ease, stroke 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Thumbnail Selector if multiple images */}
        {product.images?.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImg(idx)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: `2px solid ${activeImg === idx ? 'var(--accent)' : 'transparent'}`,
                  opacity: activeImg === idx ? 1 : 0.6,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  background: 'none',
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

      {/* ── Right Column: Full Product Details ───────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Header Row: Category Badge & Stock Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {product.subcategoryId?.name || product.category}
            </span>

            {product.inStock ? (
              typeof product.inStockCount === 'number' && product.inStockCount <= 5 ? (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#D97706',
                  background: 'rgba(217,119,6,0.1)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(217,119,6,0.25)',
                }}>
                  Only {product.inStockCount} left
                </span>
              ) : (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#10B981',
                  background: 'rgba(16,185,129,0.1)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(16,185,129,0.25)',
                }}>
                  ✓ In Stock
                </span>
              )
            ) : (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#EF4444',
                background: 'rgba(239,68,68,0.1)',
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(239,68,68,0.25)',
              }}>
                Sold Out
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
            <h3 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.45rem',
              fontWeight: 700,
              lineHeight: 1.25,
              color: 'var(--text)',
              margin: '0 0 10px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
            >
              {product.name}
            </h3>
          </Link>

          {/* Pricing Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
            <span style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--accent-gold)',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em',
            }}>
              ₹{resolvedPrice}
            </span>
            {resolvedOriginalPrice && (
              <span style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                textDecoration: 'line-through',
                fontWeight: 500,
              }}>
                ₹{resolvedOriginalPrice}
              </span>
            )}
            {discountPercent > 0 && resolvedOriginalPrice && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#C4386C',
                background: 'rgba(196,56,108,0.1)',
                padding: '2px 8px',
                borderRadius: 6,
              }}>
                Save ₹{resolvedOriginalPrice - resolvedPrice}
              </span>
            )}
          </div>

          {/* Full Product Details Description */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,17,24,0.02)',
            border: `1px solid var(--border)`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
          }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 6px',
            }}>
              Product Details
            </p>
            <p style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {product.description || 'Artisanal jewellery handcrafted with precision and premium finishes.'}
            </p>

            {/* Gift Box Details if applicable */}
            {product.category?.toLowerCase() === 'gift box combo' && product.giftBoxDetails && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Included Items:{' '}
                </span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {product.giftBoxDetails}
                </span>
              </div>
            )}
          </div>

          {/* Variant Selection: Sizes */}
          {product.sizes?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}>
                Select Size:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.sizes.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedSize(s.size)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: selectedSize === s.size ? 'var(--accent-gradient)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)'),
                      color: selectedSize === s.size ? '#FFFFFF' : 'var(--text)',
                      border: selectedSize === s.size ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: selectedSize === s.size ? '0 2px 8px rgba(196,56,108,0.3)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selection: Piece Counts */}
          {product.pieceCounts?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: 6,
              }}>
                Select Piece Count:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[...product.pieceCounts].sort((a, b) => a.count - b.count).map((pc, i) => {
                  const isSelected = selectedPieceCount?.count === pc.count;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPieceCount(pc)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: isSelected ? 'var(--accent-gradient)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)'),
                        color: isSelected ? '#FFFFFF' : 'var(--text)',
                        border: isSelected ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 8px rgba(196,56,108,0.3)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{pc.count} pcs</span>
                      <span style={{ opacity: 0.8, marginLeft: 6, fontSize: '0.75rem' }}>₹{pc.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shipping & Delivery Guarantee */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(26,17,24,0.03)',
            border: '1px solid var(--border)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            <span>🚚</span>
            <span>All-India Delivery • Handcrafted Packaging</span>
          </div>
        </div>

        {/* ── Actions: Add to Cart & View Details ──────────────────────── */}
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingTop: 14,
          borderTop: '1px solid var(--border)',
        }}>
          {variantInCart ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="product-cart-stepper">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="product-cart-stepper-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="product-cart-stepper-qty">{cartVariantQty}</span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="product-cart-stepper-btn"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <Link
                to="/cart"
                className="product-view-cart-btn"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                <ShoppingBag size={14} /> View Cart
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '12px 20px',
                borderRadius: 12,
                background: product.inStock ? 'var(--accent-gradient)' : 'var(--input-bg)',
                color: product.inStock ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: product.inStock ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: product.inStock ? '0 4px 16px rgba(196,56,108,0.3)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                if (product.inStock) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,56,108,0.4)';
                }
              }}
              onMouseLeave={e => {
                if (product.inStock) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,56,108,0.3)';
                }
              }}
            >
              {addedFeedback ? (
                <><Check size={16} /> Added to Cart</>
              ) : product.inStock ? (
                <><ShoppingBag size={16} /> Add to Cart</>
              ) : (
                'Out of Stock'
              )}
            </button>
          )}

          <Link
            to={`/product/${product._id}`}
            style={{
              padding: '11px 18px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text)';
            }}
          >
            View Details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionProductDetailCard;
