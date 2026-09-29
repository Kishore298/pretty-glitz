import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { getCartCount } = useContext(CartContext);
  const { isDark, toggleTheme } = useTheme();
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        const catLinks = data.map(c => ({ name: c.name, path: `/category/${c.name}` }));
        setLinks([{ name: 'Offers 🎁', path: '/offers' }, ...catLinks]);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: scrolled
          ? isDark ? 'rgba(8,8,16,0.92)' : 'rgba(255,255,255,0.92)'
          : isDark ? 'rgba(8,8,16,0.6)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', letterSpacing: '0.05em',
                color: isDark ? '#f0f0f8' : '#0f0f12',
                transition: 'color 0.3s',
              }}>
                PRETTY
              </span>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', letterSpacing: '0.05em',
                background: 'linear-gradient(90deg, #FF1493, #8A2BE2, #FF8C00, #FFD700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                GLITZ
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'none', gap: 32 }} className="desktop-nav">
              {links.map(link => {
                const decodedPathname = decodeURIComponent(pathname);
                const isActive = decodedPathname === link.path || decodedPathname.startsWith(link.path + '/');
                return (
                  <Link key={link.name} to={link.path} style={{
                    fontSize: '0.875rem', fontWeight: isActive ? 700 : 500,
                    color: isActive 
                      ? '#FF1493' 
                      : (isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)'),
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                  onMouseLeave={e => e.currentTarget.style.color = isActive 
                      ? '#FF1493' 
                      : (isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)')}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>


              {/* Dark/Light Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  color: isDark ? '#f0f0f8' : '#0f0f12',
                }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>



              {/* Cart Icon */}
              <Link to="/cart" style={{ position: 'relative', color: isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)'}
              >
                <ShoppingBag size={21} />
                {getCartCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute', top: -6, right: -8,
                      background: 'linear-gradient(135deg, #FF1493, #8A2BE2)',
                      color: 'white', fontSize: '10px', fontWeight: 700,
                      minWidth: 18, height: 18, padding: '0 4px',
                      borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(255,20,147,0.5)',
                    }}
                  >
                    {getCartCount()}
                  </motion.span>
                )}
              </Link>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isDark ? '#f0f0f8' : '#0f0f12',
                  display: 'flex', alignItems: 'center',
                }}
                className="mobile-menu-btn"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: isDark ? '#080810' : '#ffffff',
              paddingTop: 90, paddingLeft: 32, paddingRight: 32,
            }}
          >

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <Link to="/" onClick={() => setIsOpen(false)} style={{
                fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                color: isDark ? '#f0f0f8' : '#0f0f12', textDecoration: 'none',
              }}>Home</Link>
              {links.map(link => {
                const decodedPathname = decodeURIComponent(pathname);
                const isActive = decodedPathname === link.path || decodedPathname.startsWith(link.path + '/');
                return (
                  <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} style={{
                    fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    color: isActive ? '#FF1493' : (isDark ? '#f0f0f8' : '#0f0f12'), textDecoration: 'none',
                  }}>
                    {link.name}
                  </Link>
                );
              })}
              <div style={{ marginTop: 16, paddingTop: 24, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
                <button onClick={() => { toggleTheme(); setIsOpen(false); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: isDark ? '#8888a8' : '#6b6b80', fontSize: '1rem',
                }}>
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
