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
    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
          border: '1px solid',
          borderColor: isHovered ? 'var(--accent)' : 'var(--border)',
          borderRadius: 12,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? (isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)') : 'none',
          height: '100%',
        }}
      >
        {/* Image Container */}
        <div style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: isDark ? '#1A1A24' : '#F7F5F2',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 8,
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
                transition: 'transform 0.4s ease',
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
                background: 'linear-gradient(135deg, #EC168C, #9B3DFF)',
                color: '#FFF', fontSize: '10px', fontWeight: 700,
                padding: '4px 7px', borderRadius: 999,
              }}>
                {discountPercent}% OFF
              </span>
            )}
            {product.isBestseller && !discountPercent && (
              <span style={{
                background: 'linear-gradient(135deg, #D6A85F, #F2C97A)',
                color: '#3D2000',
                fontSize: '9px', fontWeight: 800, padding: '3px 6px',
                borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>
                Best Seller
              </span>
            )}
            {!product.inStock && (
              <span style={{
                background: '#ef4444', color: '#FFF',
                fontSize: '9px', fontWeight: 800, padding: '3px 6px',
                borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 4px' }}>
          <span style={{
            fontSize: '0.65rem', color: isHovered ? '#D51B86' : 'var(--text-muted)',
            marginBottom: 4, textTransform: 'uppercase', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.15s ease'
          }}>
            {product.subcategoryId?.name || product.category}
          </span>

          <h3 style={{
            fontSize: '0.85rem', fontWeight: 600, color: isHovered ? '#D51B86' : 'var(--text)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', lineHeight: '1.3', marginBottom: 8,
            transition: 'color 0.15s ease', flex: 1
          }}>
            {product.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginTop: 2 }}>
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Cart controls */}
            {product.inStock && (
              inCart && !needsDetailPage ? (
                /* Quantity stepper */
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    background: 'var(--accent-gradient)',
                    borderRadius: 8, overflow: 'hidden',
                    height: 32,
                  }}
                  onClick={e => e.preventDefault()}
                >
                  <button
                    onClick={handleDecrease}
                    style={{
                      width: 28, height: 32, background: 'transparent', border: 'none',
                      color: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{
                    minWidth: 20, textAlign: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: 'white',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {cartQty}
                  </span>
                  <button
                    onClick={handleIncrease}
                    style={{
                      width: 28, height: 32, background: 'transparent', border: 'none',
                      color: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                /* Add to cart button */
                <button
                  style={{
                    background: isHovered ? 'var(--text)' : 'var(--bg-secondary)',
                    color: isHovered ? 'var(--bg)' : 'var(--text)',
                    border: `1px solid ${isHovered ? 'var(--text)' : 'var(--border)'}`,
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                  }}
                  onClick={handleCartClick}
                >
                  <ShoppingBag size={14} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
