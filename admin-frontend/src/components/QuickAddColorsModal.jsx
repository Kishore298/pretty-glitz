import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Sparkles, AlertCircle } from 'lucide-react';
import {
  BANGLE_COLOR_FAMILIES,
  STANDARD_BANGLE_SIZES,
  DEFAULT_ACTIVE_SIZES,
} from '../constants/banglePresets';

const QuickAddColorsModal = ({
  isOpen,
  onClose,
  existingColorNames = [],
  onGenerate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState(DEFAULT_ACTIVE_SIZES);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Set of existing lowercased colour names to prevent duplicates
  const existingSet = useMemo(() => {
    return new Set(
      (existingColorNames || []).map((n) => (n || '').trim().toLowerCase())
    );
  }, [existingColorNames]);

  // Filter colour families based on search query
  const filteredFamilies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BANGLE_COLOR_FAMILIES;

    return BANGLE_COLOR_FAMILIES.map((family) => {
      const matchingColors = family.colors.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          family.family.toLowerCase().includes(q)
      );
      return {
        ...family,
        colors: matchingColors,
      };
    }).filter((family) => family.colors.length > 0);
  }, [searchQuery]);

  const toggleColor = (color) => {
    const isAlreadyExisting = existingSet.has(color.name.toLowerCase());
    if (isAlreadyExisting) return;

    setSelectedColors((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === color.name.toLowerCase());
      if (exists) {
        return prev.filter((c) => c.name.toLowerCase() !== color.name.toLowerCase());
      } else {
        return [...prev, color];
      }
    });
  };

  const handleSelectFamily = (familyColors) => {
    const available = familyColors.filter(
      (c) => !existingSet.has(c.name.toLowerCase())
    );
    const allSelected = available.every((c) =>
      selectedColors.some((sc) => sc.name.toLowerCase() === c.name.toLowerCase())
    );

    if (allSelected) {
      // Deselect this family
      const availableNames = new Set(available.map((c) => c.name.toLowerCase()));
      setSelectedColors((prev) =>
        prev.filter((c) => !availableNames.has(c.name.toLowerCase()))
      );
    } else {
      // Select all available in family
      const newColors = [...selectedColors];
      available.forEach((c) => {
        if (!newColors.some((sc) => sc.name.toLowerCase() === c.name.toLowerCase())) {
          newColors.push(c);
        }
      });
      setSelectedColors(newColors);
    }
  };

  const toggleSize = (sz) => {
    setSelectedSizes((prev) => {
      if (prev.includes(sz)) {
        if (prev.length === 1) return prev; // Keep at least one size
        return prev.filter((s) => s !== sz);
      } else {
        return [...prev, sz].sort();
      }
    });
  };

  const handleAddCustomSize = (e) => {
    e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
      setCustomSizeInput('');
    }
  };

  const handleGenerate = () => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) return;
    onGenerate(selectedColors, selectedSizes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 4, 9, 0.82)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(180deg, #1C1B2B 0%, #13121E 100%)',
            width: '100%',
            maxWidth: 780,
            maxHeight: '90vh',
            borderRadius: 20,
            border: '1px solid rgba(201, 168, 76, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--accent-gold, #C9A84C)' }} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary, #FFFFFF)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Quick Add Multiple Colourways
                </h3>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #9CA3AF)',
                }}
              >
                1. Select colors from palette &bull; 2. Choose common sizes &bull; 3. Generate cards together
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                width: 32,
                height: 32,
                color: 'var(--text-muted, #9CA3AF)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content - Scrollable */}
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Step 1: Colours Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--accent-gold, #C9A84C)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    STEP 1
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFF' }}>
                    Select Colours ({selectedColors.length} chosen)
                  </span>
                </div>

                {selectedColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedColors([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div
                style={{
                  position: 'relative',
                  marginBottom: 14,
                }}
              >
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #6B7280)',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search color name or family (e.g. Rani, Green, Maroon)..."
                  className="admin-input"
                  style={{
                    width: '100%',
                    paddingLeft: 36,
                    height: 38,
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              {/* Palette Grouped by Family */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredFamilies.map((family) => {
                  const availableColors = family.colors.filter(
                    (c) => !existingSet.has(c.name.toLowerCase())
                  );
                  const familySelectedCount = family.colors.filter((c) =>
                    selectedColors.some(
                      (sc) => sc.name.toLowerCase() === c.name.toLowerCase()
                    )
                  ).length;

                  return (
                    <div
                      key={family.family}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--accent-gold, #C9A84C)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {family.family}
                        </span>
                        {availableColors.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSelectFamily(family.colors)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted, #9CA3AF)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {familySelectedCount === availableColors.length
                              ? 'Deselect All'
                              : 'Select All in Family'}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {family.colors.map((color) => {
                          const isAlreadyInProduct = existingSet.has(
                            color.name.toLowerCase()
                          );
                          const isSelected = selectedColors.some(
                            (c) => c.name.toLowerCase() === color.name.toLowerCase()
                          );

                          return (
                            <button
                              key={color.name}
                              type="button"
                              disabled={isAlreadyInProduct}
                              onClick={() => toggleColor(color)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                borderRadius: 10,
                                border: isSelected
                                  ? '1.5px solid var(--accent-gold, #C9A84C)'
                                  : '1px solid rgba(255, 255, 255, 0.08)',
                                background: isSelected
                                  ? 'rgba(201, 168, 76, 0.14)'
                                  : isAlreadyInProduct
                                  ? 'rgba(255, 255, 255, 0.01)'
                                  : 'rgba(255, 255, 255, 0.03)',
                                cursor: isAlreadyInProduct ? 'not-allowed' : 'pointer',
                                opacity: isAlreadyInProduct ? 0.4 : 1,
                                transition: 'all 0.15s ease',
                              }}
                              title={
                                isAlreadyInProduct
                                  ? `${color.name} is already added`
                                  : `Select ${color.name}`
                              }
                            >
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: color.hex,
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  color: isSelected
                                    ? '#FFFFFF'
                                    : 'var(--text-secondary, #D1D5DB)',
                                  fontWeight: isSelected ? 600 : 400,
                                }}
                              >
                                {color.name}
                              </span>
                              {isAlreadyInProduct && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted, #6B7280)',
                                  }}
                                >
                                  (Added)
                                </span>
                              )}
                              {isSelected && (
                                <Check
                                  size={13}
                                  style={{ color: 'var(--accent-gold, #C9A84C)' }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Common Sizes Selection */}
            <div
              style={{
                background: 'rgba(201, 168, 76, 0.04)',
                border: '1px solid rgba(201, 168, 76, 0.15)',
                borderRadius: 14,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    background: 'rgba(201, 168, 76, 0.15)',
                    color: 'var(--accent-gold, #C9A84C)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  STEP 2
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFF' }}>
                  Select Common Sizes ({selectedSizes.length} sizes)
                </span>
              </div>

              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #9CA3AF)',
                  lineHeight: 1.4,
                }}
              >
                Every generated colourway will receive these sizes. All sizes start with{' '}
                <strong style={{ color: '#F59E0B' }}>Stock: 0</strong> (Out of stock) so you can enter
                the actual stock quantities individually.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {STANDARD_BANGLE_SIZES.map((sz) => {
                  const isSzSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isSzSelected
                          ? '1.5px solid var(--accent-gold, #C9A84C)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSzSelected
                          ? 'rgba(201, 168, 76, 0.18)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSzSelected ? '#FFFFFF' : 'var(--text-secondary, #9CA3AF)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSzSelected ? `✓ ${sz}` : sz}
                    </button>
                  );
                })}

                {/* Custom size adder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    placeholder="Custom size..."
                    style={{
                      width: 90,
                      height: 32,
                      padding: '4px 8px',
                      fontSize: '0.78rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#FFF',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    style={{
                      height: 32,
                      padding: '0 10px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      color: '#FFF',
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'rgba(12, 11, 18, 0.95)',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9CA3AF)' }}>
              {selectedColors.length === 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F59E0B' }}>
                  <AlertCircle size={14} /> Select at least 1 colour to continue
                </span>
              ) : (
                <span>
                  Ready to generate <strong style={{ color: '#FFF' }}>{selectedColors.length}</strong> colourways with{' '}
                  <strong style={{ color: '#FFF' }}>{selectedSizes.length}</strong> sizes each.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedColors.length === 0 || selectedSizes.length === 0}
                onClick={handleGenerate}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.82rem',
                  gap: 8,
                  opacity: selectedColors.length === 0 || selectedSizes.length === 0 ? 0.5 : 1,
                  cursor: selectedColors.length === 0 || selectedSizes.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={15} /> Generate {selectedColors.length} Colourways
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAddColorsModal;

