import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
    window.scrollTo(0, 0);
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products?isOffer=true');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, paddingBottom: 100 }}>
      {/* ── Banner ────────────────────────────────────────────── */}
      <div style={{ 
        height: 280, 
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid var(--border)`,
        position: 'relative'
      }}>
        {/* Decorative background blob */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '60vw', height: '60vw', maxWidth: 800, maxHeight: 800,
          background: 'radial-gradient(circle, rgba(255,20,147,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', width: '100%' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              fontSize: '0.8rem', color: 'var(--text-muted)', 
              marginBottom: 16, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' 
            }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--accent)' }}>Offers</span>
            </div>

            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 700,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--text)', 
              margin: 0,
            }}>
              Special Offers
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginTop: 12, fontSize: '0.95rem' 
            }}>
              Explore our exclusive deals and discounted collections.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Product Grid ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '40px auto 0', padding: '0 24px' }}>
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 350 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No special offers available at the moment. Check back later!
          </motion.div>
        ) : (
          <div className="product-grid-4">
            {products.map((p, i) => (
              <motion.div 
                key={p._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
