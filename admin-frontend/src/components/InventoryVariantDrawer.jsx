import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Layers, Palette, Save, RefreshCw } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';
import toast from 'react-hot-toast';

const InventoryVariantDrawer = ({
  isOpen,
  onClose,
  product,
  onSave,
  saving = false,
}) => {
  const [variantsState, setVariantsState] = useState(null);
  const [fillValue, setFillValue] = useState('');
  const [activeColorIdx, setActiveColorIdx] = useState(0);

  // Initialize editable state copy when drawer opens
  useEffect(() => {
    if (isOpen && product) {
      if (product.tier === 'TIER_1_COLOR_SIZE') {
        const clonedColors = (product.colorVariants || []).map((c) => ({
          ...c,
          sizes: (c.sizes || []).map((s) => ({
            ...s,
            stockCount: typeof s.stockCount === 'number' ? s.stockCount : 0,
          })),
        }));
        setVariantsState({ tier: 'TIER_1_COLOR_SIZE', colorVariants: clonedColors });
      } else if (product.tier === 'TIER_2_SIZE') {
        const clonedSizes = (product.sizes || []).map((s) => ({
          ...s,
          stockCount: typeof s.stockCount === 'number' ? s.stockCount : 0,
        }));
        setVariantsState({ tier: 'TIER_2_SIZE', sizes: clonedSizes });
      } else {
        setVariantsState({
          tier: 'TIER_3_SIMPLE',
          inStockCount: typeof product.inStockCount === 'number' ? product.inStockCount : 0,
        });
      }
      setActiveColorIdx(0);
      setFillValue('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product || !variantsState) return null;

  const threshold = product.lowStockThreshold || 5;

  // Handle size counter change for Tier 1
  const handleColorSizeChange = (colorIdx, sizeIdx, deltaOrVal, isAbsolute = false) => {
    setVariantsState((prev) => {
      const nextColors = [...prev.colorVariants];
      const targetSize = { ...nextColors[colorIdx].sizes[sizeIdx] };
      const current = typeof targetSize.stockCount === 'number' ? targetSize.stockCount : 0;
      let nextVal = isAbsolute ? parseInt(deltaOrVal, 10) : current + deltaOrVal;
      if (isNaN(nextVal)) nextVal = 0;
      targetSize.stockCount = Math.max(0, nextVal);
      targetSize.inStock = targetSize.stockCount > 0;
      nextColors[colorIdx].sizes[sizeIdx] = targetSize;

      // Color inStock rollup
      nextColors[colorIdx].inStock = nextColors[colorIdx].sizes.some((s) => s.stockCount > 0);
      return { ...prev, colorVariants: nextColors };
    });
  };

  // Handle size counter change for Tier 2
  const handleSizeChange = (sizeIdx, deltaOrVal, isAbsolute = false) => {
    setVariantsState((prev) => {
      const nextSizes = [...prev.sizes];
      const targetSize = { ...nextSizes[sizeIdx] };
      const current = typeof targetSize.stockCount === 'number' ? targetSize.stockCount : 0;
      let nextVal = isAbsolute ? parseInt(deltaOrVal, 10) : current + deltaOrVal;
      if (isNaN(nextVal)) nextVal = 0;
      targetSize.stockCount = Math.max(0, nextVal);
      targetSize.inStock = targetSize.stockCount > 0;
      nextSizes[sizeIdx] = targetSize;
      return { ...prev, sizes: nextSizes };
    });
  };

  // Shortcut: Fill all sizes for current scope
  const handleFillAllSizes = (targetColorIdx = null) => {
    const val = parseInt(fillValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid stock quantity (0 or higher).');
      return;
    }

    if (variantsState.tier === 'TIER_1_COLOR_SIZE' && targetColorIdx !== null) {
      setVariantsState((prev) => {
        const nextColors = [...prev.colorVariants];
        nextColors[targetColorIdx].sizes = nextColors[targetColorIdx].sizes.map((s) => ({
          ...s,
          stockCount: val,
          inStock: val > 0,
        }));
        nextColors[targetColorIdx].inStock = val > 0;
        return { ...prev, colorVariants: nextColors };
      });
      toast.success(`Set all sizes to ${val} for ${variantsState.colorVariants[targetColorIdx].colorName}`);
    } else if (variantsState.tier === 'TIER_2_SIZE') {
      setVariantsState((prev) => ({
        ...prev,
        sizes: prev.sizes.map((s) => ({
          ...s,
          stockCount: val,
          inStock: val > 0,
        })),
      }));
      toast.success(`Set all sizes to ${val}`);
    }
    setFillValue('');
  };

  // Submit all changes
  const handleSaveAll = () => {
    onSave(product, variantsState);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          style={{
            width: '100%',
            maxWidth: 620,
            height: '100%',
            background: 'var(--panel-bg, #0F0E17)',
            borderLeft: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              {product.images?.[0]?.url && (
                <img
                  src={optimizeImageUrl(product.images[0].url, 80)}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    objectFit: 'cover',
                    border: '1px solid var(--card-border)',
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--accent-gold, #C9A84C)',
                    }}
                  >
                    {product.category}
                  </span>
                  {product.packagingType && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ({product.packagingType})
                    </span>
                  )}
                </div>
                <h3
                  style={{
                    margin: '4px 0 0',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {product.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* TIER 1: DESIGNER GLASS BANGLES (Colorway Tabs + Size Grid) */}
            {variantsState.tier === 'TIER_1_COLOR_SIZE' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Palette size={16} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Select Colorway ({variantsState.colorVariants.length} total):
                  </span>
                </div>

                {/* Color tabs */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    marginBottom: 20,
                  }}
                >
                  {variantsState.colorVariants.map((cVar, cIdx) => {
                    const isActive = activeColorIdx === cIdx;
                    const colorStock = cVar.sizes.reduce((acc, s) => acc + (s.stockCount || 0), 0);
                    return (
                      <button
                        key={cVar._id || cIdx}
                        onClick={() => setActiveColorIdx(cIdx)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(196, 56, 108, 0.25), rgba(138, 43, 226, 0.2))'
                            : 'rgba(255, 255, 255, 0.04)',
                          border: isActive
                            ? '1px solid var(--accent, #C4386C)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          whiteSpace: 'nowrap',
                          fontSize: '0.84rem',
                          fontWeight: isActive ? 700 : 500,
                          flexShrink: 0,
                        }}
                      >
                        {cVar.colorCode && (
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: cVar.colorCode,
                              border: '1px solid rgba(255,255,255,0.3)',
                              display: 'inline-block',
                            }}
                          />
                        )}
                        <span>{cVar.colorName}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: colorStock <= 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: colorStock <= 0 ? '#F87171' : '#34D399',
                            fontWeight: 700,
                          }}
                        >
                          {colorStock}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Color Details */}
                {variantsState.colorVariants[activeColorIdx] && (
                  <div>
                    {/* Fill All Shortcut Row */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: 14,
                        padding: '12px 16px',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Bulk set all sizes for <b>{variantsState.colorVariants[activeColorIdx].colorName}</b>:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="0"
                          value={fillValue}
                          onChange={(e) => setFillValue(e.target.value)}
                          placeholder="Qty e.g. 25"
                          className="admin-input"
                          style={{ width: 100, height: 34, fontSize: '0.82rem', padding: '0 8px', borderRadius: 8 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleFillAllSizes(activeColorIdx)}
                          style={{
                            height: 34,
                            padding: '0 12px',
                            borderRadius: 8,
                            background: 'rgba(201, 168, 76, 0.2)',
                            border: '1px solid var(--accent-gold, #C9A84C)',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Fill All
                        </button>
                      </div>
                    </div>

                    {/* Sizes List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {variantsState.colorVariants[activeColorIdx].sizes.map((sObj, sIdx) => {
                        const stock = sObj.stockCount || 0;
                        const isZero = stock === 0;
                        const isLow = stock > 0 && stock <= threshold;

                        return (
                          <div
                            key={sObj._id || sIdx}
                            style={{
                              background: 'var(--surface-primary, #14131E)',
                              border: isZero
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : isLow
                                ? '1px solid rgba(245, 158, 11, 0.3)'
                                : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                              borderRadius: 14,
                              padding: '12px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 14,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                                Size {sObj.size}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                {isZero ? (
                                  <span style={{ fontSize: '0.74rem', color: '#EF4444', fontWeight: 600 }}>
                                    ● Out of Stock (0)
                                  </span>
                                ) : isLow ? (
                                  <span style={{ fontSize: '0.74rem', color: '#F59E0B', fontWeight: 600 }}>
                                    ▲ Low Stock (≤{threshold})
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                                    ✓ Available
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stepper Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleColorSizeChange(activeColorIdx, sIdx, -1)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid var(--card-border)',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={sObj.stockCount}
                                onChange={(e) => handleColorSizeChange(activeColorIdx, sIdx, e.target.value, true)}
                                className="admin-input"
                                style={{
                                  width: 65,
                                  height: 32,
                                  textAlign: 'center',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  borderRadius: 8,
                                  padding: 0,
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleColorSizeChange(activeColorIdx, sIdx, 1)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid var(--card-border)',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TIER 2: SIZE-BASED BANGLES (Wedding Bangles, Antique Bangles) */}
            {variantsState.tier === 'TIER_2_SIZE' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Layers size={16} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Size Variations ({variantsState.sizes.length} sizes configured):
                  </span>
                </div>

                {/* Fill All Shortcut Row */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Bulk set all sizes for this bangle:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min="0"
                      value={fillValue}
                      onChange={(e) => setFillValue(e.target.value)}
                      placeholder="Qty e.g. 15"
                      className="admin-input"
                      style={{ width: 100, height: 34, fontSize: '0.82rem', padding: '0 8px', borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleFillAllSizes()}
                      style={{
                        height: 34,
                        padding: '0 12px',
                        borderRadius: 8,
                        background: 'rgba(201, 168, 76, 0.2)',
                        border: '1px solid var(--accent-gold, #C9A84C)',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Fill All
                    </button>
                  </div>
                </div>

                {/* Sizes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {variantsState.sizes.map((sObj, sIdx) => {
                    const stock = sObj.stockCount || 0;
                    const isZero = stock === 0;
                    const isLow = stock > 0 && stock <= threshold;

                    return (
                      <div
                        key={sObj._id || sIdx}
                        style={{
                          background: 'var(--surface-primary, #14131E)',
                          border: isZero
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : isLow
                            ? '1px solid rgba(245, 158, 11, 0.3)'
                            : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                          borderRadius: 14,
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 14,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
                            Size {sObj.size}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            {isZero ? (
                              <span style={{ fontSize: '0.74rem', color: '#EF4444', fontWeight: 600 }}>
                                ● Out of Stock (0)
                              </span>
                            ) : isLow ? (
                              <span style={{ fontSize: '0.74rem', color: '#F59E0B', fontWeight: 600 }}>
                                ▲ Low Stock (≤{threshold})
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                                ✓ Available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleSizeChange(sIdx, -1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--card-border)',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={sObj.stockCount}
                            onChange={(e) => handleSizeChange(sIdx, e.target.value, true)}
                            className="admin-input"
                            style={{
                              width: 65,
                              height: 32,
                              textAlign: 'center',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              borderRadius: 8,
                              padding: 0,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSizeChange(sIdx, 1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--card-border)',
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div
            style={{
              padding: '18px 24px',
              borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              background: 'var(--panel-bg, #0F0E17)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '9px 18px', borderRadius: 10, fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="btn-primary"
              style={{
                padding: '9px 22px',
                borderRadius: 10,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Stock Levels'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InventoryVariantDrawer;
