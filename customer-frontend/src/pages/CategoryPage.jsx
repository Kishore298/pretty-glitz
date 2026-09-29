import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeSub, setActiveSub] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('newest');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-pos-${categoryName}`, window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoryName]);

  // Restore scroll position
  useEffect(() => {
    if (!loading) {
      const savedScroll = sessionStorage.getItem(`scroll-pos-${categoryName}`);
      if (savedScroll) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 10);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [loading, categoryName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        api.get(`/products?category=${encodeURIComponent(categoryName)}`),
        categoryName === 'artifical flowers' ? api.get(`/subcategories`) : Promise.resolve({ data: [] })
      ]);
      setProducts(prodRes.data);
      setSubcategories(subRes.data);
      setActiveSub('All');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredProducts = products
    .filter(p => activeSub === 'All' || p.subcategoryId?._id === activeSub)
    .sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div style={{ minHeight: '100vh', paddingTop: 75, paddingBottom: 100 }}>
      {/* Category Banner */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginBottom: 16 }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.1rem, 4vw, 2.5rem)',
            color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: 0,
          }}
        >
          {categoryName}
        </motion.h1>
      </div>

      {/* Subcategory Nav */}
      {categoryName === 'artifical flowers' && subcategories.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 32, overflowX: 'auto', paddingBottom: 16 }} className="no-scrollbar justify-start md:justify-center">
            <button 
              onClick={() => setActiveSub('All')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                color: activeSub === 'All' ? 'var(--text)' : 'var(--text-secondary)',
                fontWeight: activeSub === 'All' ? 700 : 500,
                paddingBottom: 8,
                borderBottom: activeSub === 'All' ? `2px solid var(--text)` : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              All
            </button>
            {subcategories.map(sub => (
              <button 
                key={sub._id}
                onClick={() => setActiveSub(sub._id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: activeSub === sub._id ? 'var(--text)' : 'var(--text-secondary)',
                  fontWeight: activeSub === sub._id ? 700 : 500,
                  paddingBottom: 8,
                  borderBottom: activeSub === sub._id ? `2px solid var(--text)` : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', marginBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%'
        }}>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--bg-secondary)', borderRadius: 999, padding: '8px 12px',
            border: '1px solid var(--border)', flexShrink: 0
          }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer', maxWidth: '100px', textOverflow: 'ellipsis'
              }}
            >
              <option value="newest" style={{ color: '#000' }}>Newest Arrivals</option>
              <option value="price-asc" style={{ color: '#000' }}>Price: Low to High</option>
              <option value="price-desc" style={{ color: '#000' }}>Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--border-strong)',
              borderTopColor: '#FF1493',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No products found in this collection.
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '40px 24px',
            }}
          >
            {filteredProducts.map((product, idx) => (
              <motion.div key={product._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CategoryPage;
