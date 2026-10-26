import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X, Trash2 } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  itemName = null,
  loading = false
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  const config = {
    danger: {
      accent: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.25)',
      badgeBg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.25)',
      icon: <Trash2 size={24} className="text-red-400" />,
      btnGradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
      btnHoverShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
    },
    warning: {
      accent: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.25)',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
      icon: <AlertTriangle size={24} className="text-amber-400" />,
      btnGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      btnHoverShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
    },
    info: {
      accent: '#EC168C',
      glow: 'rgba(236, 22, 140, 0.25)',
      badgeBg: 'rgba(236, 22, 140, 0.12)',
      border: 'rgba(236, 22, 140, 0.25)',
      icon: <Info size={24} className="text-pink-400" />,
      btnGradient: 'linear-gradient(135deg, var(--accent-pink, #EC168C), var(--accent-purple, #9B3DFF))',
      btnHoverShadow: '0 8px 24px rgba(236, 22, 140, 0.45)',
    }
  };

  const currentTheme = config[type] || config.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={loading ? undefined : onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 6, 11, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              background: 'linear-gradient(180deg, #181622 0%, #111018 100%)',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 20,
              padding: '32px 28px 24px',
              boxShadow: `0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px ${currentTheme.glow}`,
              zIndex: 10000,
              overflow: 'hidden',
            }}
          >
            {/* Top Glowing Ambient Orb */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 220,
                height: 120,
                background: `radial-gradient(circle, ${currentTheme.glow} 0%, transparent 70%)`,
                filter: 'blur(20px)',
                pointerEvents: 'none',
              }}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={loading}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary, #A7A2B0)',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary, #A7A2B0)';
              }}
            >
              <X size={16} />
            </button>

            {/* Header Content */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
              {/* Animated Icon Circle */}
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.05 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: currentTheme.badgeBg,
                  border: `1px solid ${currentTheme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  boxShadow: `0 0 20px ${currentTheme.glow}`,
                }}
              >
                {currentTheme.icon}
              </motion.div>

              <h3
                id="confirm-modal-title"
                style={{
                  margin: '0 0 8px',
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--text-primary, #F7F5F8)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h3>

              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary, #A7A2B0)',
                  fontSize: '0.92rem',
                  lineHeight: 1.55,
                  maxWidth: 360,
                }}
              >
                {message}
              </p>

              {itemName && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '6px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary, #F7F5F8)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  "{itemName}"
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  color: 'var(--text-primary, #F7F5F8)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await onConfirm();
                }}
                disabled={loading}
                style={{
                  flex: 1.2,
                  padding: '12px 18px',
                  background: currentTheme.btnGradient,
                  border: 'none',
                  borderRadius: 12,
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: currentTheme.btnHoverShadow,
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.filter = 'none';
                  }
                }}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
