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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const banglesRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);

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
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target) && !e.target.closest('.search-toggle-btn')) {
        setSearchOpen(false);
      }
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

  // Search fetching logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get('/products');
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = data.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) || 
          (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
          (p.subcategoryId?.name && p.subcategoryId.name.toLowerCase().includes(lowerQuery))
        );
        setSearchResults(filtered.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const primaryCats = allCategories.filter(name => PRIMARY_CATEGORIES.includes(name));

  const isBanglesActive = decodeURIComponent(pathname) === '/category/Bangles' || BANGLE_SUBCATS.some(sub => decodeURIComponent(pathname) === `/category/${sub}`);

  const linkStyle = (path, forceActive = false) => {
    const decodedPathname = decodeURIComponent(pathname);
    const isActive = forceActive || decodedPathname === path || decodedPathname.startsWith(path + '/');
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
                    ...linkStyle('/category/Bangles', isBanglesActive),
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                    paddingBottom: linkStyle('/category/Bangles', isBanglesActive).paddingBottom,
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

                      {BANGLE_SUBCATS.map(sub => {
                        const isSubActive = decodeURIComponent(pathname) === `/category/${sub}`;
                        return (
                          <Link key={sub} to={`/category/${encodeURIComponent(sub)}`} style={{...dropdownItemStyle, color: isSubActive ? 'var(--accent)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8}}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isSubActive ? 'var(--accent)' : 'var(--text-secondary)'; }}
                            onClick={() => setBanglesOpen(false)}
                          >
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.5 }} />
                            {sub}
                          </Link>
                        );
                      })}
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
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  style={{...iconBtnStyle, background: searchOpen ? 'var(--text)' : iconBtnStyle.background, color: searchOpen ? 'var(--bg)' : 'var(--text)' }}
                  title="Search products"
                  aria-label="Open search"
                  className="search-toggle-btn"
                >
                  {searchOpen ? <X size={17} /> : <Search size={17} />}
                </button>
                
                {/* Desktop Search Dropdown */}
                <style>{`
                  .desktop-search-dropdown {
                    position: absolute;
                    top: calc(100% + 16px);
                    right: 0;
                    width: calc(100vw - 48px);
                    max-width: 500px;
                  }
                  @media (max-width: 768px) {
                    .desktop-search-dropdown {
                      position: fixed;
                      top: 72px; /* Navbar height */
                      right: 24px;
                      width: calc(100vw - 48px);
                    }
                  }
                `}</style>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      ref={searchPanelRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        background: isDark ? 'rgba(14,14,22,0.98)' : 'rgba(253,251,247,0.98)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid var(--border)`,
                        borderRadius: 16, overflow: 'hidden',
                        boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(26,17,24,0.1)',
                        zIndex: 100,
                        display: 'flex', flexDirection: 'column',
                      }}
                      className="desktop-search-dropdown"
                    >
                      {/* Search Input */}
                      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', borderBottom: '1px solid var(--border)' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search bangles, flowers, jewels..."
                          style={{
                            width: '100%', padding: '16px 48px',
                            background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text)', fontSize: '1rem',
                            fontFamily: 'Inter, sans-serif'
                          }}
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery('')} style={{
                            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <X size={16} />
                          </button>
                        )}
                      </form>

                      {/* Content Area */}
                      <div style={{ maxHeight: 400, overflowY: 'auto' }} className="no-scrollbar">
                        {!searchQuery.trim() ? (
                          <div style={{ padding: '20px' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                              Popular Categories
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {['Bangles', 'Artificial Flowers', 'Jumkhas', 'Jewels', 'Gift Box Combo'].map(cat => (
                                <Link
                                  key={cat} to={`/category/${cat}`} onClick={() => setSearchOpen(false)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: 8,
                                    color: 'var(--text)', textDecoration: 'none',
                                    fontSize: '0.9rem', fontWeight: 500,
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {cat}
                                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : isSearching ? (
                          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div style={{ padding: '12px 0' }}>
                            <div style={{ padding: '0 20px', marginBottom: 8 }}>
                              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Products
                              </p>
                            </div>
                            {searchResults.map(product => (
                              <Link key={product._id} to={`/product/${product._id}`} onClick={() => setSearchOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 20px', textDecoration: 'none',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                                  {product.images && product.images[0] ? (
                                    <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>PG</div>
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {product.name}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    ₹{product.price}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            <div style={{ padding: '12px 20px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
                              <Link to={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={() => setSearchOpen(false)} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                              }}>
                                View all results <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 500, margin: '0 0 4px' }}>No products found</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Try searching for another product or category.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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

      {/* Desktop search overlay removed */}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 4 }}>
                <Link to="/" onClick={() => setIsOpen(false)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8,
                  background: pathname === '/' ? 'var(--bg-secondary)' : 'transparent',
                  color: pathname === '/' ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}>
                  <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Home</span>
                  <ChevronRight size={14} opacity={0.4} />
                </Link>

                {/* Bangles Group */}
                <div style={{ 
                  background: isBanglesActive ? 'var(--bg-secondary)' : 'transparent',
                  border: `1px solid ${isBanglesActive ? 'var(--border-strong)' : 'transparent'}`,
                  borderRadius: 8, overflow: 'hidden', transition: 'all 0.3s ease',
                  marginTop: 2, marginBottom: 2
                }}>
                  <Link to="/category/Bangles" onClick={() => setIsOpen(false)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px',
                    color: decodeURIComponent(pathname) === '/category/Bangles' ? 'var(--accent)' : 'var(--text)',
                    textDecoration: 'none',
                  }}>
                    <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Bangles</span>
                    <ChevronRight size={14} opacity={0.4} />
                  </Link>
                  <div style={{ 
                    padding: '0 8px 8px 16px', display: 'flex', flexDirection: 'column', gap: 2,
                    borderLeft: `2px solid var(--accent)`, marginLeft: 12,
                  }}>
                    {BANGLE_SUBCATS.map(sub => {
                      const isSubActive = decodeURIComponent(pathname) === `/category/${sub}`;
                      return (
                        <Link key={sub} to={`/category/${encodeURIComponent(sub)}`} onClick={() => setIsOpen(false)} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: isSubActive ? 600 : 500,
                          color: isSubActive ? 'var(--accent)' : 'var(--text-secondary)',
                          textDecoration: 'none', padding: '6px 10px', borderRadius: 6,
                          background: isSubActive ? 'var(--bg-card)' : 'transparent',
                          boxShadow: isSubActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        }}>
                          {sub}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Other Categories */}
                {allCategories.filter(n => n !== 'Bangles' && !BANGLE_SUBCATS.includes(n)).map(name => {
                  const isActive = decodeURIComponent(pathname) === `/category/${name}`;
                  return (
                    <Link key={name} to={`/category/${name}`} onClick={() => setIsOpen(false)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 8,
                      background: isActive ? 'var(--bg-secondary)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      textDecoration: 'none', transition: 'background 0.2s',
                    }}>
                      <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{name}</span>
                      <ChevronRight size={14} opacity={0.4} />
                    </Link>
                  )
                })}

                {/* Offers */}
                <Link to="/offers" onClick={() => setIsOpen(false)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8, marginTop: 4,
                  background: 'linear-gradient(135deg, rgba(236,22,140,0.08), rgba(155,61,255,0.08))',
                  border: `1px solid rgba(236,22,140,0.15)`,
                  color: 'var(--accent)', textDecoration: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Gift size={18} />
                    <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Exclusive Offers</span>
                  </div>
                  <ChevronRight size={14} opacity={0.6} />
                </Link>
              </div>

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
