import React, { useState, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ShoppingBag, Plus, Minus, Sparkles, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductUrl } from '../utils/urlHelper';
import { sortSizesAscending } from '../utils/sizeHelper';
import ProductImageModal from './ProductImageModal';
import logoImg from '../assets/pretty-glitz-logo.png';

const ProductCard = ({ product, showVariants = false }) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const touchRef = useRef({ startX: 0, endX: 0, didSwipe: false });
  const [isEnlargedModalOpen, setIsEnlargedModalOpen] = useState(false);

  const { addToCart, updateQuantity, removeFromCart, isInCart, getCartItemQuantity } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(product._id);
  const images = (product?.images && product.images.length > 0)
    ? product.images
    : (product?.image ? [{ url: product.image }] : []);
  const hasMultipleImages = images.length > 1;
  const currentImage = images[activeImgIndex] || images[0];

  const handleTouchStart = (e) => {
    touchRef.current.startX = e.targetTouches[0].clientX;
    touchRef.current.endX = e.targetTouches[0].clientX;
    touchRef.current.didSwipe = false;
  };

  const handleTouchMove = (e) => {
    const x = e.targetTouches[0].clientX;
    touchRef.current.endX = x;
    if (Math.abs(x - touchRef.current.startX) > 10) {
      touchRef.current.didSwipe = true;
    }
  };

  const handleTouchEnd = () => {
    if (!hasMultipleImages) return;
    const distance = touchRef.current.startX - touchRef.current.endX;
    if (Math.abs(distance) > 35) {
      touchRef.current.didSwipe = true;
      if (distance > 35) {
        setActiveImgIndex((prev) => (prev + 1) % images.length);
      } else {
        setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const handleImageClick = (e) => {
    if (touchRef.current.didSwipe) {
      e.preventDefault();
      e.stopPropagation();
      touchRef.current.didSwipe = false;
      return;
    }
    // Allow default click to navigate to the product detail page via the parent Link
  };

  // Standardise all products belonging to any bangle category, or having variations/sizes/pieces to 'Options'
  const isBangleCategory =
    Boolean(product.category && /bangle/i.test(product.category)) ||
    Boolean(product.subcategory && /bangle/i.test(product.subcategory));

  const hasOptions =
    isBangleCategory ||
    Boolean(product.colorVariants && product.colorVariants.length > 0) ||
    Boolean(product.sizes && product.sizes.length > 0) ||
    Boolean(product.pieceCounts && product.pieceCounts.length > 0);

  const needsDetailPage = hasOptions;

  const inCart = isInCart(product._id);
  const cartQty = getCartItemQuantity(product._id);

  // Authoritative out-of-stock check (Scenario A: tracked 0 stock; Scenario B: inStock false)
  const isOutOfStock = !product.inStock || (typeof product.inStockCount === 'number' && product.inStockCount <= 0);
  const isMaxReached = typeof product.inStockCount === 'number' && cartQty >= product.inStockCount;

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (needsDetailPage) {
      navigate(getProductUrl(product));
      return;
    }
    addToCart(product, null, 1, null, product.price);
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (needsDetailPage) { navigate(getProductUrl(product)); return; }
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
    <>
      <Link to={getProductUrl(product)} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isHovered ? 'var(--accent-gold)' : 'var(--border)',
          borderRadius: 14,
          padding: 7,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease',
          boxShadow: isHovered
            ? (isDark ? '0 10px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.2)' : '0 10px 24px -4px rgba(26,17,24,0.1), 0 0 0 1px rgba(184,134,11,0.15)')
            : (isDark ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(26,17,24,0.03)'),
          transform: isHovered ? 'translateY(-3px)' : 'none',
          height: 'auto',
        }}
      >
        {/* Image Container with Mobile Touch Swipe & Detail Page Navigation */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
          style={{
            position: 'relative',
            aspectRatio: '1 / 1',
            background: isDark ? '#161622' : '#F7F5F2',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 6,
            transition: 'background 0.35s ease',
            touchAction: hasMultipleImages ? 'pan-y' : 'auto',
            cursor: 'pointer',
          }}
        >
          {currentImage ? (
            <img
              src={optimizeImageUrl(currentImage.url, 400)}
              alt={product.name}
              loading="lazy"
              decoding="async"
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

          {/* Desktop Hover Navigation Chevron Arrows */}
          {hasMultipleImages && isHovered && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                aria-label="Previous photo"
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(10, 10, 16, 0.72)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.95)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.72)')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev + 1) % images.length);
                }}
                aria-label="Next photo"
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(10, 10, 16, 0.72)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196, 56, 108, 0.95)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(10, 10, 16, 0.72)')}
              >
                <ChevronRight size={16} />
              </button>
            </>
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


          {/* Bottom-Right Wishlist Button (Pure Heart Icon, Completely Transparent, No Shadow/Halo/BG) */}
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
              bottom: 6,
              right: 8,
              background: 'transparent',
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              filter: 'none',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 4,
              outline: 'none',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
              const heart = e.currentTarget.querySelector('svg');
              if (heart && !inWishlist) heart.style.stroke = '#E11D48';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              const heart = e.currentTarget.querySelector('svg');
              if (heart && !inWishlist) heart.style.stroke = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(35, 28, 33, 0.65)';
            }}
          >
            <Heart
              size={19}
              style={{
                fill: inWishlist ? '#E11D48' : 'rgba(255, 255, 255, 0.65)',
                stroke: inWishlist ? '#E11D48' : (isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(35, 28, 33, 0.65)'),
                strokeWidth: 1.6,
                transition: 'fill 0.2s ease, stroke 0.2s ease',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.14))',
              }}
            />
          </button>
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
            marginBottom: 1,
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
            lineHeight: 1.18,
            color: isHovered ? 'var(--accent)' : 'var(--text)',
            margin: '0 0 2px',
            display: 'block',
            overflow: 'visible',
            wordBreak: 'break-word',
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
              margin: '2px 0 3px',
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
                  Sizes: {sortSizesAscending(product.sizes).map(s => s.size).join(', ')}
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
            marginTop: 2,
            width: '100%',
            gap: 6,
            paddingTop: 0,
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
              {!isOutOfStock ? (
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
                      disabled={isMaxReached}
                      aria-label="Increase quantity"
                      style={{
                        opacity: isMaxReached ? 0.35 : 1,
                        cursor: isMaxReached ? 'not-allowed' : 'pointer',
                      }}
                      title={isMaxReached ? `Only ${product.inStockCount} in stock` : 'Add one more'}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                ) : (
                  /* Add to cart pill button */
                  <button
                    className="product-card-btn"
                    style={{
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: isHovered ? 'var(--accent)' : 'var(--border-strong)',
                      background: isHovered ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.06)' : '#FAF8F5'),
                      color: isHovered ? '#FFFFFF' : 'var(--text)',
                    }}
                    onClick={handleCartClick}
                  >
                    <ShoppingBag size={11} />
                    <span>{needsDetailPage ? 'Options' : 'Add'}</span>
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

    {/* Enlarged Product Image Lightbox Modal (mounted only when opened) */}
    {isEnlargedModalOpen && (
      <ProductImageModal
        isOpen={isEnlargedModalOpen}
        onClose={() => setIsEnlargedModalOpen(false)}
        product={product}
        images={images}
        initialIndex={activeImgIndex}
        showViewDetails={true}
        aspectRatio="1 / 1"
      />
    )}
  </>
  );
};

export default React.memo(ProductCard);
