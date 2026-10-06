import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Heart, MapPin, Mail, Phone, Send } from 'lucide-react';
import api from '../utils/api';

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
    <footer style={{
      background: isDark ? '#0B0B10' : '#F5F0EA',
      borderTop: `1px solid var(--border)`,
      padding: '64px 24px 32px', transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40,
          marginBottom: 48,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                letterSpacing: '0.05em', fontSize: '1rem',
                background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                PrettyGlitz
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 240 }}>
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
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 0 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '10px 0 0 10px',
                      background: 'var(--input-bg)', border: `1px solid var(--border)`,
                      borderRight: 'none', color: 'var(--text)', fontSize: '0.8rem',
                      outline: 'none', minWidth: 0,
                    }}
                  />
                  <button type="submit" style={{
                    padding: '10px 14px', borderRadius: '0 10px 10px 0',
                    background: 'var(--accent-gradient)', border: 'none',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    transition: 'opacity 0.2s',
                  }}>
                    <Send size={14} />
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
                  <Link to={`/category/${cat.name}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
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
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <MapPin size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                <span>Tamil Nadu, India</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Mail size={16} style={{ color: '#8A2BE2', flexShrink: 0 }} />
                <a href="mailto:hello@prettyglitz.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#8A2BE2'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >hello@prettyglitz.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Phone size={16} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
                <span>WhatsApp for Orders</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
                <a href="https://instagram.com/prettyglitz" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2743'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >@prettyglitz</a>
              </li>
            </ul>

            {/* Trust indicators */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid var(--border)` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {['WhatsApp Ordering', 'All-India Delivery', 'Secure & Trusted'].map(badge => (
                  <span key={badge} style={{
                    fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
                    padding: '4px 10px', borderRadius: 999,
                    border: `1px solid var(--border)`,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
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
          borderTop: `1px solid var(--border)`, paddingTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} PrettyGlitz. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            Made with <Heart size={12} style={{ color: 'var(--accent)' }} fill="var(--accent)" /> by PrettyGlitz
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
