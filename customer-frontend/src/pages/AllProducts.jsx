import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
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
            <div style={{ paddingBottom: 32 }}>
              {subcategories && subcategories.length > 0 ? (
                subcategories.map(sub => {
                  const subProducts = products.filter(p => p.subcategoryId?._id === sub._id);
                  if (subProducts.length === 0) return null;
                  return (
                    <div key={sub._id} style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: 16 }}>{sub.name}</h3>
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
                <div className="product-grid-4" style={{ marginTop: 16 }}>
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
                  {products.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No products in this category yet.</p>}
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '120px 24px 60px', maxWidth: 1280, margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
          All Products
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Explore our complete collection of exquisite bangles, artificial flowers, and elegant jewelry.
        </p>
      </div>

      <div>
        {categories.map(cat => (
          <CategoryAccordion 
            key={cat._id}
            category={cat}
            products={products.filter(p => p.category === cat.name)}
            subcategories={cat.name.toLowerCase() === 'artifical flowers' ? subcategories : null}
          />
        ))}
      </div>
    </div>
  );
};

export default AllProducts;
