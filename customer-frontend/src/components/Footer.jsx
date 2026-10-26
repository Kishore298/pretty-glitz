import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Mail, Phone, Send } from 'lucide-react';
import api from '../utils/api';
import logoImg from '../assets/pretty-glitz-logo.png';

const Footer = () => {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchCatsAndSubs = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          api.get('/categories'),
          api.get('/subcategories')
        ]);

        const catMap = catRes.data.map(c => ({
          ...c,
          subcategories: subRes.data.filter(s => s.category?._id === c._id || s.category === c._id)
        }));
        setCategories(catMap);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCatsAndSubs();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="glitter-cloud-footer">
      {/* Ambient floating glitter particles overlay */}
      <div className="footer-glitter-sparkles" aria-hidden="true" />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40,
          marginBottom: 48,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #C4386C, #8A2BE2, #C9A84C)',
                padding: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(196, 56, 108, 0.35)',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <img
                  src={logoImg}
                  alt="PrettyGlitz Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                letterSpacing: '0.04em', fontSize: '1.2rem',
                background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                PrettyGlitz
              </span>
            </div>
            <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#5A4E40', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 240 }}>
              Beauty in every detail. Premium accessories for your most precious moments.
            </p>

            {/* Newsletter */}
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Get Exclusive Offers
              </p>
              {subscribed ? (
                <p style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>✓ Thank you for subscribing!</p>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 0, maxWidth: 320 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    style={{
                      flex: 1, padding: '11px 16px', borderRadius: '12px 0 0 12px',
                      background: isDark ? 'rgba(20, 20, 28, 0.8)' : 'rgba(255, 255, 255, 0.88)',
                      border: isDark ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid rgba(212, 175, 55, 0.35)',
                      borderRight: 'none', color: 'var(--text)', fontSize: '0.82rem',
                      outline: 'none', minWidth: 0,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: isDark ? 'none' : '0 2px 10px rgba(184, 134, 11, 0.06)',
                    }}
                  />
                  <button type="submit" style={{
                    padding: '11px 16px', borderRadius: '0 12px 12px 0',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(196, 56, 108, 0.3)',
                    transition: 'all 0.2s ease',
                  }}>
                    <Send size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Shop
            </h4>
            <ul style={{
              listStyle: 'none', padding: 0, margin: 0,
              columnCount: 2, columnGap: 24
            }}>
              {categories.map(cat => (
                <li key={cat._id} style={{ breakInside: 'avoid', marginBottom: 14 }}>
                  <Link to={`/category/${cat.name}`} style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Contact Us
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <MapPin size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                <span>Tamil Nadu, India</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', fontSize: '0.85rem' }}>
                <Mail size={16} style={{ color: '#8A2BE2', flexShrink: 0 }} />
                <a href="mailto:hello@prettyglitz.com" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#8A2BE2'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                >hello@prettyglitz.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', fontSize: '0.85rem' }}>
                <Phone size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                <span>WhatsApp for Orders</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', fontSize: '0.85rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="url(#ig-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="25%" stopColor="#e6683c" />
                      <stop offset="50%" stopColor="#dc2743" />
                      <stop offset="75%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <a href="https://instagram.com/prettyglitz" target="_blank" rel="noreferrer" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2743'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                >@prettyglitz</a>
              </li>
            </ul>

            {/* Trust indicators */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(212, 175, 55, 0.25)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['WhatsApp Ordering', 'All-India Delivery', 'Secure & Trusted'].map(badge => (
                  <span key={badge} style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#7A5B1E',
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    padding: '5px 12px', borderRadius: 999,
                    border: isDark ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid rgba(212, 175, 55, 0.35)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(184, 134, 11, 0.05)',
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div style={{
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(212, 175, 55, 0.25)',
          paddingTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#786C5E', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} PrettyGlitz. All rights reserved.
          </p>
          <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#786C5E', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            Crafted by <a
              href="https://kishore-portfolio-36rk.onrender.com/#home"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--accent)'}
            >Kishore</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
