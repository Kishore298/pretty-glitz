import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24
    }}>
      <div style={{
        background: '#141419', border: '1px solid #1e1e28',
        borderRadius: 16, padding: '32px 32px 24px', width: '100%', maxWidth: 400,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#8a8aa0', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: type === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(138,43,226,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: type === 'danger' ? '#ef4444' : '#8a2be2'
          }}>
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ margin: 0, color: '#f0f0f5', fontSize: '1.25rem', fontWeight: 700 }}>
            {title}
          </h3>
        </div>
        
        <p style={{ color: '#8a8aa0', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 32 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            style={{ 
              flex: 1, 
              background: type === 'danger' ? '#ef4444' : 'linear-gradient(135deg, #FF1493, #8A2BE2)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
