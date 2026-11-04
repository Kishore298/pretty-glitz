import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Filter, Sparkles } from 'lucide-react';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Normalize legacy category routes to Designer Glass Bangles
  const isLegacyBangles = /^(glass\s+bangles|bangles)$/i.test(categoryName || '');
  const normalizedCategory = isLegacyBangles ? 'Designer Glass Bangles' : categoryName;

  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc

  const activeSubParam = searchParams.get('sub') || 'all';

  useEffect(() => {
    if (isLegacyBangles) {
      navigate('/category/Designer%20Glass%20Bangles', { replace: true });
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

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

  const getSortedProducts = (prods) => {
    return [...prods].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });
  };

  // Find active subcategory document if filtered
  const activeSubDoc = subcategories.find(
    (s) => s._id.toString() === activeSubParam || s.name.toLowerCase() === activeSubParam.toLowerCase()
  );

  // Products filtered by selected subcategory chip
  const displayedProducts = activeSubDoc
    ? products.filter((p) => {
        const pSubId = (p.subcategoryId?._id || p.subcategoryId)?.toString();
        return pSubId === activeSubDoc._id.toString();
      })
    : products;

  const handleSubSelect = (subId) => {
    if (subId === 'all') {
      searchParams.delete('sub');
      setSearchParams(searchParams);
    } else {
      searchParams.set('sub', subId);
      setSearchParams(searchParams);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--nav-height, 76px) + 8px)', paddingBottom: 100 }}>
      {/* Main Container */}
      <div className="section-padding" style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Category Header */}
        <div className="category-header" style={{ 
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, padding: '10px 0 16px', 
          borderBottom: '1px solid var(--border)', marginBottom: 20
        }}>
          {/* Left Side Breadcrumbs & Title */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 min-content' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              fontSize: '0.72rem', color: 'var(--text-muted)', 
              marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' 
            }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-prettyglitz">Home</Link>
              <ChevronRight size={12} />
              {activeSubDoc ? (
                <>
                  <Link
                    to={`/category/${encodeURIComponent(normalizedCategory)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubSelect('all');
                    }}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    className="hover:text-prettyglitz"
                  >
                    {normalizedCategory}
                  </Link>
                  <ChevronRight size={12} />
                  <span style={{ color: 'var(--accent)' }}>{activeSubDoc.name}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>{normalizedCategory}</span>
              )}
            </div>

            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--text)', margin: '0 0 4px', lineHeight: 1
            }}>
              {activeSubDoc ? `${normalizedCategory} — ${activeSubDoc.name}` : normalizedCategory}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
              {displayedProducts.length} {displayedProducts.length === 1 ? 'Product' : 'Products'} Available
            </p>
          </motion.div>

          {/* Right Side Sort */}
          {!loading && displayedProducts.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 300, marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
              </div>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8, flex: 1,
                  background: 'var(--bg)', border: `1px solid var(--border-strong)`,
                  color: 'var(--text)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 500
                }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </motion.div>
          )}
        </div>

        {/* Subcategory Filter Tabs (for categories that support subcategories) */}
        {!loading && subcategories.length > 0 && (
          <div
            className="subcategory-filter-pills"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 16,
              marginBottom: 28,
              WebkitOverflowScrolling: 'touch',
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
            {subcategories.map((sub) => {
              const isSelected = activeSubDoc && activeSubDoc._id.toString() === sub._id.toString();
              const count = products.filter(
                (p) => (p.subcategoryId?._id || p.subcategoryId)?.toString() === sub._id.toString()
              ).length;

              return (
                <button
                  key={sub._id}
                  onClick={() => handleSubSelect(sub._id.toString())}
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
        ) : !activeSubDoc && subcategories.length > 0 ? (
          /* Main category view with rollup: grouped sections per subcategory + unassigned pieces */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {subcategories.map((sub, sIdx) => {
              const subProducts = getSortedProducts(
                products.filter(
                  (p) => (p.subcategoryId?._id || p.subcategoryId)?.toString() === sub._id.toString()
                )
              );
              if (subProducts.length === 0) return null;

              return (
                <motion.div key={sub._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.08 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{
                      fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)',
                      fontFamily: 'Outfit, sans-serif', margin: 0,
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <Sparkles size={16} color="var(--accent)" />
                      {sub.name}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({subProducts.length})
                      </span>
                    </h2>
                    <button
                      onClick={() => handleSubSelect(sub._id.toString())}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      View Only {sub.name} <ChevronRight size={14} />
                    </button>
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
              const subcatIds = new Set(subcategories.map((s) => s._id.toString()));
              const unassigned = getSortedProducts(
                products.filter((p) => {
                  const pSubId = (p.subcategoryId?._id || p.subcategoryId)?.toString();
                  return !pSubId || !subcatIds.has(pSubId);
                })
              );
              if (unassigned.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 style={{
                    fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    Signature Atelier Pieces
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({unassigned.length})
                    </span>
                  </h2>
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
          <motion.div layout className="product-grid-4">
            <AnimatePresence>
              {getSortedProducts(displayedProducts).map((product, idx) => (
                <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
