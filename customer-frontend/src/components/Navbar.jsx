import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Gift, Search, ChevronRight, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../utils/api';
import logoImg from '../assets/pretty-glitz-logo.png';

// The 4 Bangle categories grouped under parent "Bangles"
const BANGLE_CATEGORIES = [
  'Designer Glass Bangles',
  'Valaikaappu Bangles',
  'Antique Bangles',
  'Wedding Bangles',
];

// Fallback non-bangle categories in desired display order
const NON_BANGLE_CATEGORIES = [
  'Artificial Flowers',
  'Jumkhas',
  'Gift Box Combo',
  'Jewels',
];

const DEFAULT_BANGLE_SUBS = [
  { name: 'Daily Wear Bangles' },
  { name: 'Velvet Finish Bangles' },
  { name: 'Matte Gold Sets' },
  { name: 'Bridal Chura Sets' },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [banglesOpen, setBanglesOpen] = useState(false);
  const [mobileBanglesOpen, setMobileBanglesOpen] = useState(true);
  const [mobileDesignerSubsOpen, setMobileDesignerSubsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const { getWishlistCount } = useWishlist();
  const wishlistCount = getWishlistCount();
  const [allCategories, setAllCategories] = useState([]);
  const [bangleSubcategories, setBangleSubcategories] = useState(DEFAULT_BANGLE_SUBS);
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
    const fetchBangleSubs = async () => {
      try {
        const { data } = await api.get('/subcategories?category=Designer%20Glass%20Bangles');
        if (Array.isArray(data) && data.length > 0) {
          setBangleSubcategories(data);
        }
      } catch (err) {
        console.error('Failed to load bangle subcategories', err);
      }
    };
    fetchCategories();
    fetchBangleSubs();
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

  const decodedPathname = decodeURIComponent(pathname);
  const isAnyBanglesActive =
    decodedPathname.includes('/category/Designer Glass Bangles') ||
    decodedPathname.includes('/category/Glass Bangles') ||
    decodedPathname.includes('/category/Bangles') ||
    decodedPathname.includes('/category/Valaikaappu Bangles') ||
    decodedPathname.includes('/category/Antique Bangles') ||
    decodedPathname.includes('/category/Wedding Bangles');

  const isDesignerBanglesActive =
    decodedPathname.includes('/category/Designer Glass Bangles') ||
    decodedPathname.includes('/category/Glass Bangles') ||
    decodedPathname.includes('/category/Bangles');

  // Filter out any bangle category so only non-bangle categories remain at the top level
  const otherCatsFromApi = allCategories.filter(
    (name) =>
      !name.toLowerCase().includes('bangle') &&
      name !== 'Designer Glass Bangles' &&
      name !== 'Glass Bangles' &&
      name !== 'Bangles'
  );
  const nonBangleCats = otherCatsFromApi.length > 0 ? otherCatsFromApi : NON_BANGLE_CATEGORIES;

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
    background: isDark ? 'rgba(14,14,22,0.98)' : 'var(--bg)',
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
    cursor: 'pointer', transition: 'all 0.35s ease',
    color: 'var(--text)',
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: isDark
          ? (scrolled ? 'var(--nav-bg)' : 'rgba(10,10,15,0.92)')
          : 'var(--nav-bg)',
        boxShadow: scrolled
          ? (isDark ? '0 4px 20px rgba(0,0,0,0.45)' : '0 4px 20px -2px rgba(26,17,24,0.06)')
          : 'none',
        borderBottom: `1px solid var(--border)`,
        transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
      }}>
        <div className="navbar-wrapper">
          <div className="navbar-container">

            {/* Logo — natural aspect ratio, no circular mask */}
            <Link to="/" className="navbar-brand-link">
              <img
                src={logoImg}
                alt="PrettyGlitz"
                className="navbar-logo-img"
              />
              <span className="navbar-brand-text">
                PrettyGlitz
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div style={{ display: 'none', gap: 24, alignItems: 'center' }} className="desktop-nav">

              {/* Bangles Parent with Horizontal Mega Menu */}
              <div
                ref={banglesRef}
                style={{ position: 'relative' }}
                onMouseEnter={() => setBanglesOpen(true)}
                onMouseLeave={() => setBanglesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setBanglesOpen((prev) => !prev)}
                  style={{
                    ...linkStyle('/category/Designer Glass Bangles', isAnyBanglesActive),
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: 0,
                    paddingBottom: linkStyle('', isAnyBanglesActive).paddingBottom,
                    fontFamily: 'Inter, sans-serif',
                  }}
                  aria-expanded={banglesOpen}
                  aria-haspopup="true"
                >
                  <span>Bangles</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transition: 'transform 0.25s ease',
                      transform: banglesOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>

                <AnimatePresence>
                  {banglesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 14px)',
                        left: -20,
                        background: isDark ? 'rgba(14, 14, 22, 0.98)' : 'var(--bg)',
                        backdropFilter: 'blur(20px)',
                        border: `1px solid var(--border)`,
                        borderRadius: 16,
                        boxShadow: isDark
                          ? '0 24px 50px rgba(0, 0, 0, 0.65)'
                          : '0 24px 50px rgba(26, 17, 24, 0.12)',
                        zIndex: 100,
                        width: 600,
                        padding: '22px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1.35fr 1fr',
                        gap: 24,
                      }}
                    >
                      {/* Left Column: Designer Glass Bangles & Subcategories */}
                      <div style={{ borderRight: `1px solid var(--border)`, paddingRight: 20 }}>
                        <div style={{ marginBottom: 14 }}>
                          <Link
                            to="/category/Designer%20Glass%20Bangles"
                            onClick={() => setBanglesOpen(false)}
                            style={{
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.98rem',
                                fontWeight: 700,
                                fontFamily: 'Outfit, sans-serif',
                                color: isDesignerBanglesActive ? 'var(--accent)' : 'var(--text)',
                                letterSpacing: '0.02em',
                              }}
                            >
                              Designer Glass Bangles
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                background: 'linear-gradient(135deg, rgba(196,56,108,0.12), rgba(138,43,226,0.12))',
                                color: 'var(--accent)',
                                padding: '2px 7px',
                                borderRadius: 999,
                                border: '1px solid rgba(196,56,108,0.2)',
                              }}
                            >
                              Featured
                            </span>
                          </Link>
                          <p
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              margin: '4px 0 0',
                              lineHeight: 1.4,
                            }}
                          >
                            Handcrafted color-rich glass bangles with size-wise variations.
                          </p>
                        </div>

                        {/* Subcategories list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--text-muted)',
                              marginBottom: 6,
                            }}
                          >
                            Collections & Sets
                          </span>

                          {bangleSubcategories.map((sub) => {
                            const subParam = sub._id || sub.name;
                            const isSubActive = decodedPathname.includes(sub.name);
                            return (
                              <Link
                                key={sub._id || sub.name}
                                to={`/category/Designer%20Glass%20Bangles?sub=${encodeURIComponent(subParam)}`}
                                onClick={() => setBanglesOpen(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 10px',
                                  borderRadius: 8,
                                  fontSize: '0.86rem',
                                  fontWeight: isSubActive ? 700 : 500,
                                  color: isSubActive ? 'var(--accent)' : 'var(--text)',
                                  textDecoration: 'none',
                                  transition: 'all 0.15s ease',
                                  background: isSubActive
                                    ? (isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)')
                                    : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = isDark
                                    ? 'rgba(245,240,234,0.06)'
                                    : 'rgba(26,17,24,0.04)';
                                  e.currentTarget.style.color = 'var(--accent)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isSubActive
                                    ? (isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)')
                                    : 'transparent';
                                  e.currentTarget.style.color = isSubActive
                                    ? 'var(--accent)'
                                    : 'var(--text)';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div
                                    style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: isSubActive ? 'var(--accent)' : 'currentColor',
                                      opacity: isSubActive ? 1 : 0.45,
                                    }}
                                  />
                                  <span>{sub.name}</span>
                                </div>
                                <ChevronRight size={13} style={{ opacity: 0.4 }} />
                              </Link>
                            );
                          })}
                        </div>

                        <Link
                          to="/category/Designer%20Glass%20Bangles"
                          onClick={() => setBanglesOpen(false)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, rgba(196,56,108,0.08), rgba(138,43,226,0.08))',
                            border: `1px solid rgba(196,56,108,0.15)`,
                            marginTop: 4,
                          }}
                        >
                          <span>View All Designer Glass Bangles</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>

                      {/* Right Column: Other Signature Bangle Categories */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 12 }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Other Bangle Styles
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          {[
                            {
                              name: 'Valaikaappu Bangles',
                              desc: 'Auspicious ceremony & celebration sets',
                            },
                            {
                              name: 'Antique Bangles',
                              desc: 'Heritage temple antique & matte gold designs',
                            },
                            {
                              name: 'Wedding Bangles',
                              desc: 'Bridal chura & bridal occasion collection',
                            },
                          ].map((cat) => {
                            const isCatActive = decodedPathname === `/category/${cat.name}`;
                            return (
                              <Link
                                key={cat.name}
                                to={`/category/${encodeURIComponent(cat.name)}`}
                                onClick={() => setBanglesOpen(false)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  textDecoration: 'none',
                                  display: 'block',
                                  transition: 'all 0.18s ease',
                                  background: isCatActive
                                    ? (isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)')
                                    : 'transparent',
                                  border: `1px solid ${isCatActive ? 'var(--border)' : 'transparent'}`,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = isDark
                                    ? 'rgba(245,240,234,0.06)'
                                    : 'rgba(26,17,24,0.04)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isCatActive
                                    ? (isDark ? 'rgba(245,240,234,0.06)' : 'rgba(26,17,24,0.04)')
                                    : 'transparent';
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.92rem',
                                      fontWeight: isCatActive ? 700 : 600,
                                      fontFamily: 'Outfit, sans-serif',
                                      color: isCatActive ? 'var(--accent)' : 'var(--text)',
                                    }}
                                  >
                                    {cat.name}
                                  </span>
                                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.3,
                                    display: 'block',
                                  }}
                                >
                                  {cat.desc}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remaining primary categories: Artificial Flowers, Jumkhas, Gift Box Combo, Jewels */}
              {nonBangleCats.map((name) => (
                <Link
                  key={name}
                  to={`/category/${encodeURIComponent(name)}`}
                  style={linkStyle(`/category/${name}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      decodeURIComponent(pathname) === `/category/${name}`
                        ? 'var(--accent)'
                        : 'var(--text-secondary)')
                  }
                >
                  {name}
                </Link>
              ))}

              {/* Offers link */}
              <Link
                to="/offers"
                style={{
                  ...linkStyle('/offers'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: pathname === '/offers' ? 'var(--accent)' : '#C4386C',
                  fontWeight: 600,
                }}
              >
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
                      top: 76px; /* Navbar height */
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
                        background: isDark ? 'rgba(14,14,22,0.98)' : 'var(--bg)',
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
                              {['Designer Glass Bangles', 'Wedding Bangles', 'Antique Bangles', 'Valaikaappu Bangles', 'Artificial Flowers', 'Gift Box Combo'].map(cat => (
                                <Link
                                  key={cat} to={`/category/${encodeURIComponent(cat)}`} onClick={() => setSearchOpen(false)}
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
                                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {product.images && product.images[0] ? (
                                    <img
                                      src={product.images[0].url}
                                      alt={product.name}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = logoImg;
                                        e.currentTarget.style.objectFit = 'contain';
                                        e.currentTarget.style.padding = '5px';
                                      }}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <img src={logoImg} alt="PrettyGlitz" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }} />
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

              {/* Wishlist Link with Live Badge Counter */}
              <Link
                to="/wishlist"
                style={{
                  position: 'relative',
                  color: pathname === '/wishlist' ? 'var(--accent)' : 'var(--text-secondary)',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = pathname === '/wishlist' ? 'var(--accent)' : 'var(--text-secondary)'}
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart
                  size={20}
                  style={pathname === '/wishlist' ? { fill: 'var(--accent)', stroke: 'var(--accent)' } : {}}
                />
                {wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: -2,
                      background: '#E11D48',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 2px 8px rgba(225, 29, 72, 0.45)',
                      pointerEvents: 'none',
                      lineHeight: 1,
                      border: '1.5px solid var(--nav-bg)',
                    }}
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </motion.span>
                )}
              </Link>

              {/* User / Account Icon */}
              <Link
                to={user ? '/account' : '/login'}
                style={{ position: 'relative', color: user ? 'var(--accent)' : 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = user ? 'var(--accent)' : 'var(--text-secondary)'}
                title={user ? `Account: ${user.name || user.mobile}` : 'Login'}
              >
                <User size={20} />
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

                {/* Bangles Level 1 Accordion */}
                <div style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: isAnyBanglesActive
                    ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(196,56,108,0.04)')
                    : 'transparent',
                  border: `1px solid ${isAnyBanglesActive ? 'var(--border)' : 'transparent'}`,
                  marginTop: 3,
                  marginBottom: 3,
                }}>
                  <button
                    type="button"
                    onClick={() => setMobileBanglesOpen(!mobileBanglesOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isAnyBanglesActive ? 'var(--accent)' : 'var(--text)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        Bangles
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'linear-gradient(135deg, rgba(196,56,108,0.12), rgba(138,43,226,0.12))',
                        color: 'var(--accent)',
                        padding: '1px 6px',
                        borderRadius: 999,
                      }}>
                        4 Styles
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        transition: 'transform 0.25s ease',
                        transform: mobileBanglesOpen ? 'rotate(180deg)' : 'none',
                        color: isAnyBanglesActive ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileBanglesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          overflow: 'hidden',
                          paddingLeft: 12,
                          paddingRight: 8,
                          paddingBottom: 8,
                          borderLeft: `2px solid var(--accent)`,
                          marginLeft: 14,
                          marginBottom: 6,
                        }}
                      >
                        {/* Level 2: Designer Glass Bangles Accordion */}
                        <div style={{ marginTop: 2, marginBottom: 4 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: 6,
                              background: isDesignerBanglesActive
                                ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)')
                                : 'transparent',
                            }}
                          >
                            <Link
                              to="/category/Designer%20Glass%20Bangles"
                              onClick={() => setIsOpen(false)}
                              style={{
                                flex: 1,
                                padding: '7px 8px',
                                fontSize: '0.92rem',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                color: isDesignerBanglesActive ? 'var(--accent)' : 'var(--text)',
                                textDecoration: 'none',
                              }}
                            >
                              Designer Glass Bangles
                            </Link>
                            <button
                              type="button"
                              onClick={() => setMobileDesignerSubsOpen(!mobileDesignerSubsOpen)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '7px 10px',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              aria-label="Toggle Designer Glass Bangles subcategories"
                            >
                              <ChevronDown
                                size={14}
                                style={{
                                  transition: 'transform 0.2s',
                                  transform: mobileDesignerSubsOpen ? 'rotate(180deg)' : 'none',
                                }}
                              />
                            </button>
                          </div>

                          <AnimatePresence initial={false}>
                            {mobileDesignerSubsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                  overflow: 'hidden',
                                  paddingLeft: 12,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 2,
                                  marginTop: 2,
                                  borderLeft: `1px dashed var(--border)`,
                                  marginLeft: 10,
                                }}
                              >
                                <Link
                                  to="/category/Designer%20Glass%20Bangles"
                                  onClick={() => setIsOpen(false)}
                                  style={{
                                    fontSize: '0.82rem',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 600,
                                    color: 'var(--accent)',
                                    textDecoration: 'none',
                                    padding: '5px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <span>View All Designer Glass Bangles</span>
                                  <ChevronRight size={12} />
                                </Link>
                                {bangleSubcategories.map((sub) => {
                                  const subParam = sub._id || sub.name;
                                  const isSubActive = decodedPathname.includes(sub.name);
                                  return (
                                    <Link
                                      key={sub._id || sub.name}
                                      to={`/category/Designer%20Glass%20Bangles?sub=${encodeURIComponent(subParam)}`}
                                      onClick={() => setIsOpen(false)}
                                      style={{
                                        fontSize: '0.84rem',
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: isSubActive ? 700 : 500,
                                        color: isSubActive ? 'var(--accent)' : 'var(--text-secondary)',
                                        textDecoration: 'none',
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 4,
                                          height: 4,
                                          borderRadius: '50%',
                                          background: isSubActive ? 'var(--accent)' : 'currentColor',
                                          opacity: isSubActive ? 1 : 0.4,
                                        }}
                                      />
                                      <span>{sub.name}</span>
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Other 3 Bangle Categories as Direct Links */}
                        {[
                          'Valaikaappu Bangles',
                          'Antique Bangles',
                          'Wedding Bangles',
                        ].map((catName) => {
                          const isCatActive = decodedPathname === `/category/${catName}`;
                          return (
                            <Link
                              key={catName}
                              to={`/category/${encodeURIComponent(catName)}`}
                              onClick={() => setIsOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 8px',
                                borderRadius: 6,
                                fontSize: '0.92rem',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                color: isCatActive ? 'var(--accent)' : 'var(--text)',
                                textDecoration: 'none',
                                background: isCatActive
                                  ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,17,24,0.04)')
                                  : 'transparent',
                              }}
                            >
                              <span>{catName}</span>
                              <ChevronRight size={13} opacity={0.4} />
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remaining Categories: Artificial Flowers, Jumkhas, Gift Box Combo, Jewels */}
                {nonBangleCats.map((name) => {
                  const isActive = decodeURIComponent(pathname) === `/category/${name}`;
                  return (
                    <Link
                      key={name}
                      to={`/category/${encodeURIComponent(name)}`}
                      onClick={() => setIsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: isActive ? 'var(--bg-secondary)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text)',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                        {name}
                      </span>
                      <ChevronRight size={14} opacity={0.4} />
                    </Link>
                  );
                })}

                {/* Wishlist */}
                <Link to="/wishlist" onClick={() => setIsOpen(false)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8, marginTop: 4,
                  background: pathname === '/wishlist' ? 'var(--bg-secondary)' : 'transparent',
                  color: pathname === '/wishlist' ? 'var(--accent)' : 'var(--text)',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Heart size={18} style={pathname === '/wishlist' ? { fill: 'var(--accent)', stroke: 'var(--accent)' } : {}} />
                    <span style={{ fontSize: '1rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Wishlist</span>
                  </div>
                  {wishlistCount > 0 ? (
                    <span style={{
                      background: '#E11D48',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      boxShadow: '0 2px 8px rgba(225, 29, 72, 0.45)',
                    }}>
                      {wishlistCount}
                    </span>
                  ) : (
                    <ChevronRight size={14} opacity={0.4} />
                  )}
                </Link>

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
