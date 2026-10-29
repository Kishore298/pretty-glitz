import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Gem,
  Layers,
  Flower2,
  LogOut,
  Tag,
  MessageSquareQuote,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Image
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
      { to: '/categories', label: 'Categories', Icon: Layers },
      { to: '/subcategories', label: 'Flower Subcategories', Icon: Flower2 },
      { to: '/products', label: 'Products & Inventory', Icon: Gem },
    ]
  },
  {
    label: 'Marketing & Storefront',
    items: [
      { to: '/banners', label: 'Hero Banners', Icon: Image },
      { to: '/offers', label: 'Special Offers', Icon: Tag },
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
        width: '284px',
        minHeight: '100vh',
        background: 'var(--sidebar-bg, #0F0E17)',
        borderRight: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: isOpen ? 1050 : 50,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '26px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C4386C, #8A2BE2, #C9A84C)',
              padding: '2.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(196, 56, 108, 0.38)',
              flexShrink: 0,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
            }}
          >
            <img
              src="/pritty-glitz-logo1.png"
              alt="PrettyGlitz Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 25%',
                borderRadius: '50%',
                imageRendering: '-webkit-optimize-contrast',
                filter: 'contrast(1.04) brightness(1.02)',
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.45rem',
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
                color: 'var(--accent-gold, #C9A84C)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginTop: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ShieldCheck size={12} /> Management Atelier
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
            padding: '9px 14px',
            background: 'rgba(201, 168, 76, 0.05)',
            border: '1px solid rgba(201, 168, 76, 0.16)',
            borderRadius: 12,
            color: 'var(--text-secondary, #ACA6B8)',
            fontSize: '0.8rem',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201, 168, 76, 0.12)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(201, 168, 76, 0.05)';
            e.currentTarget.style.color = 'var(--text-secondary, #ACA6B8)';
            e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.16)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShoppingBag size={14} color="var(--accent-gold)" />
            <span>View Customer Store</span>
          </span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Navigation Groups */}
      <nav style={{ flex: 1, padding: '10px 14px', overflowY: 'auto' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: '0.67rem',
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FAF9FC' : 'var(--text-secondary)',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(196, 56, 108, 0.18), rgba(138, 43, 226, 0.12))'
                      : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    borderTop: isActive ? '1px solid rgba(201, 168, 76, 0.2)' : '1px solid transparent',
                    borderRight: isActive ? '1px solid rgba(201, 168, 76, 0.2)' : '1px solid transparent',
                    borderBottom: isActive ? '1px solid rgba(201, 168, 76, 0.2)' : '1px solid transparent',
                    marginBottom: 4,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon
                    className="link-icon"
                    size={18}
                    style={{
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
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
          borderTop: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--surface-primary, #14131E)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
            borderRadius: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#FFFFFF',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(196, 56, 108, 0.35)',
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
                  color: 'var(--accent-gold)',
                  fontWeight: 500,
                }}
              >
                Store Administrator
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
