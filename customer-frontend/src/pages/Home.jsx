import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ArrowRight, ChevronDown, Sparkles, Gem, Star, Heart, Flower2, Gift, Crown, MessageCircle } from 'lucide-react';

const catIcons = {
  'Bangles': <Sparkles size={24} />,
  'Glass Bangles': <Gem size={24} />,
  'Valaikaappu Bangles': <Star size={24} />,
  'Antique Bangles': <Crown size={24} />,
  'Wedding Bangles': <Heart size={24} />,
  'Artificial Flowers': <Flower2 size={24} />,
  'Gift Box Combo': <Gift size={24} />,
  'Jumkhas': <Star size={24} />,
  'Jewels': <Crown size={24} />,
};

const Home = () => {
  const [flagship, setFlagship] = useState([]);
  const [offers, setOffers] = useState([]);
  const [collections, setCollections] = useState([]);
  
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  
  const collectionsRef = useRef(null);

  useEffect(() => {
    fetchFlagship();
    fetchOffers();
    fetchCategories();
  }, []);

  const fetchFlagship = async () => {
    try {
      const { data } = await api.get('/products?isFlagship=true');
      setFlagship(data);
    } catch (err) { console.error(err); }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const { data } = await api.get('/products?isOffer=true');
      setOffers(data.slice(0, 4));
    } catch (err) { console.error(err); }
    setLoadingOffers(false);
  };

  const fetchCategories = async () => {
    setLoadingCollections(true);
    try {
      const { data } = await api.get('/categories');
      setCollections(data.map(c => ({
        name: c.name,
        bannerImage: c.bannerImage,
      })));
    } catch (err) { console.error(err); }
    setLoadingCollections(false);
  };

  return (
    <div style={{ background: 'transparent' }}>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'min(85vh, 700px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 80,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 900, padding: '0 24px', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <p style={{
              fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'var(--accent)', fontWeight: 700, marginBottom: 24,
            }}>
              Premium Accessories
            </p>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600,
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.1, margin: '0 0 24px',
              color: 'var(--text)',
            }}>
              Beauty in{' '}
              <span style={{
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Every Detail
              </span>
            </h1>
            <p style={{
              fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7,
            }}>
              Discover exquisite bangles, everlasting artificial flowers, and premium jewels crafted for your most precious moments.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
          >
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => collectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--accent-gradient)',
                  color: 'white', padding: '14px 36px',
                  borderRadius: 999, fontWeight: 600, border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', letterSpacing: '0.04em',
                  boxShadow: '0 8px 24px rgba(196,56,108,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(196,56,108,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,56,108,0.3)'; }}
              >
                Explore Collection <ChevronDown size={16} />
              </button>
              <Link
                to="/search"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'transparent',
                  color: 'var(--text)', padding: '14px 36px',
                  borderRadius: 999, fontWeight: 600, textDecoration: 'none',
                  fontSize: '0.9rem', letterSpacing: '0.04em',
                  border: `1px solid var(--border-strong)`,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Browse All
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
              fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500,
              marginTop: 12
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="var(--accent-gold)" /> Premium Quality
              </span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--accent-gold)' }}>🚚</span> All-India Delivery
              </span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#25D366' }}>💬</span> Order via WhatsApp
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Collections Grid ──────────────────────────────────── */}
      <section ref={collectionsRef} style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto', scrollMarginTop: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <p style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            Our Collections
          </p>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600,
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--text)', margin: 0,
          }}>
            Explore Our Collections
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {loadingCollections ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 320 }} />
            ))
          ) : collections.map((col, idx) => (
            <motion.div
              key={col.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
            >
              <Link to={`/category/${col.name}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                {col.bannerImage ? (
                  <div
                    className="theme-card"
                    style={{
                      borderRadius: 20, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 320,
                    }}
                  >
                    <div style={{ height: 220, width: '100%', overflow: 'hidden' }}>
                      <img 
                        src={optimizeImageUrl(col.bannerImage, { width: 600, height: 400, crop: 'fill', gravity: 'auto' })} 
                        alt={col.name} 
                        loading="lazy" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-card)' }}>
                      <h3 style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                        fontSize: '1.2rem', color: 'var(--text)', margin: '0 0 8px',
                      }}>
                        {col.name}
                      </h3>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem',
                      }}>
                        Explore <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="theme-card"
                    style={{
                      borderRadius: 20, padding: '40px 32px',
                      position: 'relative', overflow: 'hidden',
                      height: '100%', minHeight: 320,
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, marginBottom: 24,
                      background: 'var(--bg-secondary)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {catIcons[col.name] || <Sparkles size={24} />}
                    </div>

                    <h3 style={{
                      fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                      fontSize: '1.4rem', color: 'var(--text)', margin: '0 0 16px',
                    }}>
                      {col.name}
                    </h3>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem',
                    }}>
                      Explore <ArrowRight size={14} />
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Offers Section ────────────────────────────────── */}
      {(loadingOffers || offers.length > 0) && (
        <section style={{ padding: '60px 24px 80px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                Special Deals
              </p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600,
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', margin: 0,
              }}>
                Exclusive Offers
              </h2>
            </motion.div>
            <Link to="/search?q=offers" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', borderBottom: `2px solid var(--text)`, paddingBottom: 2
            }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="product-grid-4">
            {loadingOffers ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 350 }} />
              ))
            ) : offers.map((product, idx) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Flagship Carousel ────────────────────────────────── */}
      {flagship.length > 0 && (
        <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderTop: `1px solid var(--border)` }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48, padding: '0 24px' }}
          >
            <p style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
              Hand-Picked
            </p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--text)', margin: 0,
            }}>
              Flagship Collection
            </h2>
          </motion.div>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="scrolling-carousel" style={{ display: 'flex', gap: 24, width: 'max-content', padding: '16px 24px' }}>
              {[...flagship, ...flagship, ...flagship, ...flagship].map((product, idx) => (
                <div key={idx} style={{ width: 280, flexShrink: 0 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand Values ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40,
        }}>
          {[
            { icon: <Crown size={32} color="var(--accent-gold)" strokeWidth={1.5} />, title: 'Premium Quality', desc: 'Every piece is curated with care for exceptional craftsmanship.' },
            { icon: <Sparkles size={32} color="var(--accent)" strokeWidth={1.5} />, title: 'Unique Designs', desc: 'Exclusive collections you won\'t find anywhere else.' },
            { icon: <MessageCircle size={32} color="#10B981" strokeWidth={1.5} />, title: 'Easy Ordering', desc: 'Simple WhatsApp-based ordering with instant confirmation.' },
            { icon: <Heart size={32} color="#EF4444" strokeWidth={1.5} />, title: 'Made with Love', desc: 'Passion-driven accessories that celebrate your beauty.' },
          ].map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)', width: 64, height: 64, borderRadius: '50%', alignItems: 'center', margin: '0 auto 16px' }}>{icon}</div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', margin: '0 0 10px' }}>
                {title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
