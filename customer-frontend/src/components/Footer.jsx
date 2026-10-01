import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Heart, MapPin, Mail, Phone } from 'lucide-react';
import api from '../utils/api';

const Footer = () => {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);

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

  const bg = isDark ? '#0b0b0e' : '#f8f8fc';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f0f8' : '#0f0f12';
  const textSec = isDark ? '#8888a8' : '#6b6b80';

  return (
    <footer style={{
      background: bg, borderTop: `1px solid ${border}`,
      padding: '64px 24px 32px', transition: 'background 0.3s',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40,
          marginBottom: 48,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg, #FF1493, #8A2BE2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                letterSpacing: '0.05em', fontSize: '1rem',
                background: 'linear-gradient(90deg, #FF1493, #8A2BE2, #FF8C00)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                PrettyGlitz
              </span>
            </div>
            <p style={{ color: textSec, fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 240 }}>
              Beauty in every detail. Premium accessories for your most precious moments.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Shop
            </h4>
            <ul style={{ 
              listStyle: 'none', padding: 0, margin: 0, 
              columnCount: 2, columnGap: 24 
            }}>
              {categories.map(cat => (
                <li key={cat._id} style={{ breakInside: 'avoid', marginBottom: 14 }}>
                  <Link to={`/category/${cat.name}`} style={{ color: textSec, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FF1493'}
                    onMouseLeave={e => e.currentTarget.style.color = textSec}
                  >
                    {cat.name}
                  </Link>

                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Contact Us
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: textSec, fontSize: '0.85rem', lineHeight: 1.5 }}>
                <MapPin size={16} style={{ color: '#FF1493', marginTop: 2, flexShrink: 0 }} />
                <span>123 Sparkle Avenue, Fashion District<br/>Jewel City, JC 10001</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: textSec, fontSize: '0.85rem' }}>
                <Mail size={16} style={{ color: '#8A2BE2', flexShrink: 0 }} />
                <a href="mailto:hello@prettyglitz.com" style={{ color: textSec, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#8A2BE2'}
                  onMouseLeave={e => e.currentTarget.style.color = textSec}
                >hello@prettyglitz.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: textSec, fontSize: '0.85rem' }}>
                <Phone size={16} style={{ color: '#FF8C00', flexShrink: 0 }} />
                <a href="tel:+1234567890" style={{ color: textSec, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FF8C00'}
                  onMouseLeave={e => e.currentTarget.style.color = textSec}
                >+1 (234) 567-890</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: textSec, fontSize: '0.85rem' }}>
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
                <a href="https://instagram.com/prettyglitz" target="_blank" rel="noreferrer" style={{ color: textSec, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2743'}
                  onMouseLeave={e => e.currentTarget.style.color = textSec}
                >@prettyglitz</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div style={{
          borderTop: `1px solid ${border}`, paddingTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: textSec, fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} PrettyGlitz. All rights reserved.
          </p>
          <p style={{ color: textSec, fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            Made with <Heart size={12} style={{ color: '#FF1493' }} fill="#FF1493" /> by PrettyGlitz
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
