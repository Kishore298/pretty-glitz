import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  LayoutGrid,
  LogOut,
  Sparkles,
  MessageSquareQuote,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ]
  },
  {
    label: 'Catalog & Inventory',
    items: [
      { to: '/categories', label: 'Categories', Icon: LayoutGrid },
      { to: '/subcategories', label: 'Flower Subcategories', Icon: Layers },
      { to: '/products', label: 'Products', Icon: ShoppingBag },
    ]
  },
  {
    label: 'Marketing & Reviews',
    items: [
      { to: '/offers', label: 'Special Offers', Icon: Sparkles },
      { to: '/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
    ]
  }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, admin } = useContext(AuthContext);
  const location = useLocation();

  const username = admin?.username || 'Admin';
  const initial = username.charAt(0).toUpperCase();

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: '270px',
        minHeight: '100vh',
        background: 'var(--sidebar-bg, #0E0D14)',
        borderRight: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: isOpen ? 1050 : 50,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '28px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(236, 22, 140, 0.5), rgba(155, 61, 255, 0.7))',
              padding: '1.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(236, 22, 140, 0.25)',
              flexShrink: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
            }}
          >
            <img
              src="/pretty-glitz-logo.png"
              alt="PrettyGlitz Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scale(1.08)',
                transformOrigin: 'center 38%',
                borderRadius: '50%',
                imageRendering: '-webkit-optimize-contrast',
                filter: 'contrast(1.06) brightness(1.02)',
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary, #FAF9FC)',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
              }}
            >
              PrettyGlitz
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--accent-pink, #EC168C)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={12} /> Management Console
            </div>
          </div>
        </div>

        {/* View Storefront Quick Link */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 10,
            color: 'var(--text-secondary, #ACA6B8)',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = 'var(--text-secondary, #ACA6B8)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <span>View Customer Store</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Navigation Groups */}
      <nav style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 22 }}>
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted, #6E687A)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                paddingLeft: 12,
                marginBottom: 6,
              }}
            >
              {group.label}
            </p>
            {group.items.map(({ to, label, Icon }) => {
              const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsOpen && setIsOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon
                    className="link-icon"
                    size={18}
                    style={{
                      opacity: isActive ? 1 : 0.75,
                      transition: 'transform 0.15s ease',
                    }}
                  />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Logout Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.07))',
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 10px',
            background: 'var(--surface-primary, #13121A)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.07))',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {username}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                }}
              >
                Administrator
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
