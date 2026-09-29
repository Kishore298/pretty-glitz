import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  const { isDark } = useTheme();

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
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40,
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
            <p style={{ color: textSec, fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 200 }}>
              Beauty in every detail. Premium accessories for your most precious moments.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Shop
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Bangles', 'Artificial Flowers', 'Jewels'].map(cat => (
                <li key={cat}>
                  <Link to={`/category/${cat}`} style={{ color: textSec, textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FF1493'}
                    onMouseLeave={e => e.currentTarget.style.color = textSec}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Help
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'My Account', to: '/account', isLink: true },
                { label: 'Cart', to: '/cart', isLink: true },
                { label: 'Contact Us', to: '/#', isLink: false },
              ].map(item => (
                <li key={item.label}>
                  {item.isLink
                    ? <Link to={item.to} style={{ color: textSec, textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#FF1493'}
                        onMouseLeave={e => e.currentTarget.style.color = textSec}
                      >{item.label}</Link>
                    : <a href={item.to} style={{ color: textSec, textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#FF1493'}
                        onMouseLeave={e => e.currentTarget.style.color = textSec}
                      >{item.label}</a>
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: textPrimary, marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Follow Us
            </h4>
            <a href="/#" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              color: 'white', padding: '8px 16px', borderRadius: 8,
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> Instagram
            </a>
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
