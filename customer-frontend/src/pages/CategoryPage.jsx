import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Filter } from 'lucide-react';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        api.get(`/products?category=${encodeURIComponent(categoryName)}`),
        categoryName.toLowerCase() === 'artificial flowers' ? api.get(`/subcategories`) : Promise.resolve({ data: [] })
      ]);
      setProducts(prodRes.data);
      setSubcategories(subRes.data);
      
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

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, paddingBottom: 100 }}>
      {/* Main Container */}
      <div className="section-padding" style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Category Header */}
        <div className="category-header" style={{ 
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, padding: '24px 0 16px', 
          borderBottom: '1px solid var(--border)', marginBottom: 24
        }}>
          {/* Left Side */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 min-content' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              fontSize: '0.7rem', color: 'var(--text-muted)', 
              marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' 
            }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-prettyglitz">Home</Link>
              <ChevronRight size={12} />
              <span style={{ color: 'var(--text-secondary)' }}>{categoryName}</span>
            </div>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--text)', margin: '0 0 4px', lineHeight: 1
            }}>
              {categoryName}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
            </p>
          </motion.div>

          {/* Right Side */}
          {!loading && products.length > 0 && (
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

        {/* Product Grid */}
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton product-skeleton" />
            ))}
          </div>
        ) : products.length === 0 ? (
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
              We're currently updating this collection. Check back soon.
            </p>
          </motion.div>
        ) : subcategories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {subcategories.map((sub, sIdx) => {
              const subProducts = getSortedProducts(products.filter(p => p.subcategoryId?._id === sub._id || p.subcategoryId === sub._id));
              if (subProducts.length === 0) return null;
              
              return (
                <motion.div key={sub._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.1 }}>
                  <h2 style={{
                    fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    {sub.name}
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </h2>
                  <div className="product-grid-4">
                    <AnimatePresence>
                      {subProducts.map((product, idx) => (
                        <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}>
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div layout className="product-grid-4">
            <AnimatePresence>
              {getSortedProducts(products).map((product, idx) => (
                <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}>
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
