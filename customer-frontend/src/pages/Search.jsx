import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) fetchResults();
    else { setResults([]); setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      const lowerQuery = query.toLowerCase();
      const filtered = data.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.category.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', marginBottom: 24, color: 'var(--text-secondary)' }}>
            <SearchIcon size={28} />
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Search Results
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 12 }}>
            Showing matches for <span style={{ color: 'var(--text)', fontWeight: 600 }}>"{query}"</span>
          </p>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: '#FF1493', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No products found matching your search. Try different keywords.
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '40px 24px' }}
          >
            {results.map((product, idx) => (
              <motion.div key={product._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Search;
