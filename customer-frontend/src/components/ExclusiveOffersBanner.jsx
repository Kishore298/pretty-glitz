import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ExclusiveOffersBanner = ({ className = '' }) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/subscribers', {
        email: trimmed,
        source: 'exclusive_offers_banner',
      });

      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Thank you for subscribing! Check your inbox for exclusive updates.');
        setEmail('');
      } else {
        setErrorMessage(res.data?.message || 'Subscription could not be processed. Please try again.');
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      if (status === 409) {
        // Already subscribed
        setErrorMessage(msg || "You're already subscribed to PrettyGlitz exclusive offers!");
      } else if (msg) {
        setErrorMessage(msg);
      } else {
        setErrorMessage('Failed to connect. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`exclusive-offers-section ${className}`}
      style={{
        maxWidth: 1280,
        margin: '50px auto 40px',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="exclusive-offers-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          padding: '48px 30px',
          textAlign: 'center',
          background: isDark
            ? 'linear-gradient(135deg, rgba(20, 18, 30, 0.95) 0%, rgba(32, 22, 38, 0.92) 50%, rgba(20, 18, 30, 0.95) 100%)'
            : 'linear-gradient(135deg, #FFF9FA 0%, #FFF3F7 50%, #FCF5EC 100%)',
          border: isDark ? '1px solid rgba(201, 168, 76, 0.22)' : '1.5px solid rgba(196, 56, 108, 0.16)',
          boxShadow: isDark
            ? '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 16px 40px rgba(196, 56, 108, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Decorative background glows */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '20%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,56,108,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: '20%',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              background: isDark ? 'rgba(196, 56, 108, 0.18)' : 'rgba(196, 56, 108, 0.08)',
              border: '1px solid rgba(196, 56, 108, 0.25)',
              color: 'var(--accent, #C4386C)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} />
            <span>VIP Access & Insider Perks</span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.85rem, 3.4vw, 2.5rem)',
              fontWeight: 700,
              margin: '0 0 12px',
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            Get Exclusive Offers & Seasonal Previews
          </h2>

          <p
            style={{
              fontSize: '0.94rem',
              color: isDark ? 'rgba(255, 255, 255, 0.72)' : '#665C52',
              lineHeight: 1.65,
              margin: '0 auto 28px',
              maxWidth: 520,
            }}
          >
            Be the first to receive secret flash sales, early access to new designer bangles, and personalized jewellery recommendations directly to your inbox.
          </p>

          {/* Subscription Form */}
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 24px',
                borderRadius: 14,
                background: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                color: isDark ? '#6EE7B7' : '#065F46',
                fontSize: '0.92rem',
                fontWeight: 600,
              }}
            >
              <Check size={20} color="#10B981" />
              <span>{successMessage}</span>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                gap: 10,
                maxWidth: 480,
                margin: '0 auto',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flex: '1 1 280px',
                  minWidth: 0,
                }}
              >
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter your email address"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: 12,
                    border: errorMessage
                      ? '1.5px solid #EF4444'
                      : isDark
                      ? '1.5px solid rgba(255, 255, 255, 0.15)'
                      : '1.5px solid rgba(0, 0, 0, 0.12)',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent, #C4386C)';
                  }}
                  onBlur={(e) => {
                    if (!errorMessage) {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 26px',
                  borderRadius: 12,
                  background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(196, 56, 108, 0.35)',
                  transition: 'all 0.2s ease',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Claim Offers</span>
                )}
              </button>
            </form>
          )}

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                color: '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Reassurance text */}
          <p
            style={{
              fontSize: '0.75rem',
              color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#998E82',
              marginTop: 14,
              marginBottom: 0,
            }}
          >
            🔒 We respect your privacy. No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExclusiveOffersBanner;
