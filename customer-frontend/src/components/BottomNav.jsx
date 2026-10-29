import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, ShoppingBag, Heart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const BottomNav = () => {
  const { pathname } = useLocation();
  const { getCartCount } = useContext(CartContext);
  const { getWishlistCount } = useWishlist();
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const items = [
    { path: '/',           label: 'Home',       icon: Home },
    { path: '/categories', label: 'Categories', icon: LayoutGrid },
    { path: '/wishlist',   label: 'Wishlist',   icon: Heart,      badge: wishlistCount },
    { path: '/cart',       label: 'Cart',       icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ path, label, icon: Icon, badge }) => {
        const active = isActive(path);
        const isHeart = path === '/wishlist';
        return (
          <Link key={path} to={path} className={`bottom-nav-item ${active ? 'active' : ''}`}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon
                size={21}
                style={isHeart && active ? { fill: 'var(--accent)', stroke: 'var(--accent)' } : {}}
              />
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
