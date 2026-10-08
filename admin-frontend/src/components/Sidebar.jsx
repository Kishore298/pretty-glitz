import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  LayoutGrid,
  LogOut,
  Sparkles
} from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { to: '/categories', label: 'Categories', Icon: LayoutGrid },
      { to: '/subcategories', label: 'Flower Subcats', Icon: Layers },
      { to: '/products', label: 'Products', Icon: ShoppingBag },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { to: '/offers', label: 'Offers', Icon: Sparkles },
    ]
  }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: '260px',
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '32px 24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.02em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              PrettyGlitz
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 16px' }}>
        {navGroups.map((group, idx) => (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 14, marginBottom: 8
            }}>
              {group.label}
            </p>
            {group.items.map(({ to, label, Icon }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsOpen && setIsOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="link-icon" size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                  {label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '24px 16px' }}>
        <button
          onClick={logout}
          className="sidebar-link"
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', justifyContent: 'flex-start' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} style={{ opacity: 0.7 }} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
