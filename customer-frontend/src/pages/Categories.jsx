import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/pretty-glitz-logo.png';

const Categories = () => {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    const hasRestoreState = Boolean(
      window.history.state?.usr?.restoreScrollY !== undefined
    );
    if (!hasRestoreState) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div
      className="categories-page"
      style={{
        paddingBottom: 60,
        background: isDark
          ? 'radial-gradient(ellipse at 50% 0%, rgba(196, 56, 108, 0.08) 0%, rgba(10, 10, 16, 0) 70%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(223, 184, 71, 0.07) 0%, rgba(253, 250, 245, 0) 70%)',
      }}
    >
      <div className="section-padding" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Breadcrumb Bar */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={11} className="separator" />
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>All Collections</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="collections-header-wrap"
        >
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent)',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Curated Elegance
          </p>
          <p
            className="collection-tagline"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)',
              maxWidth: 480,
              margin: '6px auto 0',
              lineHeight: 1.4,
              padding: '0 12px',
            }}
          >
            Discover handcrafted bangles and timeless jewellery.
          </p>
        </motion.div>

        {/* Collections Grid — Exactly matches Home page category section card design */}
        <div className="collection-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div className="collection-card-skeleton" key={index}>
                <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                </div>
                <div
                  style={{
                    padding: 16,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div className="skeleton" style={{ height: 20, width: '65%', marginBottom: 10, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 4 }} />
                </div>
              </div>
            ))
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category._id || category.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.5 }}
              >
                <Link
                  to={`/category/${encodeURIComponent(category.name)}`}
                  style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                >
                  <div
                    className="theme-card"
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={
                          category.bannerImage
                            ? optimizeImageUrl(category.bannerImage, {
                              width: 600,
                              height: 450,
                              crop: 'fill',
                              gravity: 'auto',
                            })
                            : logoImg
                        }
                        alt={category.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = logoImg;
                          event.currentTarget.style.objectFit = 'contain';
                          event.currentTarget.style.padding = '24px';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: category.bannerImage ? 'cover' : 'contain',
                          padding: category.bannerImage ? 0 : '24px',
                          transition: 'transform 0.5s ease',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    </div>

                    <div
                      className="collection-card-content"
                      style={{
                        padding: 16,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: 'var(--bg-card)',
                      }}
                    >
                      <h3
                        className="collection-card-title"
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 700,
                          color: 'var(--text)',
                          margin: '0 0 4px',
                        }}
                      >
                        {category.name}
                      </h3>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          color: 'var(--accent)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        Explore <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
