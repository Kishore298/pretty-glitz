import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, ShoppingBag, TrendingUp } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const BottomNav = () => {
  const { pathname } = useLocation();
  const { getCartCount } = useContext(CartContext);
  const cartCount = getCartCount();

  const handleTrendingClick = (e) => {
    if (pathname === '/') {
      const el = document.getElementById('bestsellers');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.replaceState(null, '', '/#bestsellers');
      }
    }
  };

  const isActive = (path) => {
    if (path === '/') return pathname === '/' && window.location.hash !== '#bestsellers';
    if (path === '/#bestsellers') return pathname === '/' && window.location.hash === '#bestsellers';
    return pathname.startsWith(path);
  };

  const items = [
    { path: '/',             label: 'Home',       icon: Home },
    { path: '/categories',   label: 'Categories', icon: LayoutGrid },
    { path: '/#bestsellers', label: 'Trending',   icon: TrendingUp, onClick: handleTrendingClick },
    { path: '/offers',       label: 'Offers',     emoji: '✨' },
    { path: '/cart',         label: 'Cart',       icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ path, label, icon: Icon, emoji, badge, onClick }) => {
        const active = isActive(path);
        return (
          <Link
            key={path}
            to={path}
            onClick={onClick}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {emoji ? (
                <span
                  style={{
                    fontSize: '1.25rem',
                    lineHeight: '20px',
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: active ? 'drop-shadow(0 0 6px rgba(236, 22, 140, 0.6))' : 'none',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease, filter 0.2s ease',
                  }}
                  role="img"
                  aria-label={label}
                >
                  {emoji}
                </span>
              ) : (
                <Icon size={20} />
              )}
              {badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bottom-nav-badge"
                >
                  {badge > 99 ? '99+' : badge}
                </motion.span>
              )}
            </div>
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
