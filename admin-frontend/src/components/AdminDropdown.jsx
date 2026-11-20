import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const AdminDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  title = null,
  icon = null,
  className = '',
  style = {},
  menuStyle = {},
  disabled = false,
  align = 'left', // 'left' or 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options array: handles [{ value, label, icon }], or strings, or objects with _id/name
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt), icon: null };
    }
    if (opt && typeof opt === 'object') {
      const val = opt.value !== undefined ? opt.value : (opt._id !== undefined ? opt._id : opt.name);
      const lbl = opt.label !== undefined ? opt.label : opt.name;
      return { value: val, label: lbl, icon: opt.icon || null };
    }
    return { value: '', label: '', icon: null };
  });

  const selectedOption = normalizedOptions.find(
    (o) => String(o.value) === String(value)
  );

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`admin-dropdown-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`admin-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 38,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          background: 'linear-gradient(180deg, #181726 0%, #13121F 100%)',
          border: isOpen ? '1px solid #E5C378' : '1px solid rgba(201, 168, 76, 0.28)',
          borderRadius: 10,
          color: '#FAF9FC',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: isOpen
            ? '0 0 0 2px rgba(229, 195, 120, 0.22), 0 4px 14px rgba(0,0,0,0.4)'
            : '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'all 0.18s ease',
          outline: 'none',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          {selectedOption?.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{selectedOption.icon}</span>}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#E5C378',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="admin-dropdown-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              [align === 'right' ? 'right' : 'left']: 0,
              minWidth: '100%',
              width: 'max-content',
              maxWidth: 320,
              maxHeight: 280,
              overflowY: 'auto',
              background: '#161424',
              border: '1px solid rgba(201, 168, 76, 0.32)',
              borderRadius: 12,
              padding: 5,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4)',
              zIndex: 9999,
              ...menuStyle,
            }}
          >
            {title && (
              <div
                style={{
                  padding: '4px 8px 6px',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#8E879B',
                }}
              >
                {title}
              </div>
            )}
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`admin-dropdown-item ${isSelected ? 'is-active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: isSelected ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                    color: isSelected ? '#E5C378' : '#FAF9FC',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(201, 168, 76, 0.1)';
                      e.currentTarget.style.color = '#E5C378';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#FAF9FC';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {opt.label}
                    </span>
                  </span>
                  {isSelected && (
                    <Check size={14} style={{ color: '#E5C378', strokeWidth: 2.5, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDropdown;
