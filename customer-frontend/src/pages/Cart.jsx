import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext, resolveStock } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import { getProductUrl } from '../utils/urlHelper';
import logoImg from '../assets/pretty-glitz-logo.png';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, validateCartStock } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (validateCartStock) {
      validateCartStock();
    }
  }, [validateCartStock]);

  const hasOutOfStockItems = cartItems.some((item) => {
    const stock = resolveStock(item.product, item.size, item.colorVariantId);
    return !stock.isAvailable || item.stockStatus?.isAvailable === false;
  });

  const handleCheckout = () => {
    if (hasOutOfStockItems) return;
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
    <div className="cart-page" style={{ paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 32px)' }}>
      <div className="app-page-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Breadcrumb Pill */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, borderBottom: `1px solid var(--border)`, paddingBottom: 12 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Shopping Bag
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {/* Cart Items */}
          <div style={{ flex: '1 1 540px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: `1px solid var(--border)`, overflow: 'hidden' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <AnimatePresence>
                  {cartItems.map((item, idx) => {
                    const uniqueKey = item.variantKey || `${item.product._id}-${item.size || 'none'}-${item.colorVariantId || 'none'}`;
                    const isLast = idx === cartItems.length - 1;
                    const stock = resolveStock(item.product, item.size, item.colorVariantId);
                    const isOutOfStock = !stock.isAvailable || item.stockStatus?.isAvailable === false;
                    const maxStock = stock.isStockTracked ? stock.availableStock : (typeof item.stockStatus?.availableStock === 'number' ? item.stockStatus.availableStock : Infinity);
                    const isMaxReached = typeof maxStock === 'number' && isFinite(maxStock) && item.quantity >= maxStock;
                    const packagingLabel = item.packagingType || item.product?.packagingType
                      ? `${item.packagingQuantity || item.product?.packagingQuantity || 1} ${item.packagingType || item.product?.packagingType}`
                      : (item.pieceCount ? `${item.pieceCount} Pieces` : null);

                    return (
                      <motion.li 
                        key={uniqueKey}
                        layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className="cart-item-row"
                        style={{
                          padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
                          borderBottom: isLast ? 'none' : `1px solid var(--border)`,
                          background: isOutOfStock ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        }}
                      >
                        {/* Compact Thumbnail */}
                        <Link
                          to={getProductUrl(item.product)}
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
                            position: 'relative',
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
                              filter: isOutOfStock ? 'grayscale(0.8)' : 'none',
                            }}
                          />
                        </Link>

                        {/* Middle Info: Name, Price, Variations, Packaging, Stock Warnings */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            to={getProductUrl(item.product)}
                            style={{
                              fontSize: '0.81rem',
                              fontWeight: 600,
                              color: isOutOfStock ? 'var(--text-muted)' : 'var(--text)',
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
                            {(item.colorName || item.size || packagingLabel) && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                {[item.colorName, item.size ? `Size ${item.size}` : null, packagingLabel].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>

                          {/* Out of Stock or Quantity Cap Notice */}
                          {isOutOfStock ? (
                            <div style={{ marginTop: 4 }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#EF4444', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                ⚠️ Out of Stock — Please remove to checkout
                              </span>
                            </div>
                          ) : isMaxReached ? (
                            <div style={{ marginTop: 3 }}>
                              <span style={{ fontSize: '0.66rem', color: '#F59E0B', fontWeight: 600 }}>
                                Maximum stock reached ({maxStock} available)
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Right: Quantity Stepper & Remove Trash Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid var(--border)`, borderRadius: 6, height: 28, width: 80, background: 'var(--bg)' }}>
                            <button
                              onClick={() => updateQuantity(item.variantKey || item.product._id, item.size, item.quantity - 1, item.pieceCount, item.colorVariantId)}
                              style={{ flex: 1, height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                            >
                              -
                            </button>
                            <span style={{ flex: 1, textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantKey || item.product._id, item.size, item.quantity + 1, item.pieceCount, item.colorVariantId)}
                              disabled={isOutOfStock || isMaxReached}
                              title={isMaxReached ? `Only ${maxStock} in stock` : isOutOfStock ? 'Item is out of stock' : 'Add one more'}
                              style={{
                                flex: 1,
                                height: '100%',
                                background: 'none',
                                border: 'none',
                                cursor: isOutOfStock || isMaxReached ? 'not-allowed' : 'pointer',
                                color: isOutOfStock || isMaxReached ? 'var(--text-muted)' : 'var(--text-secondary)',
                                opacity: isOutOfStock || isMaxReached ? 0.35 : 1,
                                fontSize: '0.85rem',
                              }}
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.variantKey || item.product._id, item.size, item.pieceCount, item.colorVariantId)}
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
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '8px 22px',
                borderRadius: 999,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                e.currentTarget.style.color = 'var(--accent, #C4386C)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              >
                <ArrowLeft size={14} /> <span>Continue Shopping</span>
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
                padding: '18px 20px',
                position: 'sticky',
                top: 96,
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

              {hasOutOfStockItems && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#EF4444',
                    fontSize: '0.76rem',
                    marginBottom: 14,
                    lineHeight: 1.45,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>Some items are out of stock. Please remove them before checkout.</span>
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={hasOutOfStockItems}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: hasOutOfStockItems ? '#374151' : 'var(--accent-gradient)',
                  color: hasOutOfStockItems ? '#9CA3AF' : 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: hasOutOfStockItems ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: hasOutOfStockItems ? 0.7 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: hasOutOfStockItems ? 'none' : '0 6px 20px rgba(196,56,108,0.28)',
                }}
                onMouseEnter={e => {
                  if (!hasOutOfStockItems) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,56,108,0.38)';
                  }
                }}
                onMouseLeave={e => {
                  if (!hasOutOfStockItems) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,56,108,0.28)';
                  }
                }}
              >
                <span>{hasOutOfStockItems ? 'Resolve Out of Stock Items' : 'Proceed to Checkout'}</span>
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
