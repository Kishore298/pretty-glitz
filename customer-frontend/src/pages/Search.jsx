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
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      const lowerQuery = query.toLowerCase();
      
      // If the query is just "offers", simulate an offers fetch
      if (lowerQuery === 'offers') {
         const offers = data.filter(p => p.isOffer);
         setResults(offers);
      } else {
         const filtered = data.filter(p => 
           p.name.toLowerCase().includes(lowerQuery) || 
           (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
           (p.description && p.description.toLowerCase().includes(lowerQuery))
         );
         setResults(filtered);
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', marginBottom: 24, color: 'var(--accent)' }}>
            <SearchIcon size={28} />
          </div>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Search Results
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 12 }}>
            {query ? (
              <>Showing matches for <span style={{ color: 'var(--text)', fontWeight: 600 }}>"{query}"</span></>
            ) : (
              "Please enter a search term"
            )}
          </p>
        </div>
        
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton product-skeleton" />
            ))}
          </div>
        ) : results.length === 0 && query ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            No products found matching your search. Try different keywords.
          </div>
        ) : results.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="product-grid-4"
          >
            {results.map((product, idx) => (
              <motion.div key={product._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default Search;
