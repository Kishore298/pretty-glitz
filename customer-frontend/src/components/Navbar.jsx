import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Sun, Moon, ChevronDown, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

// Categories that appear as primary nav items
const PRIMARY_CATEGORIES = ['Bangles', 'Artificial Flowers', 'Gift Box Combo', 'Jumkhas', 'Jewels'];

// Subcategories grouped under Bangles on customer side
const BANGLE_SUBCATS = ['Glass Bangles', 'Valaikaappu Bangles', 'Antique Bangles', 'Wedding Bangles'];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [banglesOpen, setBanglesOpen] = useState(false);
  const { pathname } = useLocation();
  const { getCartCount } = useContext(CartContext);
  const { isDark, toggleTheme } = useTheme();
  const [allCategories, setAllCategories] = useState([]);
  const banglesRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setAllCategories(data.map(c => c.name));
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (banglesRef.current && !banglesRef.current.contains(e.target)) setBanglesOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const primaryCats = allCategories.filter(name => PRIMARY_CATEGORIES.includes(name));

  const linkStyle = (path) => {
    const decodedPathname = decodeURIComponent(pathname);
    const isActive = decodedPathname === path || decodedPathname.startsWith(path + '/');
    return {
      fontSize: '0.875rem', fontWeight: isActive ? 700 : 500,
      color: isActive ? '#FF1493' : (isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)'),
      textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    };
  };

  const dropdownItemStyle = {
    display: 'block', padding: '10px 20px',
    fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
    color: isDark ? 'rgba(240,240,248,0.8)' : 'rgba(15,15,18,0.8)',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  };

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 12px)',
    background: isDark ? 'rgba(12,12,22,0.98)' : 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 12, overflow: 'hidden',
    boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.12)',
    zIndex: 100, minWidth: 200,
  };

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
                color: isDark ? '#f0f0f8' : '#0f0f12', transition: 'color 0.3s',
              }}>PRETTY</span>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', letterSpacing: '0.05em',
                background: 'linear-gradient(90deg, #FF1493, #8A2BE2, #FF8C00, #FFD700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>GLITZ</span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'none', gap: 28, alignItems: 'center' }} className="desktop-nav">



              {/* Bangles with hover dropdown */}
              <div
                ref={banglesRef}
                style={{ position: 'relative' }}
                onMouseEnter={() => setBanglesOpen(true)}
                onMouseLeave={() => setBanglesOpen(false)}
              >
                <button
                  style={{
                    ...linkStyle('/category/Bangles'),
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                  }}
                >
                  Bangles
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: banglesOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                <AnimatePresence>
                  {banglesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      style={{ ...dropdownStyle, left: 0 }}
                    >

                      {BANGLE_SUBCATS.map(sub => (
                        <Link key={sub} to={`/category/${encodeURIComponent(sub)}`} style={{...dropdownItemStyle, display: 'flex', alignItems: 'center', gap: 8}}
                          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#FF1493'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? 'rgba(240,240,248,0.8)' : 'rgba(15,15,18,0.8)'; }}
                          onClick={() => setBanglesOpen(false)}
                        >
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.5 }} />
                          {sub}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Artificial Flowers, Gift Box, Jumkhas, Jewels */}
              {primaryCats.filter(n => n !== 'Bangles').map(name => (
                <Link key={name} to={`/category/${name}`} style={linkStyle(`/category/${name}`)}
                  onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                  onMouseLeave={e => e.currentTarget.style.color = decodeURIComponent(pathname) === `/category/${name}` ? '#FF1493' : (isDark ? 'rgba(240,240,248,0.7)' : 'rgba(15,15,18,0.7)')}
                >{name}</Link>
              ))}


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
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/" onClick={() => setIsOpen(false)} style={{
                fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                color: isDark ? '#f0f0f8' : '#0f0f12', textDecoration: 'none', padding: '10px 0',
              }}>Home</Link>

              {/* Bangles group */}
              <div>
                <Link to="/category/Bangles" onClick={() => setIsOpen(false)} style={{
                  fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  color: isDark ? '#f0f0f8' : '#0f0f12', textDecoration: 'none', padding: '10px 0', display: 'block',
                }}>Bangles</Link>
                <div style={{ paddingLeft: 24, marginBottom: 8 }}>
                  {BANGLE_SUBCATS.map(sub => (
                    <Link key={sub} to={`/category/${encodeURIComponent(sub)}`} onClick={() => setIsOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                      color: isDark ? 'rgba(240,240,248,0.6)' : 'rgba(15,15,18,0.6)',
                      textDecoration: 'none', padding: '6px 0',
                    }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.5 }} />
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Remaining primary categories */}
              {allCategories.filter(n => n !== 'Bangles').map(name => (
                <Link key={name} to={`/category/${name}`} onClick={() => setIsOpen(false)} style={{
                  fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  color: decodeURIComponent(pathname) === `/category/${name}` ? '#FF1493' : (isDark ? '#f0f0f8' : '#0f0f12'),
                  textDecoration: 'none', padding: '10px 0',
                }}>{name}</Link>
              ))}

              <Link to="/offers" onClick={() => setIsOpen(false)} style={{
                fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                color: '#FF1493', textDecoration: 'none', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10
              }}>Offers <Gift size={20} /></Link>

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
