import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { CartContext } from '../context/CartContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

/**
 * WishlistItemRow - Sleek, horizontally compact card for Wishlist items
 */
const WishlistItemRow = ({ product }) => {
  const { toggleWishlist } = useWishlist();
  const { addToCart, isInCart } = useContext(CartContext);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const isBangleCategory =
    Boolean(product.category && /bangle/i.test(product.category)) ||
    Boolean(product.subcategory && /bangle/i.test(product.subcategory));

  const hasOptions =
    isBangleCategory ||
    Boolean(product.colorVariants && product.colorVariants.length > 0) ||
    Boolean(product.sizes && product.sizes.length > 0) ||
    Boolean(product.pieceCounts && product.pieceCounts.length > 0);

  const inCart = isInCart(product._id);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOptions) {
      navigate(`/product/${product._id}`);
      return;
    }
    addToCart(product, null, 1, null, product.price);
  };

  const imageSrc = product.images?.[0]
    ? optimizeImageUrl(product.images[0].url, 180)
    : logoImg;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="wishlist-horizontal-card"
      style={{
        background: isDark ? 'var(--bg-secondary, #161622)' : '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Thumbnail */}
      <Link
        to={`/product/${product._id}`}
        style={{
          width: 56,
          height: 64,
          borderRadius: 8,
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
        }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = logoImg;
            e.currentTarget.style.objectFit = 'contain';
            e.currentTarget.style.padding = '6px';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: product.images?.[0] ? 'cover' : 'contain',
            padding: product.images?.[0] ? 0 : '6px',
          }}
        />
      </Link>

      {/* Middle: Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/product/${product._id}`}
          style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--text)',
            textDecoration: 'none',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25,
            marginBottom: 3,
          }}
        >
          {product.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ₹{product.originalPrice}
            </span>
          )}
          {discountPercent > 0 && (
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                color: '#C4386C',
                background: 'rgba(196, 56, 108, 0.1)',
                padding: '1px 5px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleActionClick}
          style={{
            padding: '5px 12px',
            borderRadius: 7,
            fontSize: '0.75rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: inCart
              ? 'rgba(16, 185, 129, 0.15)'
              : 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
            color: inCart ? '#10B981' : '#FFFFFF',
            boxShadow: inCart ? 'none' : '0 2px 8px rgba(196, 56, 108, 0.28)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
            transition: 'all 0.18s ease',
          }}
        >
          {inCart ? (
            <>
              <ShoppingBag size={12} />
              <span>In Bag</span>
            </>
          ) : hasOptions ? (
            <span>Options</span>
          ) : (
            <>
              <ShoppingBag size={12} />
              <span>Add</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          title="Remove from Wishlist"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            border: '1px solid rgba(225, 29, 72, 0.2)',
            background: 'rgba(225, 29, 72, 0.08)',
            color: '#E11D48',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
        >
          <Heart size={14} style={{ fill: '#E11D48' }} />
        </button>
      </div>
    </motion.div>
  );
};

const Wishlist = () => {
  const { wishlist, getWishlistCount } = useWishlist();
  const { isDark } = useTheme();
  const count = getWishlistCount();

  return (
    <div
      className="wishlist-page-container"
      style={{
        minHeight: '80vh',
        paddingTop: 'calc(var(--nav-height, 76px) + 16px)',
        paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
        borderBottom: `1px solid var(--border)`,
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(225,29,72,0.15), rgba(196,56,108,0.15))',
            border: '1px solid rgba(225,29,72,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E11D48',
          }}>
            <Heart size={20} style={{ fill: '#E11D48' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: "'Cormorant Garamond', serif",
              margin: 0,
              color: 'var(--text)',
              letterSpacing: '0.02em',
            }}>
              My Wishlist
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: '2px 0 0',
            }}>
              {count === 0 ? 'No items saved yet' : `${count} item${count > 1 ? 's' : ''} saved for later`}
            </p>
          </div>
        </div>

        {count > 0 && (
          <Link
            to="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,17,24,0.04)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingBag size={16} />
            Go to Cart
          </Link>
        )}
      </div>

      {/* Empty State */}
      {count === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            maxWidth: 480,
            margin: '40px auto 0',
            borderRadius: 20,
            background: isDark ? 'rgba(20,20,28,0.6)' : 'rgba(255,255,255,0.8)',
            border: `1px solid var(--border)`,
            boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(225,29,72,0.1), rgba(196,56,108,0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#E11D48',
          }}>
            <Heart size={36} style={{ strokeWidth: 1.5 }} />
          </div>
          <h2 style={{
            fontSize: '1.4rem',
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 8,
          }}>
            Your Wishlist is Empty
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 28,
          }}>
            Explore our curated collections of artisanal bangles, jewels, and accessories. Tap the heart on any piece to save it here.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.95rem',
              padding: '12px 28px',
              borderRadius: 999,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(196,56,108,0.35)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            Explore Collections <ArrowRight size={16} />
          </Link>
        </motion.div>
      ) : (
        <div className="wishlist-horizontal-grid">
          <AnimatePresence>
            {wishlist.map((item) => {
              const product = typeof item === 'object' && item !== null ? item : null;
              if (!product || !product._id) return null;
              return (
                <WishlistItemRow
                  key={product._id}
                  product={product}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
