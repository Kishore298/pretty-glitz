import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ShoppingBag } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { isDark } = useTheme();

  // Calculate discount percentage
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer block"
    >
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
        <div style={{
          position: 'relative',
          aspectRatio: '4/5',
          background: isDark ? '#1C1C2E' : '#F5F0EA',
          overflow: 'hidden',
          borderRadius: 16,
          marginBottom: 16,
          border: `1px solid ${isDark ? 'rgba(245,240,234,0.05)' : 'rgba(26,17,24,0.06)'}`,
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>
          {product.images && product.images[0] ? (
            <img 
              src={optimizeImageUrl(product.images[0].url, 400)} 
              alt={product.name}
              loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="group-hover:scale-110"
            />
          ) : (
            <div className="no-image-placeholder">
              <div className="pg-monogram">PG</div>
              <span>Photo Coming Soon</span>
            </div>
          )}
          
          {/* Discount badge */}
          {discountPercent > 0 && (
            <div className="discount-badge">
              {discountPercent}% OFF
            </div>
          )}

          {/* Flagship badge */}
          {product.isFlagship && !discountPercent && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: isDark ? 'rgba(10,10,15,0.7)' : 'rgba(253,251,247,0.85)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              color: isDark ? '#F5F0EA' : '#1A1118',
              fontSize: '0.65rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 999,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 2,
            }}>
              Flagship
            </div>
          )}

          {!product.inStock && (
            <div style={{
              position: 'absolute', top: 12, right: discountPercent > 0 ? undefined : 12,
              left: discountPercent > 0 ? 12 : undefined,
              background: 'rgba(239,68,68,0.9)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: '0.65rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 999,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
              zIndex: 2,
            }}>
              Out of Stock
            </div>
          )}

          {/* Hover overlay with quick action */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px',
            background: isDark 
              ? 'linear-gradient(to top, rgba(10,10,15,0.85), transparent)'
              : 'linear-gradient(to top, rgba(26,17,24,0.6), transparent)',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end',
            opacity: 0, transition: 'opacity 0.3s ease',
            zIndex: 2,
          }} className="group-hover:!opacity-100">
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1A1118',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}>
              <ShoppingBag size={16} />
            </div>
          </div>
        </div>
        
        <div>
          <h3 style={{
            fontSize: '0.95rem', fontWeight: 600,
            color: 'var(--text)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            lineHeight: '1.3', minHeight: '2.6em',
            transition: 'color 0.2s',
            margin: 0,
          }}>
            {product.name}
          </h3>
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
            marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
          }}>
            {product.subcategoryId?.name || product.category}
          </p>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
