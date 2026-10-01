import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useContext(CartContext);

  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const cardBg = isDark ? '#1a1a2a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `1px solid ${cardBorder}` }}>
            <span style={{ fontSize: '3rem' }}>🛍️</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Cart is Empty
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Looks like you haven't added anything yet. Discover our premium collections to find something beautiful.
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: isDark ? '#fff' : '#0f0f12',
            color: isDark ? '#000' : '#fff',
            padding: '16px 36px', borderRadius: 12,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            textDecoration: 'none', fontSize: '0.85rem',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', marginBottom: 40, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>
          Shopping Bag
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          {/* Cart Items */}
          <div style={{ flex: '1 1 600px' }}>
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <AnimatePresence>
                  {cartItems.map((item, idx) => {
                    const uniqueKey = `${item.product._id}-${item.size || 'none'}`;
                    const isLast = idx === cartItems.length - 1;
                    return (
                      <motion.li 
                        key={uniqueKey}
                        layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        style={{
                          padding: '24px 32px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
                          borderBottom: isLast ? 'none' : `1px solid ${cardBorder}`
                        }}
                      >
                        <div style={{ width: 100, height: 120, borderRadius: 12, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                          {item.product.images?.[0] ? (
                            <img src={optimizeImageUrl(item.product.images[0].url, 200)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Img</span>
                          )}
                        </div>

                        <div style={{ flex: '1 1 200px' }}>
                          <Link to={`/product/${item.product._id}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                            {item.product.name}
                          </Link>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
                            {item.product.category}
                          </p>
                          
                          {item.size && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                              Size: <span style={{ fontWeight: 600, color: 'var(--text)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>{item.size}</span>
                            </p>
                          )}
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginTop: 12, fontFamily: 'Outfit, sans-serif' }}>
                            ₹{item.product.price}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid var(--border-strong)`, borderRadius: 8, height: 40, width: 110 }}>
                            <button onClick={() => updateQuantity(item.product._id, item.size, item.quantity - 1)} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>-</button>
                            <span style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product._id, item.size, item.quantity + 1)} style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>+</button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.product._id, item.size)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ flex: '1 1 350px', maxWidth: 450 }}>
            <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${cardBorder}`, padding: 32, position: 'sticky', top: 120 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 24px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: 16 }}>
                Order Summary
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderBottom: `1px solid ${cardBorder}`, paddingBottom: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{getCartTotal()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Shipping</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Calculated on WhatsApp</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>₹{getCartTotal()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                style={{
                  width: '100%', padding: '18px', background: 'linear-gradient(135deg, #FF1493, #8A2BE2)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 8px 30px rgba(138,43,226,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,43,226,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(138,43,226,0.3)'; }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Secure ordering via WhatsApp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
