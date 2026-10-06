import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Sun, Moon, ChevronDown, Gift, Search, ChevronRight, Sparkles } from 'lucide-react';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { getCartCount } = useContext(CartContext);
  const { isDark, toggleTheme } = useTheme();
  const [allCategories, setAllCategories] = useState([]);
  const banglesRef = useRef(null);
  const searchInputRef = useRef(null);

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
  useEffect(() => { setIsOpen(false); setSearchOpen(false); }, [pathname]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Close search overlay on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    if (searchOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const primaryCats = allCategories.filter(name => PRIMARY_CATEGORIES.includes(name));

  const linkStyle = (path) => {
    const decodedPathname = decodeURIComponent(pathname);
    const isActive = decodedPathname === path || decodedPathname.startsWith(path + '/');
    return {
      fontSize: '0.85rem', fontWeight: isActive ? 700 : 500,
      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
      textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.02em',
      whiteSpace: 'nowrap', position: 'relative',
      paddingBottom: isActive ? 4 : 0,
      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
    };
  };

  const dropdownItemStyle = {
    display: 'block', padding: '10px 20px',
    fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none',
    color: 'var(--text-secondary)',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  };

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 12px)',
    background: isDark ? 'rgba(14,14,22,0.98)' : 'rgba(253,251,247,0.98)',
    backdropFilter: 'blur(16px)',
    border: `1px solid var(--border)`,
    borderRadius: 12, overflow: 'hidden',
    boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(26,17,24,0.1)',
    zIndex: 100, minWidth: 200,
  };

  const iconBtnStyle = {
    width: 38, height: 38, borderRadius: '50%',
    background: isDark ? 'rgba(245,240,234,0.07)' : 'rgba(26,17,24,0.05)',
    border: `1px solid ${isDark ? 'rgba(245,240,234,0.1)' : 'rgba(26,17,24,0.1)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
    color: 'var(--text)',
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: scrolled ? 'var(--nav-bg)' : (isDark ? 'rgba(10,10,15,0.6)' : 'rgba(253,251,247,0.7)'),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid var(--border)`,
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1rem, 3.5vw, 1.3rem)', letterSpacing: '0.05em',
                color: 'var(--text)', transition: 'color 0.3s',
              }}>PRETTY</span>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1rem, 3.5vw, 1.3rem)', letterSpacing: '0.05em',
                background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>GLITZ</span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'none', gap: 24, alignItems: 'center' }} className="desktop-nav">

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
                    paddingBottom: linkStyle('/category/Bangles').paddingBottom,
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
                          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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

              {/* Other primary categories */}
              {primaryCats.filter(n => n !== 'Bangles').map(name => (
                <Link key={name} to={`/category/${name}`} style={linkStyle(`/category/${name}`)}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = decodeURIComponent(pathname) === `/category/${name}` ? 'var(--accent)' : 'var(--text-secondary)'}
                >{name}</Link>
              ))}

              {/* Offers link */}
              <Link to="/offers" style={{
                ...linkStyle('/offers'),
                display: 'flex', alignItems: 'center', gap: 4,
                color: pathname === '/offers' ? 'var(--accent)' : '#C4386C',
                fontWeight: 600,
              }}>
                Offers <Gift size={14} />
              </Link>

            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                style={iconBtnStyle}
                title="Search products"
                aria-label="Open search"
              >
                <Search size={17} />
              </button>

              {/* Dark/Light Toggle */}
              <button
                onClick={toggleTheme}
                style={iconBtnStyle}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Cart Icon */}
              <Link to="/cart" style={{ position: 'relative', color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ShoppingBag size={21} />
                {getCartCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute', top: -6, right: -8,
                      background: 'var(--accent-gradient)',
                      color: 'white', fontSize: '10px', fontWeight: 700,
                      minWidth: 18, height: 18, padding: '0 4px',
                      borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(196,56,108,0.5)',
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
                  color: 'var(--text)',
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

      {/* ── Search Overlay (Responsive) ──────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="search-overlay"
          >
            {/* Search Header */}
            <div style={{
              borderBottom: `1px solid var(--border)`,
              padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <Link to="/" onClick={() => setSearchOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="white" />
                </div>
              </Link>

              <form onSubmit={handleSearchSubmit} style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bangles, flowers, jewels..."
                  className="search-overlay-input"
                />
                <button type="submit" style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                }}>
                  <Search size={20} />
                </button>
              </form>

              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                  padding: 8, flexShrink: 0,
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Quick Category Links */}
            <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
                Popular Categories
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Bangles', 'Artificial Flowers', 'Jumkhas', 'Jewels', 'Gift Box Combo'].map(cat => (
                  <Link
                    key={cat}
                    to={`/category/${cat}`}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 12,
                      color: 'var(--text)', textDecoration: 'none',
                      fontSize: '1rem', fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {cat}
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              background: 'var(--bg)',
              paddingTop: 90, paddingLeft: 32, paddingRight: 32,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Mobile search */}
              <form onSubmit={(e) => { handleSearchSubmit(e); setIsOpen(false); }} style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="search-overlay-input"
                    style={{ fontSize: '1rem' }}
                  />
                  <button type="submit" style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', display: 'flex',
                  }}>
                    <Search size={20} />
                  </button>
                </div>
              </form>

              <Link to="/" onClick={() => setIsOpen(false)} style={{
                fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                color: 'var(--text)', textDecoration: 'none', padding: '10px 0',
              }}>Home</Link>

              {/* Bangles group */}
              <div>
                <Link to="/category/Bangles" onClick={() => setIsOpen(false)} style={{
                  fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  color: 'var(--text)', textDecoration: 'none', padding: '10px 0', display: 'block',
                }}>Bangles</Link>
                <div style={{ paddingLeft: 24, marginBottom: 8 }}>
                  {BANGLE_SUBCATS.map(sub => (
                    <Link key={sub} to={`/category/${encodeURIComponent(sub)}`} onClick={() => setIsOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                      color: 'var(--text-secondary)',
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
                  color: decodeURIComponent(pathname) === `/category/${name}` ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none', padding: '10px 0',
                }}>{name}</Link>
              ))}

              <Link to="/offers" onClick={() => setIsOpen(false)} style={{
                fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                color: 'var(--accent)', textDecoration: 'none', padding: '10px 0', display: 'flex', alignItems: 'center', gap: 10
              }}>Offers <Gift size={20} /></Link>

              <div style={{ marginTop: 16, paddingTop: 24, borderTop: `1px solid var(--border)` }}>
                <button onClick={() => { toggleTheme(); setIsOpen(false); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: 'var(--text-secondary)', fontSize: '1rem',
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
