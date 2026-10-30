import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BANGLE_SIZES = [
  { size: '2.2', inches: '2.125" (2-2/16)', mm: '54.0 mm', circ: '6.67" (16.9 cm)', fit: 'Extra Small' },
  { size: '2.4', inches: '2.250" (2-4/16)', mm: '57.2 mm', circ: '7.06" (17.9 cm)', fit: 'Small' },
  { size: '2.6', inches: '2.375" (2-6/16)', mm: '60.3 mm', circ: '7.45" (18.9 cm)', fit: 'Medium (Most Popular)' },
  { size: '2.8', inches: '2.500" (2-8/16)', mm: '63.5 mm', circ: '7.85" (19.9 cm)', fit: 'Large' },
  { size: '2.10', inches: '2.625" (2-10/16)', mm: '66.7 mm', circ: '8.24" (20.9 cm)', fit: 'Extra Large' },
];

const BangleSizeChartModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 8, 14, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: isDark ? '#14131F' : '#FFFFFF',
              borderRadius: 22,
              border: `1px solid ${isDark ? 'rgba(201, 168, 76, 0.25)' : 'rgba(196, 56, 108, 0.18)'}`,
              boxShadow: isDark
                ? '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(201, 168, 76, 0.15)'
                : '0 24px 60px rgba(196, 56, 108, 0.18)',
              padding: '28px 24px 32px',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent, #C4386C)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  <Ruler size={15} />
                  <span>Atelier Fit Guide</span>
                </div>
                <h2
                  style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: 'clamp(1.5rem, 3vw, 1.85rem)',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                  }}
                >
                  Bangle Size Guide & Sizing Chart
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Accurate dimensions to find your perfect, comfortable bangle fit.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close size chart"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 17, 24, 0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sizing Chart Table */}
            <div
              style={{
                overflowX: 'auto',
                borderRadius: 14,
                border: `1px solid var(--border)`,
                marginBottom: 22,
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 17, 24, 0.015)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(196, 56, 108, 0.06)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent, #C4386C)', whiteSpace: 'nowrap' }}>Size</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>Inner Diameter</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>Diameter (mm)</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>Hand Circumference</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>Recommended Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {BANGLE_SIZES.map((row, idx) => (
                    <tr
                      key={row.size}
                      style={{
                        borderBottom: idx < BANGLE_SIZES.length - 1 ? '1px solid var(--border)' : 'none',
                        background: idx % 2 === 1 ? (isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.015)') : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--accent-gold, #C9A84C)', fontSize: '0.9rem' }}>
                        {row.size}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{row.inches}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.mm}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.circ}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {row.fit.includes('Popular') ? (
                          <span style={{ color: 'var(--accent, #C4386C)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles size={12} /> {row.fit}
                          </span>
                        ) : (
                          row.fit
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* How to Measure Methods */}
            <div style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  margin: '0 0 12px',
                  color: 'var(--text)',
                }}
              >
                How to Measure Your Size at Home
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {/* Method 1: Existing Bangle */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 17, 24, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>📐</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Method 1: Existing Bangle</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    Take any bangle that fits you comfortably. Measure straight across the <strong>inner diameter</strong> in millimetres using a ruler. Match that measurement to our chart.
                  </p>
                </div>

                {/* Method 2: Hand Measurement */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(26, 17, 24, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>🖐️</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Method 2: Hand Knuckles</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    Bring your thumb and pinky finger together as if sliding on a bangle. Wrap a measuring tape tightly around the widest part (knuckles). Check the circumference column.
                  </p>
                </div>
              </div>
            </div>

            {/* Sizing Advice / Pro Tip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.08), rgba(201, 168, 76, 0.08))',
                border: '1px solid rgba(201, 168, 76, 0.25)',
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent-gold, #C9A84C)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5 }}>
                <strong>PrettyGlitz Styling Tip:</strong> If your measurement falls between two sizes, or if you are purchasing rigid, stone-studded bridal bangles with zero flexibility, we recommend <strong>sizing up</strong> (e.g. choose 2.6 instead of 2.4) for smooth sliding over knuckles.
              </p>
            </div>

            {/* Bottom Done Button */}
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 24px',
                  borderRadius: 10,
                  background: 'var(--accent-gradient, linear-gradient(135deg, #C4386C, #8A2BE2))',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(196, 56, 108, 0.3)',
                }}
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BangleSizeChartModal;
