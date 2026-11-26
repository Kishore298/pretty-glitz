import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, AlertCircle, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { optimizeImageUrl } from '../utils/cloudinary';

/**
 * CartToastContainer
 *
 * Renders luxury floating toast notifications for cart operations
 * (item added, removed, quantity updated, or cart cleared).
 */
export const CartToastContainer = ({ toasts = [], onDismiss }) => {
  const { isDark } = useTheme();

  return (
    <div
      className="cart-toast-portal"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxWidth: 'min(92vw, 380px)',
        width: '100%',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error' || toast.type === 'warning';
          const isRemoval = toast.type === 'removal' || toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                background: isDark
                  ? 'rgba(18, 14, 22, 0.96)'
                  : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isDark
                  ? '1.5px solid rgba(196, 56, 108, 0.35)'
                  : '1.5px solid rgba(196, 56, 108, 0.22)',
                borderRadius: 14,
                boxShadow: isDark
                  ? '0 12px 36px rgba(0, 0, 0, 0.55), 0 2px 10px rgba(196, 56, 108, 0.25)'
                  : '0 12px 32px rgba(196, 56, 108, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Product Thumbnail or Status Icon */}
              {toast.image ? (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <img
                    src={optimizeImageUrl(toast.image, 120)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isError
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isRemoval
                      ? 'rgba(196, 56, 108, 0.12)'
                      : 'rgba(16, 185, 129, 0.15)',
                    color: isError
                      ? '#ef4444'
                      : isRemoval
                      ? 'var(--accent, #C4386C)'
                      : '#10b981',
                  }}
                >
                  {isError ? (
                    <AlertCircle size={20} />
                  ) : isRemoval ? (
                    <Trash2 size={18} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
              )}

              {/* Text Content */}
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: isError
                      ? '#ef4444'
                      : 'var(--accent, #C4386C)',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  <ShoppingBag size={13} />
                  <span>{toast.title || 'Shopping Bag'}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text)',
                    fontWeight: 500,
                    marginTop: 2,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {toast.message}
                </div>

                {/* View Bag Link */}
                {toast.showViewCart !== false && (
                  <Link
                    to="/cart"
                    onClick={() => onDismiss && onDismiss(toast.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--accent, #C4386C)',
                      textDecoration: 'none',
                      marginTop: 4,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    <span>View Bag</span>
                    <ArrowRight size={11} />
                  </Link>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => onDismiss && onDismiss(toast.id)}
                aria-label="Dismiss toast"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  opacity: 0.65,
                  transition: 'opacity 0.15s ease',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .cart-toast-portal {
            bottom: calc(var(--bottom-nav-height, 64px) + 14px) !important;
            right: 12px !important;
            left: 12px !important;
            max-width: calc(100vw - 24px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(CartToastContainer);
