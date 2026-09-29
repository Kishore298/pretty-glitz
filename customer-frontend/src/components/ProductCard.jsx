import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ProductCard = ({ product }) => {
  const { isDark } = useTheme();

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
          background: isDark ? '#1a1a2a' : '#f4f4f8',
          overflow: 'hidden',
          borderRadius: 16,
          marginBottom: 16,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}>
          {product.images && product.images[0] ? (
            <img 
              src={product.images[0].url} 
              alt={product.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="group-hover:scale-110"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '0.85rem'
            }}>
              No Image
            </div>
          )}
          
          {product.isFlagship && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: isDark ? 'rgba(8,8,16,0.7)' : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              color: isDark ? '#f0f0f8' : '#0f0f12',
              fontSize: '0.65rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 999,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              Flagship
            </div>
          )}

          {!product.inStock && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(239,68,68,0.9)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: '0.65rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 999,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
            }}>
              Out of Stock
            </div>
          )}
        </div>
        
        <div>
          <h3 style={{
            fontSize: '0.95rem', fontWeight: 600,
            color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            transition: 'color 0.2s',
          }}
          className="group-hover:text-prettyglitz"
          >
            {product.name}
          </h3>
          <p style={{
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {product.subcategoryId?.name || product.category}
          </p>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
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
