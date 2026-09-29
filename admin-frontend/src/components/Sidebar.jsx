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

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/categories', label: 'Categories', Icon: LayoutGrid },
  { to: '/subcategories', label: 'Flower Subcats', Icon: Layers },
  { to: '/products', label: 'Products', Icon: ShoppingBag },
  { to: '/offers', label: 'Offers', Icon: Sparkles },
];

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div
      style={{
        width: '240px',
        minHeight: '100vh',
        background: '#0f0f12',
        borderRight: '1px solid #1f1f28',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #1f1f28' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #FF1493, #8A2BE2, #FF8C00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(138,43,226,0.5)'
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em', color: '#fff' }}>
              PrettyGlitz
            </div>
            <div style={{ fontSize: '0.65rem', color: '#4a4a60', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div style={{ fontSize: '0.65rem', color: '#4a4a60', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 10 }}>
          Management
        </div>
        {navItems.map(({ to, label, Icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              className="sidebar-link"
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(255,20,147,0.15), rgba(138,43,226,0.15))',
                color: '#fff',
                border: '1px solid rgba(138,43,226,0.25)',
                textDecoration: 'none',
              } : { textDecoration: 'none' }}
            >
              <Icon
                size={18}
                style={isActive ? { color: '#c084fc' } : { color: '#4a4a60' }}
                className="link-icon"
              />
              <span>{label}</span>
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: 'linear-gradient(#FF1493, #8A2BE2)',
                  boxShadow: '0 0 6px rgba(255,20,147,0.8)'
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #1f1f28' }}>
        <button
          onClick={logout}
          className="sidebar-link"
          style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left' }}
        >
          <LogOut size={18} style={{ color: '#ef4444' }} />
          <span style={{ color: '#f87171' }}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
