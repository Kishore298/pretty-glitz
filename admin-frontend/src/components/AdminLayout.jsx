import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, ExternalLink, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';

const pageTitleMap = {
  '/dashboard': 'Dashboard Overview',
  '/products': 'Product Catalog',
  '/categories': 'Category Collections',
  '/subcategories': 'Flower Subcategories',
  '/offers': 'Special Offers & Discounts',
  '/testimonials': 'Customer Testimonials',
};

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentPath = location.pathname;
  const currentTitle = pageTitleMap[currentPath] || 'Console';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--panel-bg, #09080E)',
        color: 'var(--text-primary, #FAF9FC)',
        overflow: 'hidden',
      }}
    >
      {/* Mobile Drawer Overlay - Clean dark tint behind the open sidebar */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 4, 8, 0.65)',
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
            height: '64px',
            borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.07))',
            background: 'rgba(14, 13, 20, 0.85)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 40px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                  borderRadius: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Breadcrumb Navigation */}
              <div className="admin-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <Link
                  to="/dashboard"
                  className="admin-breadcrumb-home"
                  style={{
                    color: 'var(--text-muted, #6E687A)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    transition: 'color 0.15s ease',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(236, 22, 140, 0.4), rgba(155, 61, 255, 0.6))',
                      padding: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <img
                      src="/pretty-glitz-logo.png"
                      alt="PrettyGlitz"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        transform: 'scale(1.08)',
                        transformOrigin: 'center 38%',
                        imageRendering: '-webkit-optimize-contrast',
                        filter: 'contrast(1.06) brightness(1.02)',
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 600 }}>PrettyGlitz</span>
                </Link>
                <ChevronRight size={14} className="admin-breadcrumb-separator" color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span
                  className="admin-breadcrumb-title"
                  style={{
                    color: 'var(--text-primary)',
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

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* Customer Store Link Button */}
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary admin-shop-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                <span>Visit Shop</span>
                <ExternalLink size={13} />
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
