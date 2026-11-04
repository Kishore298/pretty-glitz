import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ExternalLink,
  Store,
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  Radio,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';
import Sidebar from './Sidebar';
import { useSocket } from '../context/SocketContext';

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const {
    isConnected,
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    markNotificationRead,
    markAllNotificationsRead,
    pushStatus,
    requestPushSubscription,
  } = useSocket();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--panel-bg, #0A0A0F)',
        color: 'var(--text-primary, #FAF9FC)',
        overflow: 'hidden',
      }}
    >
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 4, 8, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 900,
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Main Content Area + Topbar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Luxury Topbar */}
        <header
          className="admin-topbar"
          style={{
            height: '76px',
            borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
            background: 'var(--topbar-bg, rgba(15, 14, 23, 0.85))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 36px',
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          <div
            style={{
              maxWidth: 1360,
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: Mobile Toggle & Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="admin-hamburger-btn"
                aria-label="Toggle navigation menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Brand Logo & Name */}
              <Link
                to="/dashboard"
                style={{
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <img
                  src="/pretty-glitz-logo.png"
                  alt="PrettyGlitz"
                  style={{
                    height: 30,
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    letterSpacing: '0.04em',
                    background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}
                >
                  PrettyGlitz
                </span>
              </Link>
            </div>

            {/* Right: Controls & Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {/* Real-time Socket Live Status Pill */}
              <div
                title={isConnected ? 'Live Socket connected' : 'Connecting to live events...'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 20,
                  background: isConnected
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${
                    isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                  }`,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: isConnected ? '#10B981' : '#EF4444',
                }}
              >
                <Radio
                  size={12}
                  style={{
                    animation: isConnected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                  }}
                />
                <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>

              {/* Sound Toggle Button */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Chime sound enabled (Click to mute)' : 'Chime sound muted (Click to enable)'}
                style={{
                  background: soundEnabled ? 'rgba(201, 168, 76, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    soundEnabled ? 'rgba(201, 168, 76, 0.35)' : 'var(--card-border, rgba(255, 255, 255, 0.1))'
                  }`,
                  color: soundEnabled ? 'var(--accent-gold, #C9A84C)' : '#ACA6B8',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}
              >
                {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              {/* Notification Bell with Badge & Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  title="Order Notifications"
                  style={{
                    background: unreadCount > 0
                      ? 'linear-gradient(135deg, rgba(236, 22, 140, 0.2), rgba(138, 43, 226, 0.2))'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: unreadCount > 0
                      ? '1px solid rgba(236, 22, 140, 0.45)'
                      : '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                    color: unreadCount > 0 ? '#FAF9FC' : '#ACA6B8',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: 'linear-gradient(135deg, #EC168C, #EF4444)',
                        color: '#FFFFFF',
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        height: 18,
                        minWidth: 18,
                        padding: '0 4px',
                        borderRadius: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(236, 22, 140, 0.7)',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {isNotifOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 12px)',
                      width: '380px',
                      maxWidth: '90vw',
                      background: 'linear-gradient(180deg, #161522 0%, #11101A 100%)',
                      border: '1px solid rgba(201, 168, 76, 0.25)',
                      borderRadius: 16,
                      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 25px rgba(201, 168, 76, 0.1)',
                      zIndex: 100,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Drawer Header */}
                    <div
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FAF9FC' }}>
                          Alerts & Orders
                        </span>
                        {unreadCount > 0 && (
                          <span
                            style={{
                              background: 'rgba(236, 22, 140, 0.2)',
                              color: '#EC168C',
                              padding: '2px 8px',
                              borderRadius: 10,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-gold, #C9A84C)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 6px',
                            borderRadius: 6,
                          }}
                        >
                          <CheckCheck size={14} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Background Web Push Notification Opt-in Prompt */}
                    {pushStatus !== 'granted' && (
                      <div
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(90deg, rgba(138, 43, 226, 0.15), rgba(236, 22, 140, 0.15))',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <Sparkles size={14} color="var(--accent-gold)" />
                          <span style={{ fontSize: '0.74rem', color: '#FAF9FC', lineHeight: 1.3 }}>
                            Get background OS notifications for new orders
                          </span>
                        </div>
                        <button
                          onClick={requestPushSubscription}
                          style={{
                            background: 'linear-gradient(135deg, #EC168C, #8A2BE2)',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Enable
                        </button>
                      </div>
                    )}

                    {/* Notifications List Body */}
                    <div
                      style={{
                        maxHeight: '340px',
                        overflowY: 'auto',
                        padding: '6px 0',
                      }}
                    >
                      {notifications.length === 0 ? (
                        <div
                          style={{
                            padding: '32px 20px',
                            textAlign: 'center',
                            color: '#ACA6B8',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Bell size={24} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              if (!notif.read && notif._id && !notif._id.startsWith('temp_')) {
                                markNotificationRead(notif._id);
                              }
                              setIsNotifOpen(false);
                              if (notif.orderId) {
                                navigate(`/orders?id=${notif.orderId}`);
                              }
                            }}
                            style={{
                              padding: '12px 18px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              background: notif.read
                                ? 'transparent'
                                : 'linear-gradient(90deg, rgba(236, 22, 140, 0.08), transparent)',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = notif.read
                                ? 'transparent'
                                : 'linear-gradient(90deg, rgba(236, 22, 140, 0.08), transparent)';
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: 'rgba(201, 168, 76, 0.12)',
                                border: '1px solid rgba(201, 168, 76, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-gold, #C9A84C)',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              <ShoppingBag size={16} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 2,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: notif.read ? 600 : 700,
                                    color: notif.read ? '#FAF9FC' : 'var(--accent-gold, #C9A84C)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: '#EC168C',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.76rem',
                                  color: '#ACA6B8',
                                  lineHeight: 1.35,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {notif.message}
                              </p>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 4,
                                  fontSize: '0.68rem',
                                  color: '#6E687A',
                                }}
                              >
                                <Clock size={11} />
                                {formatTimeAgo(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Drawer Footer Link to Orders */}
                    <div
                      style={{
                        padding: '10px 16px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/orders');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FAF9FC',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>View all orders & requests</span>
                        <ExternalLink size={12} color="var(--accent-gold)" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Store Link */}
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-shop-btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  borderRadius: 10,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.15), rgba(138, 43, 226, 0.15))',
                  border: '1px solid rgba(201, 168, 76, 0.35)',
                  color: '#FAF9FC',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(196, 56, 108, 0.3), rgba(138, 43, 226, 0.3))';
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(196, 56, 108, 0.15), rgba(138, 43, 226, 0.15))';
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Store size={14} color="var(--accent-gold)" />
                <span>Visit Store</span>
                <ExternalLink size={13} style={{ opacity: 0.7 }} />
              </a>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main
          className="admin-content-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              maxWidth: 1360,
              width: '100%',
              margin: '0 auto',
              flex: 1,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
