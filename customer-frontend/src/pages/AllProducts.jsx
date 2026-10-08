import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

const CategoryAccordion = ({ category, products, subcategories }) => {
  const [isOpen, setIsOpen] = useState(true); // Open by default

  return (
    <div style={{ marginBottom: 32, borderBottom: '1px solid var(--border)' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: 'pointer', padding: '16px 0' 
        }}
      >
        <h2 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {category.name}
        </h2>
        <div style={{ color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: 40 }}>
              {subcategories && subcategories.length > 0 ? (
                subcategories.map(sub => {
                  const subProducts = products.filter(p => p.subcategoryId?._id === sub._id || p.subcategoryId === sub._id);
                  if (subProducts.length === 0) return null;
                  return (
                    <div key={sub._id} style={{ marginTop: 32 }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {sub.name}
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </h3>
                      <div className="product-grid-4">
                        {subProducts.map((p, idx) => (
                          <motion.div 
                            key={p._id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <ProductCard product={p} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="product-grid-4" style={{ marginTop: 24 }}>
                  {products.map((p, idx) => (
                    <motion.div 
                      key={p._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                  {products.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center' }}>No products in this category yet.</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AllProducts = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, subRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
        api.get('/subcategories')
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setSubcategories(subRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, paddingBottom: 100 }}>
      {/* ── Banner ────────────────────────────────────────────── */}
      <div className="page-banner" style={{ 
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid var(--border)`,
        position: 'relative'
      }}>
        {/* Decorative background blob */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '60vw', height: '60vw', maxWidth: 800, maxHeight: 800,
          background: 'radial-gradient(circle, rgba(138,43,226,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div className="section-padding" style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              fontSize: '0.8rem', color: 'var(--text-muted)', 
              marginBottom: 16, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' 
            }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--accent)' }}>All Products</span>
            </div>

            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--text)', 
              margin: 0,
            }}>
              Complete Collection
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginTop: 12, fontSize: '0.95rem' 
            }}>
              Explore our complete collection of exquisite accessories and elegant jewelry.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="section-padding" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 1280, margin: '0 auto' }}>
        {loading ? (
          <div>
            <div style={{ height: 60, borderBottom: '1px solid var(--border)', marginBottom: 32 }} />
            <div className="product-grid-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton product-skeleton" />
              ))}
            </div>
          </div>
        ) : (
          <div>
            {categories.map(cat => (
              <CategoryAccordion 
                key={cat._id}
                category={cat}
                products={products.filter(p => p.category === cat.name)}
                subcategories={cat.name.toLowerCase() === 'artificial flowers' ? subcategories : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
