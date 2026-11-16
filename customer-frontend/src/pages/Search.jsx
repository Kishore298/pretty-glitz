import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Sparkles, ArrowRight } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (query) fetchResults();
    else { setResults([]); setLoading(false); }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
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
    <div style={{ minHeight: '100vh', paddingTop: 'calc(var(--nav-height, 76px) + 20px)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', marginBottom: 20, color: 'var(--accent)' }}>
            <SearchIcon size={28} />
          </div>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {query ? 'Search Results' : 'Explore Collections'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 10 }}>
            {query ? (
              <>Showing matches for <span style={{ color: 'var(--text)', fontWeight: 600 }}>"{query}"</span></>
            ) : (
              "Browse all our handcrafted collections or search for specific designs above"
            )}
          </p>
        </div>
        
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 && query ? (
          <div style={{ textAlign: 'center', padding: '40px 0 60px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 32 }}>
              No products found matching "{query}". Try browsing our collections:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
              {categories.map((cat) => (
                <Link
                  key={cat._id || cat.name}
                  to={`/category/${encodeURIComponent(cat.name)}`}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 999,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        ) : !query ? (
          /* When no query is entered, showcase all database categories */
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Sparkles size={16} color="var(--accent-gold, #C9A84C)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                All Boutique Categories
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat._id || cat.name}
                  to={`/category/${encodeURIComponent(cat.name)}`}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 14,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Explore Collection
                    </div>
                  </div>
                  <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Search;
