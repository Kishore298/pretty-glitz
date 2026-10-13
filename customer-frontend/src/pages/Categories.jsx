import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Gem, Star, Heart, Flower2, Gift, Crown } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';

const catIcons = {
  'Bangles': <Sparkles size={28} />,
  'Glass Bangles': <Gem size={28} />,
  'Valaikaappu Bangles': <Star size={28} />,
  'Antique Bangles': <Crown size={28} />,
  'Wedding Bangles': <Heart size={28} />,
  'Artificial Flowers': <Flower2 size={28} />,
  'Gift Box Combo': <Gift size={28} />,
  'Jumkhas': <Star size={28} />,
  'Jewels': <Crown size={28} />,
};

const catGradients = [
  { from: '#1a0a10', to: '#2d0a1e', accent: '#C4386C' },
  { from: '#0a0a1a', to: '#0d0d2d', accent: '#6C38C4' },
  { from: '#0f0a00', to: '#1f1500', accent: '#D6A85F' },
  { from: '#001a0a', to: '#001f15', accent: '#38C4A0' },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    window.scrollTo(0, 0);
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
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 40 }}>
      <div className="section-padding" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, paddingTop: 16 }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Explore
          </p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 700, color: 'var(--text)', margin: 0,
          }}>
            All Collections
          </h1>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="product-grid-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="category-card-skeleton">
                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div className="skeleton" style={{ height: 16, width: '55%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 16, width: 16, borderRadius: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid-4">
            {categories.map((cat, i) => {
              const gradient = catGradients[i % catGradients.length];
              return (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/category/${encodeURIComponent(cat.name)}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{
                      borderRadius: 16, overflow: 'hidden',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                      transition: 'transform 0.25s, box-shadow 0.25s',
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
                      }}
                    >
                      {/* Image */}
                      <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cat.bannerImage ? (
                          <img
                            src={optimizeImageUrl(cat.bannerImage, { width: 400, height: 225, crop: 'fill' })}
                            alt={cat.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: `linear-gradient(135deg, ${gradient.accent}, ${gradient.accent}80)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white',
                          }}>
                            {catIcons[cat.name] || <Sparkles size={28} />}
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
                          {cat.name}
                        </h3>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
