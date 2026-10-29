import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Heart, ShoppingBag, LogOut, MessageCircle, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';

const Account = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const { getWishlistCount } = useWishlist();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Please log in to view your account.</p>
          <Link
            to="/login"
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              background: 'var(--accent-gradient)',
              color: '#FFF',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '80vh',
      paddingTop: 'calc(76px + 28px)',
      paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
      maxWidth: 800,
      margin: '0 auto',
      paddingLeft: 20,
      paddingRight: 20,
    }}>
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF',
          border: `1px solid var(--border)`,
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(26,17,24,0.05)',
          marginBottom: 24,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C4386C, #8A2BE2, #C9A84C)',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(196,56,108,0.3)',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: isDark ? '#14141C' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <User size={26} />
              </div>
            </div>

            <div>
              <h1 style={{
                fontSize: '1.45rem',
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
              }}>
                {user.name || 'PrettyGlitz Customer'}
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginTop: 3,
              }}>
                <Phone size={14} />
                <span>+91 {user.mobile}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Quick Action Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Wishlist Tile */}
        <Link
          to="/wishlist"
          style={{
            textDecoration: 'none',
            background: isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF',
            border: `1px solid var(--border)`,
            borderRadius: 16,
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(225,29,72,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E11D48',
            }}>
              <Heart size={20} style={{ fill: '#E11D48' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                My Wishlist
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {wishlistCount} item{wishlistCount !== 1 ? 's' : ''} saved
              </div>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>

        {/* Cart Tile */}
        <Link
          to="/cart"
          style={{
            textDecoration: 'none',
            background: isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF',
            border: `1px solid var(--border)`,
            borderRadius: 16,
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(196,56,108,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                Shopping Cart
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
              </div>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>

      {/* Support / WhatsApp Card */}
      {IS_WHATSAPP_CONFIGURED && (
        <div style={{
          background: isDark ? 'rgba(37,211,102,0.06)' : 'rgba(37,211,102,0.04)',
          border: '1px solid rgba(37,211,102,0.25)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
            }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                Need Help with an Order?
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Chat with our jewellery styling team directly on WhatsApp.
              </div>
            </div>
          </div>

          <a
            href={getWhatsAppUrl() || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 999,
              background: '#25D366',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
            }}
          >
            Chat on WhatsApp <ArrowRight size={15} />
          </a>
        </div>
      )}
    </div>
  );
};

export default Account;
