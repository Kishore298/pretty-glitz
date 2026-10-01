import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';


const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const sortedProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 100 }}>
      {/* Category Banner */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginBottom: 40 }}>
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
        ) : sortedProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No products found in this collection.
          </motion.div>
        ) : subcategories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {subcategories.map((sub, sIdx) => {
              const subProducts = sortedProducts.filter(p => p.subcategoryId?._id === sub._id || p.subcategoryId === sub._id);
              if (subProducts.length === 0) return null;
              
              return (
                <motion.div key={sub._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIdx * 0.1 }}>
                  <h2 style={{
                    fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 24,
                    paddingBottom: 12, borderBottom: '1px solid var(--border)'
                  }}>
                    {sub.name}
                  </h2>
                  <div className="product-grid-4">
                    {subProducts.map((product, idx) => (
                      <motion.div key={product._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="product-grid-4"
          >
            {sortedProducts.map((product, idx) => (
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
