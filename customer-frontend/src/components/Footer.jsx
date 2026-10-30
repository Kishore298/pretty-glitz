import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Mail, Send } from 'lucide-react';
import api from '../utils/api';
import logoImg from '../assets/pretty-glitz-logo.png';
import { getWhatsAppUrl, IS_WHATSAPP_CONFIGURED } from '../config/constants';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              {/* Brand Logo - natural aspect ratio, no circular mask */}
              <img
                src={logoImg}
                alt="PrettyGlitz Logo"
                style={{
                  height: 60,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                  mixBlendMode: isDark ? 'normal' : 'multiply',
                }}
              />
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                letterSpacing: '0.04em', fontSize: '1.65rem',
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
                {/* Official WhatsApp SVG Icon */}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {IS_WHATSAPP_CONFIGURED ? (
                  <a
                    href={getWhatsAppUrl() || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#25D366'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                  >
                    WhatsApp for Orders
                  </a>
                ) : (
                  <a
                    href="https://wa.me/?text=Hello%20PrettyGlitz%2C%20I%20would%20like%20to%20inquire%20about%20your%20jewellery%20collections."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#25D366'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                  >
                    WhatsApp for Orders
                  </a>
                )}
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', fontSize: '0.85rem' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="url(#ig-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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
                <a
                  href="https://www.instagram.com/prettyglitz_collections?utm_source=ig_web_button_share_sheet&obrf=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2743'}
                  onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.8)' : '#5A4E40'}
                >
                  @prettyglitz_collections
                </a>
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
