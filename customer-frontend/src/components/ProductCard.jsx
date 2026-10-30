import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ShoppingBag, Plus, Minus, Sparkles, Heart } from 'lucide-react';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductCard = ({ product, showVariants = false }) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const { addToCart, updateQuantity, removeFromCart, isInCart, getCartItemQuantity } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(product._id);
  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[activeImgIndex] || images[0];

  const handleTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX || !touchEndX || !hasMultipleImages) return;
    const distance = touchStartX - touchEndX;
    if (distance > 35) {
      // Swiped left -> next photo
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    } else if (distance < -35) {
      // Swiped right -> prev photo
      setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

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
        {/* Image Container with Mobile Touch Swipe */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            background: isDark ? '#161622' : '#F7F5F2',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: hasMultipleImages ? 4 : 6,
            transition: 'background 0.35s ease',
            touchAction: hasMultipleImages ? 'pan-y' : 'auto',
          }}
        >
          {currentImage ? (
            <img
              src={optimizeImageUrl(currentImage.url, 400)}
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = logoImg;
                e.currentTarget.style.objectFit = 'contain';
                e.currentTarget.style.padding = '20px';
              }}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
              background: isDark ? 'rgba(255,255,255,0.02)' : '#FBF9F6',
            }}>
              <img
                src={logoImg}
                alt="PrettyGlitz"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  opacity: 0.9,
                  filter: 'contrast(1.04)',
                }}
              />
            </div>
          )}

          {/* Dots Indicator for Mobile Swipe */}
          {hasMultipleImages && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
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
                    width: i === activeImgIndex ? 12 : 5,
                    height: 5,
                    borderRadius: 999,
                    background: i === activeImgIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
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
                fontSize: '8px', fontWeight: 800, padding: '3px 7px',
                borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(184,134,11,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}>
                <Sparkles size={9} /> Bestseller
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

          {/* Bottom-Right Wishlist Button */}
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
              bottom: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: isDark ? 'rgba(20,20,28,0.78)' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${inWishlist ? 'rgba(225,29,72,0.35)' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              color: inWishlist ? '#E11D48' : (isDark ? '#F5F0EA' : '#1A1118'),
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, border-color 0.2s',
              boxShadow: inWishlist ? '0 2px 8px rgba(225,29,72,0.35)' : '0 2px 6px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Heart
              size={15}
              style={{
                fill: inWishlist ? '#E11D48' : 'transparent',
                stroke: inWishlist ? '#E11D48' : 'currentColor',
                strokeWidth: 2,
                transition: 'fill 0.2s ease, stroke 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Amazon-style Multiple Images Thumbnails Strip */}
        {hasMultipleImages && (
          <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              overflowX: 'auto',
              padding: '3px 0 6px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
                onMouseEnter={() => setActiveImgIndex(idx)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  overflow: 'hidden',
                  padding: 0,
                  border: `1.5px solid ${activeImgIndex === idx ? 'var(--accent, #C4386C)' : 'var(--border)'}`,
                  boxShadow: activeImgIndex === idx ? '0 0 0 1px var(--accent, #C4386C)' : 'none',
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  opacity: activeImgIndex === idx ? 1 : 0.65,
                }}
                aria-label={`View photo ${idx + 1}`}
              >
                <img
                  src={optimizeImageUrl(img.url, 100)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
            {images.length > 5 && (
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0 2px' }}>
                +{images.length - 5}
              </span>
            )}
          </div>
        )}

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

          <h3 className="product-card-title" style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '1.02rem',
            fontWeight: 600,
            lineHeight: 1.25,
            color: isHovered ? 'var(--accent)' : 'var(--text)',
            margin: '0 0 6px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.2s ease',
            width: '100%',
          }}>
            {product.name}
          </h3>

          {/* Variant Indicators & Stock Badge (Rich Mode) */}
          {showVariants && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              alignItems: 'center',
              margin: '3px 0 6px',
              width: '100%',
            }}>
              {product.sizes?.length > 0 && (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.05)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  Sizes: {product.sizes.map(s => s.size).join(', ')}
                </span>
              )}
              {product.pieceCounts?.length > 0 && (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.05)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {product.pieceCounts.map(p => `${p.count}P`).join(', ')}
                </span>
              )}
              {product.inStock && typeof product.inStockCount === 'number' && product.inStockCount <= 5 && product.inStockCount > 0 ? (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#D97706',
                  background: 'rgba(217,119,6,0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}>
                  Only {product.inStockCount} left
                </span>
              ) : product.inStock ? (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: '#10B981',
                  background: 'rgba(16,185,129,0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}>
                  In Stock
                </span>
              ) : null}
            </div>
          )}

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
            <div className="product-card-prices">
              <span className="product-card-price-current">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="product-card-price-original">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            <div style={{ flexShrink: 0 }}>
              {product.inStock ? (
                inCart && !needsDetailPage ? (
                  /* Quantity stepper */
                  <div
                    className="product-card-stepper"
                    onClick={e => e.preventDefault()}
                  >
                    <button
                      onClick={handleDecrease}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} />
                    </button>
                    <span>
                      {cartQty}
                    </span>
                    <button
                      onClick={handleIncrease}
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                ) : (
                  /* Add to cart pill button */
                  <button
                    className="product-card-btn"
                    style={{
                      border: '1px solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-strong)',
                      background: isHovered ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.06)' : '#FAF8F5'),
                      color: isHovered ? '#FFFFFF' : 'var(--text)',
                    }}
                    onClick={handleCartClick}
                  >
                    <ShoppingBag size={11} />
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
