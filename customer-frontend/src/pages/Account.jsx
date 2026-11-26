import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone,
  Heart,
  ShoppingBag,
  LogOut,
  MessageCircle,
  ArrowRight,
  Package,
  Truck,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Plus,
  Bell,
  CheckCheck,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';
import api from '../utils/api';
import AddressModal from '../components/AddressModal';
import AddressCard from '../components/AddressCard';

const Account = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const { getWishlistCount } = useWishlist();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount: notifCount, markAsRead, markAllAsRead } = useNotifications();

  // Unified hub active section: 'orders' | 'addresses' | 'updates'
  const [activeTab, setActiveTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Address book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/customer/addresses');
      if (res.data?.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleSetDefaultAddress = async (addr) => {
    try {
      const res = await api.put(`/customer/addresses/${addr._id}/default`);
      if (res.data?.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const handleDeleteAddress = async (addr) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.delete(`/customer/addresses/${addr._id}`);
      if (res.data?.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  const handleAddressSaved = (savedAddr, updatedList) => {
    if (updatedList) {
      setAddresses(updatedList);
    } else {
      fetchAddresses();
    }
  };

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
        .then((res) => setOrders(res.data.orders || []))
        .catch((err) => console.error('Failed to load orders', err))
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
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Please log in to view your account.
          </p>
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

  const displayName = (user.name || 'PrettyGlitz Member').trim();
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const surfaceBg = isDark ? 'var(--bg-secondary, #14141C)' : '#FFFFFF';
  const surfaceShadow = isDark
    ? '0 12px 32px rgba(0, 0, 0, 0.36)'
    : '0 8px 28px rgba(196, 56, 108, 0.06), 0 2px 8px rgba(26, 17, 24, 0.03)';

  return (
    <div
      className="account-page-container"
      style={{
        minHeight: '82vh',
        paddingTop: 'calc(var(--nav-height, 76px) + 12px)',
        paddingBottom: 'calc(var(--bottom-nav-total-height, 60px) + 36px)',
        paddingLeft: 18,
        paddingRight: 18,
        maxWidth: 860,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Back Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Go back"
          title="Go back"
          className="account-back-btn"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span
          style={{
            fontSize: '0.84rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.02em',
          }}
        >
          My Account
        </span>
      </div>

      {/* ── 1. Unified Member Identity Shell + Integrated Quick Strip ───────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{
          background: surfaceBg,
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: surfaceShadow,
          marginBottom: 18,
        }}
      >
        {/* Top Identity Header */}
        <div
          style={{
            padding: '22px 22px 20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(196, 56, 108, 0.14) 0%, rgba(138, 43, 226, 0.08) 55%, rgba(201, 168, 76, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(196, 56, 108, 0.06) 0%, rgba(255, 250, 245, 0.85) 55%, rgba(201, 168, 76, 0.08) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {/* Monogram Avatar */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C4386C, #8A2BE2, #C9A84C)',
                padding: 2,
                flexShrink: 0,
                boxShadow: '0 6px 18px rgba(196, 56, 108, 0.28)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: isDark ? '#14141C' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--accent, #C4386C)',
                }}
              >
                {avatarInitial}
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold, #C9A84C)',
                  marginBottom: 2,
                }}
              >
                <Sparkles size={11} />
                <span>PrettyGlitz Member</span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                  lineHeight: 1.15,
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  marginTop: 3,
                }}
              >
                <Phone size={12} />
                <span>+91 {user.mobile}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FFFFFF',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#EF4444',
              fontSize: '0.80rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Integrated 3-Column Summary & Quick Links Bar */}
        <div
          className="account-quick-strip"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="account-quick-cell"
            style={{
              background: activeTab === 'orders'
                ? (isDark ? 'rgba(196, 56, 108, 0.08)' : 'rgba(196, 56, 108, 0.04)')
                : 'transparent',
              borderRight: '1px solid var(--border)',
              borderTop: 'none',
              borderBottom: 'none',
              borderLeft: 'none',
            }}
          >
            <div className="account-quick-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <Package size={16} />
            </div>
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div className="account-quick-value">{orders.length}</div>
              <div className="account-quick-label">Orders</div>
            </div>
          </button>

          <Link
            to="/wishlist"
            className="account-quick-cell"
            style={{
              textDecoration: 'none',
              borderRight: '1px solid var(--border)',
            }}
          >
            <div className="account-quick-icon" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}>
              <Heart size={16} style={{ fill: wishlistCount > 0 ? '#E11D48' : 'none' }} />
            </div>
            <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
              <div className="account-quick-value">{wishlistCount}</div>
              <div className="account-quick-label">Wishlist</div>
            </div>
            <ChevronRight size={14} className="account-quick-chevron" />
          </Link>

          <Link
            to="/cart"
            className="account-quick-cell"
            style={{
              textDecoration: 'none',
            }}
          >
            <div className="account-quick-icon" style={{ background: 'rgba(196, 56, 108, 0.12)', color: 'var(--accent, #C4386C)' }}>
              <ShoppingBag size={16} />
            </div>
            <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
              <div className="account-quick-value">{cartCount}</div>
              <div className="account-quick-label">My Bag</div>
            </div>
            <ChevronRight size={14} className="account-quick-chevron" />
          </Link>
        </div>
      </motion.section>

      {/* ── 2. Unified Account Hub (Segmented Tabs: Orders / Addresses / Updates) ── */}
      <section
        style={{
          background: surfaceBg,
          border: '1px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: surfaceShadow,
          marginBottom: 18,
        }}
      >
        {/* Tab Bar Header (All 3 pills fit cleanly without horizontal scrolling) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
            padding: '10px 10px',
            borderBottom: '1px solid var(--border)',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(250, 246, 238, 0.6)',
          }}
        >
          {[
            { id: 'orders', label: 'Orders', count: orders.length, icon: Package },
            { id: 'addresses', label: 'Addresses', count: addresses.length, icon: MapPin },
            { id: 'updates', label: 'Updates', count: notifications.length, unread: notifCount, icon: Bell },
          ].map(({ id, label, count, unread, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`account-hub-tab ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                <span className={`account-tab-pill ${isActive ? 'is-active' : ''}`}>
                  {count}
                </span>
                {unread > 0 && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isActive ? '#FFFFFF' : '#C4386C',
                      flexShrink: 0,
                    }}
                    title={`${unread} unread`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Hub Body */}
        <div style={{ padding: '20px 20px 22px' }}>
          {/* ── TAB 1: ORDERS & TRACKING ── */}
          {activeTab === 'orders' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.22rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text)',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    Orders & Delivery Tracking
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {orders.length === 0
                      ? 'Track shipments and order milestones once placed'
                      : `${orders.length} order${orders.length !== 1 ? 's' : ''} in your history`}
                  </p>
                </div>
              </div>

              {loadingOrders ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="account-empty-state">
                  <div className="account-empty-icon">
                    <Package size={24} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.96rem', color: 'var(--text)' }}>
                    No orders placed yet
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320 }}>
                    Explore our handcrafted bangles & bridal jewellery to place your first order.
                  </p>
                  <Link to="/products" className="account-cta-btn" style={{ textDecoration: 'none' }}>
                    <span>Explore Collection</span>
                    <ArrowRight size={14} />
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
                          background: isDark ? 'rgba(255, 255, 255, 0.025)' : '#FAF8F5',
                          border: '1px solid var(--border)',
                          borderRadius: 14,
                          padding: '16px 18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 10,
                            marginBottom: 12,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: 10,
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>
                              Order #{ord.orderId}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: '0.70rem',
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: isDispatched && ord.trackingId ? 14 : 2 }}>
                          {ord.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', gap: 10 }}>
                              <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                                {it.name} {it.size ? `(${it.size})` : ''} {it.colorName ? `• ${it.colorName}` : ''}{' '}
                                <span style={{ color: 'var(--text-muted)' }}>× {it.quantity}</span>
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking Card */}
                        {ord.trackingId ? (
                          <div
                            style={{
                              marginTop: 12,
                              padding: '12px 14px',
                              borderRadius: 12,
                              background: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                                <Truck size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.70rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                  {ord.courierPartner || 'ST Courier'} Tracking ID
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
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
                                      padding: '2px 7px',
                                      borderRadius: 6,
                                      fontSize: '0.70rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    {copiedId === ord.trackingId ? (
                                      <>
                                        <Check size={11} /> Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} /> Copy
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
                                gap: 5,
                                padding: '7px 14px',
                                borderRadius: 8,
                                background: '#8B5CF6',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>Track Parcel</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        ) : isDispatched ? (
                          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Your parcel is dispatched. Tracking details will appear here shortly.
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: SAVED DELIVERY ADDRESSES ── */}
          {activeTab === 'addresses' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.22rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text)',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    Saved Delivery Addresses
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved for faster checkout
                  </p>
                </div>

                {addresses.length > 0 && (
                  <button type="button" onClick={handleOpenAddAddress} className="account-cta-btn">
                    <Plus size={14} />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  Loading addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div className="account-empty-state">
                  <div className="account-empty-icon">
                    <MapPin size={24} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.96rem', color: 'var(--text)' }}>
                    No delivery addresses saved yet
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320 }}>
                    Save your doorstep address once to check out effortlessly on every order.
                  </p>
                  <button type="button" onClick={handleOpenAddAddress} className="account-cta-btn">
                    <Plus size={14} />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr._id}
                      address={addr}
                      onEdit={handleOpenEditAddress}
                      onDelete={handleDeleteAddress}
                      onSetDefault={handleSetDefaultAddress}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: UPDATES & NOTIFICATIONS ── */}
          {activeTab === 'updates' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.22rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text)',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    Order Updates & Notifications
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Live delivery tracking and order status alerts
                  </p>
                </div>

                {notifCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent, #C4386C)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="account-empty-state">
                  <div className="account-empty-icon">
                    <Bell size={24} />
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.96rem', color: 'var(--text)' }}>
                    You're all caught up
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320 }}>
                    Dispatch confirmations, tracking IDs, and special member updates will show up here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif._id);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: notif.read
                          ? (isDark ? 'rgba(255,255,255,0.02)' : '#FAF8F5')
                          : (isDark ? 'rgba(196,56,108,0.1)' : 'rgba(196,56,108,0.05)'),
                        border: `1px solid ${notif.read ? 'var(--border)' : 'rgba(196,56,108,0.25)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4386C', flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(notif.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Concierge WhatsApp Bar ──────────────────────────────────────── */}
      {IS_WHATSAPP_CONFIGURED && (
        <div
          style={{
            background: isDark ? 'rgba(37, 211, 102, 0.06)' : 'rgba(37, 211, 102, 0.05)',
            border: '1px solid rgba(37, 211, 102, 0.24)',
            borderRadius: 16,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <MessageCircle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text)' }}>
                Need help with an order?
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Chat with our jewellery concierge on WhatsApp
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
              gap: 6,
              padding: '8px 16px',
              borderRadius: 999,
              background: '#25D366',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.80rem',
              textDecoration: 'none',
              boxShadow: '0 3px 12px rgba(37, 211, 102, 0.25)',
            }}
          >
            <span>Chat on WhatsApp</span>
            <ArrowRight size={14} />
          </a>
        </div>
      )}

      {/* Address Management Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialData={editingAddress}
        onSaved={handleAddressSaved}
        isCustomerLoggedIn={Boolean(user)}
      />

      <style>{`
        .account-quick-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          cursor: pointer;
          transition: background-color 0.18s ease;
          min-width: 0;
        }
        .account-quick-cell:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(196, 56, 108, 0.04)'};
        }
        .account-quick-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .account-quick-value {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
          font-family: 'Outfit', sans-serif;
        }
        .account-quick-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .account-quick-chevron {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        @media (max-width: 440px) {
          .account-quick-cell {
            padding: 11px 8px;
            gap: 7px;
          }
          .account-quick-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
          }
          .account-quick-chevron {
            display: none;
          }
        }

        .account-back-btn:hover {
          border-color: var(--accent, #C4386C) !important;
          color: var(--accent, #C4386C) !important;
          transform: translateX(-2px);
        }

        .account-hub-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 8px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: clamp(0.71rem, 2.7vw, 0.80rem);
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          min-width: 0;
          transition: all 0.2s ease;
        }
        .account-hub-tab:hover {
          color: var(--text);
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'};
        }
        .account-hub-tab.is-active {
          background: var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2));
          color: #FFFFFF;
          box-shadow: 0 3px 10px rgba(196, 56, 108, 0.26);
        }
        .account-tab-pill {
          font-size: 0.66rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .account-tab-pill.is-active {
          background: rgba(255, 255, 255, 0.22);
          color: #FFFFFF;
        }

        .account-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 16px;
          border-radius: 14px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(250, 246, 238, 0.55)'};
          border: 1px dashed ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(196, 56, 108, 0.22)'};
        }
        .account-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${isDark ? 'rgba(196, 56, 108, 0.14)' : 'rgba(196, 56, 108, 0.08)'};
          color: var(--accent, #C4386C);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .account-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 999px;
          background: var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2));
          color: #FFFFFF;
          border: none;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(196, 56, 108, 0.28);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .account-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(196, 56, 108, 0.36);
        }
      `}</style>
    </div>
  );
};

export default Account;
