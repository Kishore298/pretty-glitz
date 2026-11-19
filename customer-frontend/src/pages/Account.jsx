import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Heart, ShoppingBag, LogOut, MessageCircle, ArrowRight, Package, Truck, ExternalLink, Copy, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';
import api from '../utils/api';

const Account = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const { getWishlistCount } = useWishlist();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyTracking = (trackingId) => {
    if (!trackingId) return;
    try {
      navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // fallback
    }
  };

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  useEffect(() => {
    if (user) {
      api.get('/orders/my-orders')
        .then(res => setOrders(res.data.orders || []))
        .catch(err => console.error('Failed to load orders', err))
        .finally(() => setLoadingOrders(false));
    } else {
      setLoadingOrders(false);
    }
  }, [user]);

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
    <div
      className="account-page-container"
      style={{
        minHeight: '80vh',
        paddingTop: 'calc(var(--nav-height, 76px) + 16px)',
        paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 40px)',
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
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

      {/* My Orders & Delivery Tracking Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            My Orders & Tracking
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingOrders ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: isDark ? 'var(--bg-secondary)' : '#FFF', borderRadius: 16, border: '1px solid var(--border)' }}>
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            background: isDark ? 'var(--bg-secondary)' : '#FFF',
            borderRadius: 16,
            border: '1px solid var(--border)',
          }}>
            <Package size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text)' }}>No orders placed yet</p>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Browse our collections and place your first handcrafted order.</p>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 999,
                background: 'var(--accent-gradient)',
                color: '#FFF',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Explore Shop <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map((ord) => {
              const isDispatched = ord.status === 'DISPATCHED';
              const statusColors = {
                PENDING: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
                PENDING_WHATSAPP: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
                CONFIRMED: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)' },
                PROCESSING: { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899', border: 'rgba(236, 72, 153, 0.25)' },
                DISPATCHED: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
                DELIVERED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.25)' },
                CANCELLED: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' },
              };
              const sColor = statusColors[ord.status] || statusColors.PENDING;

              return (
                <div
                  key={ord._id}
                  style={{
                    background: isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF',
                    border: `1px solid var(--border)`,
                    borderRadius: 16,
                    padding: '18px 20px',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                        Order #{ord.orderId}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: sColor.bg,
                          color: sColor.text,
                          border: `1px solid ${sColor.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                        ₹{ord.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: isDispatched && ord.trackingId ? 14 : 4 }}>
                    {ord.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                          {it.name} {it.size ? `(${it.size})` : ''} {it.colorName ? `• ${it.colorName}` : ''} <span style={{ color: 'var(--text-muted)' }}>× {it.quantity}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                          ₹{it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ST Courier Tracking Details Card */}
                  {ord.trackingId ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                          <Truck size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                            {ord.courierPartner || 'ST Courier'} Tracking Number
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <span style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                              {ord.trackingId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(ord.trackingId)}
                              title="Copy Tracking ID"
                              style={{
                                background: copiedId === ord.trackingId ? 'rgba(16, 185, 129, 0.15)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                border: `1px solid ${copiedId === ord.trackingId ? '#10B981' : 'var(--border)'}`,
                                color: copiedId === ord.trackingId ? '#10B981' : 'var(--text)',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {copiedId === ord.trackingId ? (
                                <>
                                  <Check size={12} /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={12} /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <a
                        href={`https://stcourier.com/track?tracking_no=${encodeURIComponent(ord.trackingId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 16px',
                          borderRadius: 9,
                          background: '#8B5CF6',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Track on ST Courier <ExternalLink size={13} />
                      </a>
                    </div>
                  ) : isDispatched ? (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                      }}
                    >
                      📦 Your parcel is dispatched. ST Courier tracking details will appear here shortly.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
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
