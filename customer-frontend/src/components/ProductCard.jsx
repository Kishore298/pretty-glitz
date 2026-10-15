import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, updateQuantity, removeFromCart, isInCart, getCartItemQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  // Products with sizes/pieceCounts need the detail page for selection
  const needsDetailPage =
    ((product.category || '').toLowerCase().includes('bangles') && product.sizes?.length > 0) ||
    product.pieceCounts?.length > 0;

  const inCart = isInCart(product._id);
  const cartQty = getCartItemQuantity(product._id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsDetailPage) {
      navigate(`/product/${product._id}`);
      return;
    }
    addToCart(product, null, 1, null, product.price);
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsDetailPage) { navigate(`/product/${product._id}`); return; }
    addToCart(product, null, 1, null, product.price);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty <= 1) {
      removeFromCart(product._id, null, null);
    } else {
      updateQuantity(product._id, null, cartQty - 1, null);
    }
  };

  return (
    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isHovered ? 'var(--accent-gold)' : 'var(--border)',
          borderRadius: 14,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
          boxShadow: isHovered
            ? (isDark ? '0 10px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.2)' : '0 10px 24px -4px rgba(26,17,24,0.1), 0 0 0 1px rgba(184,134,11,0.15)')
            : (isDark ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(26,17,24,0.03)'),
          transform: isHovered ? 'translateY(-3px)' : 'none',
          height: '100%',
        }}
      >
        {/* Image Container */}
        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: isDark ? '#161622' : '#F7F5F2',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 6,
          transition: 'background 0.35s ease',
        }}>
          {product.images && product.images[0] ? (
            <img
              src={optimizeImageUrl(product.images[0].url, 400)}
              alt={product.name}
              loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ) : (
            <div className="no-image-placeholder">
              <div className="pg-monogram">PG</div>
              <span style={{ fontSize: '0.7rem' }}>Coming Soon</span>
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }}>
            {discountPercent > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
                color: '#FFF', fontSize: '9px', fontWeight: 700,
                padding: '3px 7px', borderRadius: 999,
                letterSpacing: '0.04em',
                boxShadow: '0 2px 6px rgba(196,56,108,0.35)',
              }}>
                {discountPercent}% OFF
              </span>
            )}
            {product.isBestseller && !discountPercent && (
              <span style={{
                background: 'linear-gradient(135deg, #B8860B, #E5C158)',
                color: '#2A1800',
                fontSize: '8px', fontWeight: 800, padding: '3px 6px',
                borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(184,134,11,0.3)',
              }}>
                ★ Best Seller
              </span>
            )}
            {!product.inStock && (
              <span style={{
                background: '#ef4444', color: '#FFF',
                fontSize: '8px', fontWeight: 800, padding: '3px 6px',
                borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
              }}>
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          flex: 1,
          padding: '2px 2px 0',
          width: '100%',
        }}>
          <span style={{
            fontSize: '0.64rem',
            color: isHovered ? 'var(--accent)' : 'var(--text-muted)',
            marginBottom: 2,
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            transition: 'color 0.2s ease',
          }}>
            {product.subcategoryId?.name || product.category}
          </span>

          <h3 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '1.02rem',
            fontWeight: 600,
            lineHeight: 1.2,
            color: isHovered ? 'var(--accent)' : 'var(--text)',
            margin: '0 0 4px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em',
            transition: 'color 0.2s ease',
            width: '100%',
          }}>
            {product.name}
          </h3>

          {/* Price & Add to Cart on the SAME line */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            width: '100%',
            gap: 6,
            paddingTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--accent-gold)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1,
                letterSpacing: '-0.01em',
              }}>
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  fontWeight: 500,
                }}>
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            <div style={{ flexShrink: 0 }}>
              {product.inStock ? (
                inCart && !needsDetailPage ? (
                  /* Quantity stepper */
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'var(--accent-gradient)',
                      borderRadius: 999,
                      overflow: 'hidden',
                      height: 28,
                      boxShadow: '0 2px 8px rgba(196,56,108,0.25)',
                    }}
                    onClick={e => e.preventDefault()}
                  >
                    <button
                      onClick={handleDecrease}
                      style={{
                        width: 26, height: 28, background: 'transparent', border: 'none',
                        color: '#FFFFFF', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{
                      minWidth: 18, textAlign: 'center',
                      fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF',
                      fontFamily: 'Outfit, sans-serif', userSelect: 'none',
                    }}>
                      {cartQty}
                    </span>
                    <button
                      onClick={handleIncrease}
                      style={{
                        width: 26, height: 28, background: 'transparent', border: 'none',
                        color: '#FFFFFF', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                ) : (
                  /* Add to cart pill button */
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '5px 11px',
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-strong)',
                      background: isHovered ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.06)' : '#FAF8F5'),
                      color: isHovered ? '#FFFFFF' : 'var(--text)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      fontFamily: 'Outfit, sans-serif',
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={handleCartClick}
                  >
                    <ShoppingBag size={12} />
                    <span>{needsDetailPage ? 'Options' : 'Add to Cart'}</span>
                  </button>
                )
              ) : (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#ef4444',
                  background: 'rgba(239,68,68,0.1)',
                  padding: '3px 8px',
                  borderRadius: 999,
                  letterSpacing: '0.02em',
                }}>
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
