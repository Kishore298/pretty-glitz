import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';
import { ArrowRight, ChevronDown, Sparkles, Gem, Star, Heart, Flower2, Gift, Crown, Award, MessageCircle } from 'lucide-react';

const catGradients = [
  { from: 'rgba(255,20,147,0.12)', to: 'rgba(138,43,226,0.04)', accent: '#FF1493', ring: '#FF1493' },
  { from: 'rgba(138,43,226,0.12)', to: 'rgba(99,102,241,0.04)', accent: '#8A2BE2', ring: '#8A2BE2' },
  { from: 'rgba(255,140,0,0.12)', to: 'rgba(255,215,0,0.04)', accent: '#FF8C00', ring: '#FF8C00' },
  { from: 'rgba(255,0,255,0.1)', to: 'rgba(218,112,214,0.04)', accent: '#FF00FF', ring: '#FF00FF' },
  { from: 'rgba(16,185,129,0.1)', to: 'rgba(52,211,153,0.04)', accent: '#10B981', ring: '#10B981' },
  { from: 'rgba(245,158,11,0.1)', to: 'rgba(252,211,77,0.04)', accent: '#F59E0B', ring: '#F59E0B' },
  { from: 'rgba(239,68,68,0.1)', to: 'rgba(252,165,165,0.04)', accent: '#EF4444', ring: '#EF4444' },
  { from: 'rgba(99,102,241,0.1)', to: 'rgba(165,180,252,0.04)', accent: '#6366F1', ring: '#6366F1' },
];

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
  const { isDark } = useTheme();
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
    try {
      const { data } = await api.get('/products?isOffer=true');
      setOffers(data.slice(0, 4));
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');

      setCollections(data.map((c, i) => ({
        name: c.name,
        bannerImage: c.bannerImage,
        gradient: catGradients[i % catGradients.length],
      })));
    } catch (err) { console.error(err); }
  };

  const textPrimary = isDark ? '#f0f0f8' : '#0f0f12';
  const textSec = isDark ? '#8888a8' : '#6b6b80';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <div style={{ background: 'transparent', transition: 'background 0.3s' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient gradient blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(138,43,226,0.22) 0%, transparent 70%)',
            top: '5%', left: '-10%', pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,20,147,0.18) 0%, transparent 70%)',
            bottom: '5%', right: '-10%', pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,140,0,0.12) 0%, transparent 70%)',
            top: '40%', right: '30%', pointerEvents: 'none',
          }}
        />

        <div style={{ textAlign: 'center', maxWidth: 900, padding: '0 24px', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <p style={{
              fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: '#FF1493', fontWeight: 600, marginBottom: 20,
            }}>
              Premium Accessories
            </p>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 900,
              fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
              lineHeight: 1.05, margin: '0 0 24px',
              color: textPrimary,
            }}>
              Beauty in{' '}
              <span style={{
                background: 'linear-gradient(90deg, #FF1493, #8A2BE2, #FF8C00, #FFD700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Every Detail
              </span>
            </h1>
            <p style={{
              fontSize: '1.1rem', color: textSec, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7,
            }}>
              Discover exquisite bangles, everlasting artificial flowers, and premium hair accessories crafted for your most precious moments.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => collectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #FF1493, #8A2BE2)',
                color: 'white', padding: '14px 32px',
                borderRadius: 999, fontWeight: 600, border: 'none', cursor: 'pointer',
                fontSize: '0.9rem', letterSpacing: '0.04em',
                boxShadow: '0 8px 30px rgba(138,43,226,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,43,226,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(138,43,226,0.4)'; }}
            >
              Explore Collection <ChevronDown size={16} />
            </button>
            <Link
              to="/products"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent',
                color: textPrimary, padding: '14px 32px',
                borderRadius: 999, fontWeight: 600, textDecoration: 'none',
                fontSize: '0.9rem', letterSpacing: '0.04em',
                border: `1px solid ${border}`,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Browse All
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Collections Grid ──────────────────────────────────── */}
      <section ref={collectionsRef} style={{ padding: '100px 24px', maxWidth: 1280, margin: '0 auto', scrollMarginTop: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p style={{ color: '#FF1493', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            Our Collections
          </p>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)', color: textPrimary, margin: 0,
          }}>
            Explore Our Collections
          </h2>
          <p style={{ color: textSec, fontSize: '0.95rem', marginTop: 12 }}>Click any collection to start exploring</p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {collections.map((col, idx) => (
            <motion.div
              key={col.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.7 }}
            >
              <Link to={`/category/${col.name}`} style={{ textDecoration: 'none', display: 'block' }}>
                {col.bannerImage ? (
                  <div
                    style={{
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                      borderRadius: 20,
                      cursor: 'pointer', transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      display: 'flex', flexDirection: 'column', height: '100%', minHeight: 280,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = `0 20px 60px ${col.gradient.from.replace('0.12', '0.25')}`;
                      e.currentTarget.style.borderColor = col.gradient.ring + '50';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
                    }}
                  >
                    <div style={{ height: 180, width: '100%', overflow: 'hidden' }}>
                      <img src={optimizeImageUrl(col.bannerImage, { width: 400, height: 300, crop: 'fill' })} alt={col.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                        fontSize: '1.4rem', color: textPrimary, margin: '0 0 12px',
                      }}>
                        {col.name}
                      </h3>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: col.gradient.accent, fontWeight: 600, fontSize: '0.85rem',
                        letterSpacing: '0.04em',
                      }}>
                        Explore <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, ${col.gradient.from}, ${col.gradient.to})`
                        : `linear-gradient(135deg, ${col.gradient.from.replace('0.12', '0.08')}, ${col.gradient.to.replace('0.04', '0.02')})`,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                      borderRadius: 20, padding: '40px 32px',
                      cursor: 'pointer', transition: 'all 0.3s ease',
                      position: 'relative', overflow: 'hidden',
                      minHeight: 220,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = `0 20px 60px ${col.gradient.from.replace('0.12', '0.25')}`;
                      e.currentTarget.style.borderColor = col.gradient.ring + '50';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
                    }}
                  >
                    {/* Decorative ring */}
                    <div style={{
                      position: 'absolute', top: -40, right: -40,
                      width: 160, height: 160, borderRadius: '50%',
                      border: `1px solid ${col.gradient.ring}30`,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute', top: -20, right: -20,
                      width: 100, height: 100, borderRadius: '50%',
                      border: `1px solid ${col.gradient.ring}20`,
                      pointerEvents: 'none',
                    }} />

                    <div style={{
                      width: 48, height: 48, borderRadius: 12, marginBottom: 20,
                      background: `linear-gradient(135deg, ${col.gradient.accent}, ${col.gradient.accent}80)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 4px 20px ${col.gradient.accent}40`,
                    }}>
                      {catIcons[col.name] || <Sparkles size={24} />}
                    </div>

                    <h3 style={{
                      fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                      fontSize: '1.4rem', color: textPrimary, margin: '0 0 24px',
                    }}>
                      {col.name}
                    </h3>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: col.gradient.accent, fontWeight: 600, fontSize: '0.85rem',
                      letterSpacing: '0.04em',
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
      {offers.length > 0 && (
        <section style={{ padding: '80px 24px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p style={{ color: '#FF1493', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                Special Deals
              </p>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: 'clamp(1.2rem, 4vw, 2.2rem)', color: textPrimary, margin: 0,
              }}>
                Exclusive Offers
              </h2>
            </motion.div>
            <Link to="/offers" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: textPrimary, fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', borderBottom: `2px solid ${textPrimary}`, paddingBottom: 2
            }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="product-grid-4">
            {offers.map((product, idx) => (
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
        <section style={{ padding: '80px 0', background: isDark ? 'rgba(12, 12, 22, 0.6)' : 'rgba(250, 250, 250, 0.6)', borderTop: `1px solid ${border}`, overflow: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56, padding: '0 24px' }}
          >
            <p style={{ color: '#FF8C00', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
              Hand-Picked
            </p>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: textPrimary, margin: 0,
            }}>
              Flagship Collection
            </h2>
            <div style={{
              width: 60, height: 3, borderRadius: 999, margin: '20px auto 0',
              background: 'linear-gradient(90deg, #FF1493, #FFD700)',
            }} />
          </motion.div>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="scrolling-carousel" style={{ display: 'flex', gap: 24, width: 'max-content', padding: '8px 24px' }}>
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
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
        }}>
          {[
            { icon: <Award size={34} color="#F59E0B" strokeWidth={1.5} />, title: 'Premium Quality', desc: 'Every piece is curated with care for exceptional craftsmanship.' },
            { icon: <Sparkles size={34} color="#FF1493" strokeWidth={1.5} />, title: 'Unique Designs', desc: 'Exclusive collections you won\'t find anywhere else.' },
            { icon: <MessageCircle size={34} color="#10B981" strokeWidth={1.5} />, title: 'Easy Ordering', desc: 'Simple WhatsApp-based ordering with instant confirmation.' },
            { icon: <Heart size={34} color="#EF4444" strokeWidth={1.5} />, title: 'Made with Love', desc: 'Passion-driven accessories that celebrate your beauty.' },
          ].map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>{icon}</div>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: textPrimary, margin: '0 0 8px' }}>
                {title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: textSec, margin: 0, lineHeight: 1.6 }}>
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
