import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, ExternalLink, ChevronRight, Sparkles, Store } from 'lucide-react';
import Sidebar from './Sidebar';

const pageTitleMap = {
  '/dashboard': 'Dashboard Overview',
  '/products': 'Product Catalog & Inventory',
  '/categories': 'Category Collections',
  '/subcategories': 'Flower Subcategories',
  '/offers': 'Special Offers & Discounts',
  '/testimonials': 'Customer Testimonials',
};

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentPath = location.pathname;
  const currentTitle = pageTitleMap[currentPath] || 'Management Console';

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
            {/* Left: Mobile Toggle & Breadcrumb */}
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

              {/* Breadcrumb Navigation */}
              <div className="admin-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Link
                  to="/dashboard"
                  className="admin-breadcrumb-home"
                  style={{
                    color: 'var(--text-muted, #6E687A)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'color 0.15s ease',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 3px 12px rgba(196, 56, 108, 0.3)',
                    }}
                  >
                    <img
                      src="/pritty-glitz-logo1.png"
                      alt="PrettyGlitz"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        objectPosition: 'center 25%',
                        imageRendering: '-webkit-optimize-contrast',
                        filter: 'contrast(1.04) brightness(1.02)',
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>PrettyGlitz</span>
                </Link>
                <ChevronRight size={14} className="admin-breadcrumb-separator" color="var(--accent-gold)" style={{ opacity: 0.6, flexShrink: 0 }} />
                <span
                  className="admin-breadcrumb-title"
                  style={{
                    color: 'var(--accent-gold-light, #E8CE8A)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    fontSize: '0.88rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTitle}
                </span>
              </div>
            </div>

            {/* Right: Live Store Badge & Quick Store Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {/* Store Status Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  fontSize: '0.75rem',
                  color: '#34D399',
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span>Storefront Live</span>
              </div>

              {/* Customer Store Link Button */}
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
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(196, 56, 108, 0.3), rgba(138, 43, 226, 0.3))';
                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(196, 56, 108, 0.15), rgba(138, 43, 226, 0.15))';
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
