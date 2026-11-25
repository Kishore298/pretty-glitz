import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Filter, Sparkles, Check } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals', shortLabel: '✨ Newest', icon: '✨' },
  { value: 'price-asc', label: 'Price: Low to High', shortLabel: 'Price ⬆', icon: '↑' },
  { value: 'price-desc', label: 'Price: High to Low', shortLabel: 'Price ⬇', icon: '↓' },
  { value: 'size-asc', label: 'Size: Small to Large', shortLabel: 'Size ⬆', icon: '↑' },
  { value: 'size-desc', label: 'Size: Large to Small', shortLabel: 'Size ⬇', icon: '↓' },
];

const CategoryPage = () => {
  const { categoryName, subcategoryName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Normalize legacy category routes to Designer Glass Bangles
  const isLegacyBangles = /^(glass\s+bangles|bangles)$/i.test(categoryName || '');
  const normalizedCategory = isLegacyBangles ? 'Designer Glass Bangles' : categoryName;
  const isDesignerGlassBangles = /^(designer\s+)?glass\s+bangles$/i.test(normalizedCategory || '');

  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);
  const [selectedSub, setSelectedSub] = useState(subcategoryName || searchParams.get('sub') || 'all');

  // Dismiss sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sortOpen]);

  // Sync selectedSub when navigating via browser back/forward or direct route param changes
  useEffect(() => {
    setSelectedSub(subcategoryName || searchParams.get('sub') || 'all');
  }, [subcategoryName, searchParams]);

  // Only trigger network fetch when categoryName itself changes, avoiding jarring reloads when filtering subcategories
  useEffect(() => {
    if (isLegacyBangles) {
      navigate('/category/Designer%20Glass%20Bangles', { replace: true });
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const activeSubParam = selectedSub;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        api.get(`/products?category=${encodeURIComponent(normalizedCategory)}`),
        api.get(`/subcategories?category=${encodeURIComponent(normalizedCategory)}`).catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data || []);
      setSubcategories(subRes.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getProductSizes = (p) => {
    const sizes = [];
    if (Array.isArray(p.sizes)) {
      p.sizes.forEach((s) => {
        const val = typeof s === 'object' ? s.size : s;
        if (val) sizes.push(val);
      });
    }
    if (Array.isArray(p.colorVariants)) {
      p.colorVariants.forEach((cv) => {
        if (Array.isArray(cv.sizes)) {
          cv.sizes.forEach((s) => {
            const val = typeof s === 'object' ? s.size : s;
            if (val) sizes.push(val);
          });
        }
      });
    }
    return sizes
      .map((s) => {
        const m = String(s).match(/(\d+(\.\d+)?)/);
        return m ? parseFloat(m[1]) : null;
      })
      .filter((n) => n !== null);
  };

  const getSortedProducts = (prods) => {
    return [...prods].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'size-asc') {
        const aSizes = getProductSizes(a);
        const bSizes = getProductSizes(b);
        const aMin = aSizes.length ? Math.min(...aSizes) : 999999;
        const bMin = bSizes.length ? Math.min(...bSizes) : 999999;
        if (aMin !== bMin) return aMin - bMin;
      }
      if (sortBy === 'size-desc') {
        const aSizes = getProductSizes(a);
        const bSizes = getProductSizes(b);
        const aMax = aSizes.length ? Math.max(...aSizes) : -1;
        const bMax = bSizes.length ? Math.max(...bSizes) : -1;
        if (aMax !== bMax) return bMax - aMax;
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });
  };

  // Derive all active subcategories, ensuring any subcategories present on products
  // (e.g. Daily Wear Bangles, Velvet Finish Bangles) are included even if subcategories API returns empty
  const resolvedSubcategories = React.useMemo(() => {
    const list = [...subcategories];
    const existingIds = new Set(list.map((s) => s._id?.toString()));
    const existingNames = new Set(list.map((s) => s.name?.toLowerCase()));

    // Collect from products
    products.forEach((p) => {
      if (p.subcategoryId && typeof p.subcategoryId === 'object' && p.subcategoryId.name) {
        const idStr = p.subcategoryId._id?.toString();
        const nameLower = p.subcategoryId.name.toLowerCase();
        if (!existingIds.has(idStr) && !existingNames.has(nameLower)) {
          list.push({ _id: idStr || p.subcategoryId.name, name: p.subcategoryId.name });
          if (idStr) existingIds.add(idStr);
          existingNames.add(nameLower);
        }
      }
    });

    // For Designer Glass Bangles, ensure standard subcategories are recognized if present in data
    if (/glass\s+bangles|bangles/i.test(normalizedCategory)) {
      const defaults = ['Daily Wear Bangles', 'Velvet Finish Bangles'];
      defaults.forEach((defName) => {
        if (!existingNames.has(defName.toLowerCase())) {
          // Check if any product has this in subcategoryId or name
          const hasMatchingProduct = products.some(
            (p) =>
              (p.subcategoryId?.name && p.subcategoryId.name.toLowerCase() === defName.toLowerCase()) ||
              p.name.toLowerCase().includes(defName.toLowerCase())
          );
          if (hasMatchingProduct) {
            list.push({ _id: defName, name: defName });
            existingNames.add(defName.toLowerCase());
          }
        }
      });
    }

    return list;
  }, [subcategories, products, normalizedCategory]);

  // Find active subcategory document if filtered
  const activeSubDoc = resolvedSubcategories.find(
    (s) => s._id.toString() === activeSubParam || s.name.toLowerCase() === activeSubParam.toLowerCase()
  );

  // Matcher function to test if product belongs to subcategory
  const productMatchesSubcategory = (p, sub) => {
    if (!sub || !p) return false;
    const subId = sub._id?.toString();
    const subName = sub.name?.toLowerCase();

    const pSubId = (p.subcategoryId?._id || p.subcategoryId)?.toString();
    if (pSubId && subId && pSubId === subId) return true;

    const pSubName = p.subcategoryId?.name?.toLowerCase();
    if (pSubName && subName && pSubName === subName) return true;

    if (subName && p.name && p.name.toLowerCase().includes(subName)) return true;

    return false;
  };

  // Products filtered by selected subcategory chip
  const displayedProducts = activeSubDoc
    ? products.filter((p) => productMatchesSubcategory(p, activeSubDoc))
    : products;

  const handleSubSelect = (subIdOrName) => {
    if (subIdOrName === 'all') {
      setSelectedSub('all');
      window.history.replaceState(null, '', `/category/${encodeURIComponent(normalizedCategory)}`);
    } else {
      const targetSub = resolvedSubcategories.find(
        (s) => s._id?.toString() === subIdOrName?.toString() || s.name?.toLowerCase() === subIdOrName?.toString().toLowerCase()
      );
      const name = targetSub ? targetSub.name : subIdOrName;
      setSelectedSub(name);
      window.history.replaceState(null, '', `/category/${encodeURIComponent(normalizedCategory)}/${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="category-page" style={{ paddingBottom: 60 }}>
      {/* Main Container */}
      <div className="section-padding" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Breadcrumb Bar */}
        <div className="category-breadcrumb-bar">
          <Link to="/">Home</Link>
          {activeSubDoc && (
            <>
              <ChevronRight size={11} className="separator" />
              <Link to={`/category/${encodeURIComponent(normalizedCategory)}`}>{normalizedCategory}</Link>
            </>
          )}
        </div>

        {/* Category Header */}
        <div className="category-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'nowrap', gap: 12, padding: '0 0 10px',
          borderBottom: '1px solid var(--border)', marginBottom: 12
        }}>
          {/* Left Side Title */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(1.15rem, 3.2vw, 1.75rem)', color: 'var(--text)', margin: '0 0 2px', lineHeight: 1.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {activeSubDoc ? `${normalizedCategory} — ${activeSubDoc.name}` : normalizedCategory}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', margin: 0, fontWeight: 500 }}>
              {displayedProducts.length} {displayedProducts.length === 1 ? 'Product' : 'Products'} Available
            </p>
          </motion.div>

          {/* Right Side Compact Custom Sort Filter */}
          {!loading && displayedProducts.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ flexShrink: 0 }}>
              <div ref={sortRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSortOpen((prev) => !prev)}
                  aria-label="Sort products"
                  aria-expanded={sortOpen}
                  className={`pg-sort-trigger-btn ${sortOpen ? 'is-open' : ''}`}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {(SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0]).shortLabel}
                  </span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: sortOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>

                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="pg-sort-menu-dropdown"
                    >
                      <div style={{ padding: '3px 8px 5px', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Sort Products
                      </div>
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = sortBy === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.value);
                              setSortOpen(false);
                            }}
                            className={`pg-sort-item-btn ${isSelected ? 'is-active' : ''}`}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.82rem', width: 14, textAlign: 'center' }}>{opt.icon}</span>
                              <span>{opt.label}</span>
                            </span>
                            {isSelected && <Check size={13} style={{ color: 'var(--accent)', strokeWidth: 2.5 }} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {/* Subcategory Filter Tabs (for categories that support subcategories) */}
        {!loading && resolvedSubcategories.length > 0 && (
          <div
            className="subcategory-filter-pills"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              marginBottom: 6,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              onClick={() => handleSubSelect('all')}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: !activeSubDoc ? 'var(--accent)' : 'var(--bg-card)',
                color: !activeSubDoc ? '#FFFFFF' : 'var(--text-secondary)',
                border: !activeSubDoc ? '1px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.15s ease',
              }}
            >
              All Pieces ({products.length})
            </button>
            {resolvedSubcategories.map((sub) => {
              const isSelected = activeSubDoc && (activeSubDoc._id?.toString() === sub._id?.toString() || activeSubDoc.name === sub.name);
              const count = products.filter((p) => productMatchesSubcategory(p, sub)).length;

              return (
                <button
                  key={sub._id || sub.name}
                  onClick={() => handleSubSelect(sub._id?.toString() || sub.name)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{sub.name}</span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      opacity: isSelected ? 0.9 : 0.6,
                      fontWeight: 700,
                    }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Filter size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', color: 'var(--text)', margin: '0 0 8px' }}>
              No Products Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              {activeSubDoc
                ? `No products currently assigned to "${activeSubDoc.name}".`
                : "We're currently updating this collection. Check back soon."}
            </p>
            {activeSubDoc && (
              <button
                onClick={() => handleSubSelect('all')}
                className="btn-secondary"
                style={{ marginTop: 16 }}
              >
                View All {normalizedCategory}
              </button>
            )}
          </motion.div>
        ) : !activeSubDoc && resolvedSubcategories.length > 0 && !isDesignerGlassBangles ? (
          /* Main category view: grouped sections per subcategory + unassigned pieces */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {resolvedSubcategories.map((sub, sIdx) => {
              const subProducts = getSortedProducts(
                products.filter((p) => productMatchesSubcategory(p, sub))
              );
              if (subProducts.length === 0) return null;

              return (
                <motion.div key={sub._id || sub.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.08 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{
                      fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)', fontWeight: 700, color: 'var(--text)',
                      fontFamily: '"Cormorant Garamond", Georgia, serif', margin: 0,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <Sparkles size={15} color="var(--accent)" />
                      {sub.name}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({subProducts.length})
                      </span>
                    </h2>
                  </div>
                  <div className="product-grid-4">
                    <AnimatePresence>
                      {subProducts.map((product, idx) => (
                        <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            {/* Any products not tagged with subcategories */}
            {(() => {
              const unassigned = getSortedProducts(
                products.filter((p) => !resolvedSubcategories.some((sub) => productMatchesSubcategory(p, sub)))
              );
              if (unassigned.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{
                      fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)', fontWeight: 700, color: 'var(--text)',
                      fontFamily: '"Cormorant Garamond", Georgia, serif', margin: 0,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      Signature Collection
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({unassigned.length})
                      </span>
                    </h2>
                  </div>
                  <div className="product-grid-4">
                    <AnimatePresence>
                      {unassigned.map((product, idx) => (
                        <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        ) : (
          /* Single Grid view (when specific subcategory is selected OR category has no subcategories) */
          <div>
            <motion.div layout className="product-grid-4">
              <AnimatePresence>
                {getSortedProducts(displayedProducts).map((product, idx) => (
                  <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
