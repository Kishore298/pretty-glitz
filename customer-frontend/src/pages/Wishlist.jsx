import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const { wishlist, getWishlistCount } = useWishlist();
  const { isDark } = useTheme();
  const count = getWishlistCount();

  return (
    <div style={{
      minHeight: '80vh',
      paddingTop: 'calc(76px + 24px)',
      paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
      maxWidth: 1280,
      margin: '0 auto',
      paddingLeft: 20,
      paddingRight: 20,
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 28,
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
        /* Products Grid */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
          }}
          className="wishlist-grid"
        >
          {wishlist.map((item) => {
            // item may be populated product or product object
            const product = typeof item === 'object' && item !== null ? item : null;
            if (!product || !product._id) return null;
            return (
              <ProductCard
                key={product._id}
                product={product}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Wishlist;
