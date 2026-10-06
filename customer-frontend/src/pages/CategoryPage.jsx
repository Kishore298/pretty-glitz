import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ChevronRight, Filter } from 'lucide-react';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes, catRes] = await Promise.all([
        api.get(`/products?category=${encodeURIComponent(categoryName)}`),
        categoryName.toLowerCase() === 'artificial flowers' ? api.get(`/subcategories`) : Promise.resolve({ data: [] }),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setSubcategories(subRes.data);
      
      // Find the specific category details for banner image
      const cat = catRes.data.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (cat) setCategoryData(cat);
      
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
      {/* ── Category Banner ──────────────────────────────────── */}
      <div style={{ 
        height: 280, 
        position: 'relative', 
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: `1px solid var(--border)`
      }}>
        {categoryData?.bannerImage && (
          <>
            <img 
              src={optimizeImageUrl(categoryData.bannerImage, { width: 1920, height: 400, crop: 'fill', gravity: 'auto' })} 
              alt={categoryName} 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
          </>
        )}
        
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              fontSize: '0.8rem', color: categoryData?.bannerImage ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', 
              marginBottom: 16, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' 
            }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={14} />
              <span style={{ color: categoryData?.bannerImage ? 'white' : 'var(--accent)' }}>{categoryName}</span>
            </div>

            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: categoryData?.bannerImage ? 'white' : 'var(--text)', 
              margin: 0,
            }}>
              {categoryName}
            </h1>
            <p style={{ 
              color: categoryData?.bannerImage ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', 
              marginTop: 12, fontSize: '0.95rem' 
            }}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 24px' }}>
        
        {/* Filter / Sort Bar */}
        {!loading && products.length > 0 && (
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', 
            marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid var(--border)` 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Filter size={18} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  background: 'var(--bg)', border: `1px solid var(--border-strong)`,
                  color: 'var(--text)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 500
                }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 350 }} />
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
