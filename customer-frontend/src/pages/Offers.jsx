import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
    window.scrollTo(0, 0);
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await api.get('/products?isOffer=true');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100 }}>
      {/* Banner */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginBottom: 40 }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.2rem, 5vw, 3.5rem)',
            color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: 0,
          }}
        >
          Special Offers
        </motion.h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: '0.9rem' }}>
          Explore our exclusive deals and discounted collections.
        </p>
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
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No special offers available at the moment. Check back later!
          </motion.div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '32px 24px',
          }}>
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
