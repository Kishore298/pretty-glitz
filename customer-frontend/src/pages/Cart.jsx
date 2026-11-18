import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, ChevronRight, Lock } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import logoImg from '../assets/pretty-glitz-logo.png';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useContext(CartContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 'var(--nav-height, 76px)', paddingBottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `1px solid var(--border-strong)` }}>
            <span style={{ fontSize: '3rem' }}>🛍️</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Your Bag is Empty
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Looks like you haven't added anything yet. Discover our premium collections to find something beautiful.
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-gradient)',
            color: 'white',
            padding: '16px 36px', borderRadius: 12,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            textDecoration: 'none', fontSize: '0.85rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 8px 30px rgba(196,56,108,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(196,56,108,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(196,56,108,0.3)'; }}
          >
            Explore Collections
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--nav-height, 76px) + 16px)', paddingBottom: 100 }}>
      <div className="app-page-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="separator" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Shopping Bag</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, borderBottom: `1px solid var(--border)`, paddingBottom: 16 }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Shopping Bag
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          {/* Cart Items */}
          <div style={{ flex: '1 1 600px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: `1px solid var(--border)`, overflow: 'hidden' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <AnimatePresence>
                  {cartItems.map((item, idx) => {
                    const uniqueKey = `${item.product._id}-${item.size || 'none'}`;
                    const isLast = idx === cartItems.length - 1;
                    return (
                      <motion.li 
                        key={uniqueKey}
                        layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className="cart-item-row"
                        style={{
                          padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center',
                          borderBottom: isLast ? 'none' : `1px solid var(--border)`
                        }}
                      >
                        {/* Compact Thumbnail */}
                        <Link
                          to={`/product/${item.product._id}`}
                          className="cart-item-thumb-box"
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
                            src={item.product.images?.[0] ? optimizeImageUrl(item.product.images[0].url, 160) : logoImg}
                            alt={item.product.name}
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
                              objectFit: item.product.images?.[0] ? 'cover' : 'contain',
                              padding: item.product.images?.[0] ? 0 : '6px',
                            }}
                          />
                        </Link>

                        {/* Middle Info: Name, Price, Variations */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            to={`/product/${item.product._id}`}
                            style={{
                              fontSize: '0.81rem',
                              fontWeight: 600,
                              color: 'var(--text)',
                              textDecoration: 'none',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.22,
                              marginBottom: 3,
                            }}
                          >
                            {item.product.name}
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                              ₹{item.price || item.product.price}
                            </span>
                            {item.product.originalPrice && item.product.originalPrice > (item.price || item.product.price) && (
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{item.product.originalPrice}
                              </span>
                            )}
                            {(item.colorName || item.size) && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                {[item.colorName, item.size ? `Size ${item.size}` : null].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Quantity Stepper & Remove Trash Button (Inline Horizontal) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid var(--border)`, borderRadius: 6, height: 28, width: 80, background: 'var(--bg)' }}>
                            <button
                              onClick={() => updateQuantity(item.product._id, item.size, item.quantity - 1, item.pieceCount, item.colorVariantId)}
                              style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                            >
                              -
                            </button>
                            <span style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product._id, item.size, item.quantity + 1, item.pieceCount, item.colorVariantId)}
                              style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.product._id, item.size, item.pieceCount, item.colorVariantId)}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>
            
            <div style={{ marginTop: 24 }}>
              <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: '20px 22px',
                position: 'sticky',
                top: 100,
              }}
            >
              <h2
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 14px',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 10,
                }}
              >
                Order Summary
              </h2>
              
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{getCartTotal()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <span>Shipping</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 500, color: '#10B981' }}>Calculated on WhatsApp</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>₹{getCartTotal()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: 'var(--accent-gradient)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 6px 20px rgba(196,56,108,0.28)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,56,108,0.38)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,56,108,0.28)'; }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Lock size={12} /> Secure Ordering & Data Protection
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
