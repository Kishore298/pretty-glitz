import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Upload,
  Sparkles,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import QuickAddColorsModal from './QuickAddColorsModal';
import {
  BANGLE_COLOR_FAMILIES,
  ALL_BANGLE_COLORS,
  STANDARD_BANGLE_SIZES,
  DEFAULT_ACTIVE_SIZES,
} from '../constants/banglePresets';

const BangleVariationManager = ({
  colorVariants = [],
  onChange,
  onUploadImage,
  sectionStyle = {},
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showTemplateBar, setShowTemplateBar] = useState(false);
  const [templateSizes, setTemplateSizes] = useState(DEFAULT_ACTIVE_SIZES);
  const [customTemplateSize, setCustomTemplateSize] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onAddMissing, onResetAll }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const updateVariants = (updater) => {
    const next = typeof updater === 'function' ? updater(colorVariants) : updater;
    onChange(next);
  };

  const handleAddSingleVariant = () => {
    const isFirst = colorVariants.length === 0;
    const initialSizes = templateSizes.map((sz) => ({
      size: sz,
      stockCount: 0,
      inStock: false,
    }));

    const newVariant = {
      colorName: '',
      colorCode: '#E0218A',
      images: [],
      sizes: initialSizes,
      inStock: false,
      isDefault: isFirst,
    };

    updateVariants([...colorVariants, newVariant]);
  };

  // Quick Add Bulk Generator callback
  const handleBulkGenerate = (selectedColors, selectedSizes) => {
    const isFirstInitial = colorVariants.length === 0;

    const newVariants = selectedColors.map((color, idx) => ({
      colorName: color.name,
      colorCode: color.hex,
      images: [],
      sizes: selectedSizes.map((sz) => ({
        size: sz,
        stockCount: 0,
        inStock: false,
      })),
      inStock: false,
      isDefault: isFirstInitial && idx === 0,
    }));

    updateVariants([...colorVariants, ...newVariants]);
  };

  // Duplicate Colourway:
  // Copies size configuration, resets stock quantities to 0, sets inStock to false,
  // empties images, resets isDefault to false, prompts for new colour selection.
  const handleDuplicateVariant = (cIdx) => {
    const target = colorVariants[cIdx];
    if (!target) return;

    const clonedSizes = (target.sizes || []).map((s) => ({
      size: s.size,
      stockCount: 0,
      inStock: false,
    }));

    const duplicated = {
      colorName: '',
      colorCode: target.colorCode || '#C4386C',
      images: [],
      sizes: clonedSizes,
      inStock: false,
      isDefault: false,
    };

    const next = [...colorVariants];
    next.splice(cIdx + 1, 0, duplicated);
    updateVariants(next);
  };

  const handleRemoveVariant = (cIdx) => {
    updateVariants(colorVariants.filter((_, i) => i !== cIdx));
  };

  const handleVariantFieldChange = (cIdx, field, value) => {
    updateVariants((prev) => {
      const next = [...prev];
      next[cIdx] = { ...next[cIdx], [field]: value };

      if (field === 'isDefault' && value === true) {
        next.forEach((v, i) => {
          if (i !== cIdx) v.isDefault = false;
        });
      }

      return next;
    });
  };

  const handlePresetColorSelect = (cIdx, selectedVal) => {
    if (selectedVal === '__custom__') {
      updateVariants((prev) => {
        const next = [...prev];
        next[cIdx] = {
          ...next[cIdx],
          colorName: next[cIdx].colorName || 'Custom Shade',
          isCustom: true,
        };
        return next;
      });
      return;
    }

    const preset = ALL_BANGLE_COLORS.find(
      (c) => c.name.toLowerCase() === selectedVal.toLowerCase()
    );
    if (!preset) return;

    updateVariants((prev) => {
      const next = [...prev];
      next[cIdx] = {
        ...next[cIdx],
        colorName: preset.name,
        colorCode: preset.hex,
        isCustom: false,
      };
      return next;
    });
  };

  // ─── Size Management with Inventory Rules ────────────────────────────────

  const handleAddSizeToVariant = (cIdx) => {
    updateVariants((prev) => {
      const next = [...prev];
      const sizes = next[cIdx].sizes || [];
      next[cIdx] = {
        ...next[cIdx],
        sizes: [...sizes, { size: '', stockCount: 0, inStock: false }],
      };
      return next;
    });
  };

  const handleRemoveSizeFromVariant = (cIdx, sIdx) => {
    updateVariants((prev) => {
      const next = [...prev];
      const sizes = (next[cIdx].sizes || []).filter((_, i) => i !== sIdx);
      const hasStock = sizes.some((s) => s.inStock && s.stockCount > 0);
      next[cIdx] = {
        ...next[cIdx],
        sizes,
        inStock: hasStock,
      };
      return next;
    });
  };

  const handleSizeFieldChange = (cIdx, sIdx, field, value) => {
    updateVariants((prev) => {
      const next = [...prev];
      const sizes = [...(next[cIdx].sizes || [])];
      const currentSize = { ...sizes[sIdx] };

      if (field === 'stockCount') {
        const count = Math.max(0, parseInt(value, 10) || 0);
        currentSize.stockCount = count;
        // Business Rule: Entering stock > 0 automatically marks in-stock; 0 marks out-of-stock
        if (count > 0) {
          currentSize.inStock = true;
        } else {
          currentSize.inStock = false;
        }
      } else if (field === 'inStock') {
        // Business Rule: Can only be in-stock if stockCount > 0
        if (value === true && (currentSize.stockCount || 0) <= 0) {
          currentSize.inStock = false;
        } else {
          currentSize.inStock = value;
        }
      } else {
        currentSize[field] = value;
      }

      sizes[sIdx] = currentSize;

      // Overall colourway inStock is true if any size has inStock && stockCount > 0
      const variantHasStock = sizes.some((s) => s.inStock && (s.stockCount || 0) > 0);

      next[cIdx] = {
        ...next[cIdx],
        sizes,
        inStock: variantHasStock,
      };

      return next;
    });
  };

  // ─── Global Size Template Execution ──────────────────────────────────────

  const toggleTemplateSize = (sz) => {
    setTemplateSizes((prev) => {
      if (prev.includes(sz)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== sz);
      }
      return [...prev, sz].sort();
    });
  };

  const handleAddCustomTemplateSize = (e) => {
    e.preventDefault();
    const trimmed = customTemplateSize.trim();
    if (trimmed && !templateSizes.includes(trimmed)) {
      setTemplateSizes((prev) => [...prev, trimmed]);
      setCustomTemplateSize('');
    }
  };

  const applyTemplateToAll = () => {
    if (colorVariants.length === 0) {
      handleAddSingleVariant();
      return;
    }

    // Check if any variant already has entered stock
    const hasAnyExistingStock = colorVariants.some((c) =>
      (c.sizes || []).some((s) => (s.stockCount || 0) > 0)
    );

    if (hasAnyExistingStock) {
      // Must prompt with confirmation options to prevent accidental data loss
      setConfirmDialog({
        title: 'Apply Size Template to All Colours',
        message:
          'Some colour variations already have stock numbers entered. How would you like to apply the template?',
        onAddMissing: () => {
          updateVariants((prev) =>
            prev.map((c) => {
              const existingSizesMap = new Map((c.sizes || []).map((s) => [s.size, s]));
              const mergedSizes = [...(c.sizes || [])];

              templateSizes.forEach((tmplSz) => {
                if (!existingSizesMap.has(tmplSz)) {
                  mergedSizes.push({ size: tmplSz, stockCount: 0, inStock: false });
                }
              });

              return { ...c, sizes: mergedSizes };
            })
          );
          setConfirmDialog(null);
        },
        onResetAll: () => {
          updateVariants((prev) =>
            prev.map((c) => ({
              ...c,
              sizes: templateSizes.map((sz) => ({
                size: sz,
                stockCount: 0,
                inStock: false,
              })),
              inStock: false,
            }))
          );
          setConfirmDialog(null);
        },
      });
    } else {
      // No existing stock to protect; update sizes cleanly
      updateVariants((prev) =>
        prev.map((c) => {
          const existingSizesMap = new Map((c.sizes || []).map((s) => [s.size, s]));
          const nextSizes = templateSizes.map((sz) => {
            if (existingSizesMap.has(sz)) return existingSizesMap.get(sz);
            return { size: sz, stockCount: 0, inStock: false };
          });
          return { ...c, sizes: nextSizes, inStock: false };
        })
      );
    }
  };

  // ─── Photo Handlers ──────────────────────────────────────────────────────

  const handleImageUpload = (cIdx, e) => {
    if (onUploadImage) {
      onUploadImage(cIdx, e);
    }
  };

  const handleRemoveImage = (cIdx, imgIdx) => {
    updateVariants((prev) => {
      const next = [...prev];
      next[cIdx] = {
        ...next[cIdx],
        images: (next[cIdx].images || []).filter((_, i) => i !== imgIdx),
      };
      return next;
    });
  };

  const existingColorNames = colorVariants.map((c) => c.colorName);

  return (
    <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ─── Top Header & Primary Action Bar ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--accent-gold, #C9A84C)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              2. Colour Variations & Size-Wise Inventory
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary, #D1D5DB)',
                fontWeight: 600,
              }}
            >
              {colorVariants.length} colour{colorVariants.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9CA3AF)' }}>
            Manage colourways with dedicated gallery photos and independent size-level stock.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowTemplateBar((prev) => !prev)}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              gap: 6,
              background: showTemplateBar ? 'rgba(201, 168, 76, 0.15)' : undefined,
              borderColor: showTemplateBar ? 'var(--accent-gold, #C9A84C)' : undefined,
            }}
            title="Configure common size template for all colours"
          >
            <Sliders size={13} /> Size Template
          </button>

          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              gap: 6,
              background: 'linear-gradient(135deg, #B8305E 0%, #E0218A 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(224, 33, 138, 0.3)',
            }}
          >
            <Sparkles size={14} /> Quick Add Colours
          </button>

          <button
            type="button"
            onClick={handleAddSingleVariant}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
          >
            <Plus size={14} /> + 1 Colour
          </button>
        </div>
      </div>

      {/* ─── Global Size Template Toolbar ─── */}
      {showTemplateBar && (
        <div
          style={{
            background: 'rgba(201, 168, 76, 0.05)',
            border: '1px solid rgba(201, 168, 76, 0.22)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>
              📐 Common Size Template:
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9CA3AF)' }}>
              Select default sizes to apply across colourways. New sizes always default to{' '}
              <strong style={{ color: '#F59E0B' }}>Stock: 0</strong>.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {STANDARD_BANGLE_SIZES.map((sz) => {
                const isActive = templateSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleTemplateSize(sz)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive
                        ? '1.5px solid var(--accent-gold, #C9A84C)'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: isActive
                        ? 'rgba(201, 168, 76, 0.2)'
                        : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#FFF' : 'var(--text-muted, #9CA3AF)',
                    }}
                  >
                    {isActive ? `✓ ${sz}` : sz}
                  </button>
                );
              })}

              <form onSubmit={handleAddCustomTemplateSize} style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={customTemplateSize}
                  onChange={(e) => setCustomTemplateSize(e.target.value)}
                  placeholder="Extra size..."
                  style={{
                    width: 75,
                    height: 28,
                    padding: '2px 6px',
                    fontSize: '0.74rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: '#FFF',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    height: 28,
                    padding: '0 8px',
                    fontSize: '0.72rem',
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
              </form>
            </div>

            <button
              type="button"
              onClick={applyTemplateToAll}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.76rem',
                gap: 6,
              }}
              title="Apply this size list across all colours"
            >
              <Sparkles size={13} /> Apply Sizes to All Colours
            </button>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal for Apply Template ─── */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1A1829',
              border: '1px solid var(--accent-gold, #C9A84C)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={22} style={{ color: 'var(--accent-gold, #C9A84C)' }} />
              <h4 style={{ margin: 0, color: '#FFF', fontSize: '1rem', fontWeight: 700 }}>
                {confirmDialog.title}
              </h4>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={confirmDialog.onAddMissing}
                className="btn-primary"
                style={{
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  justifyContent: 'flex-start',
                }}
              >
                <span>
                  <strong>1. Add Missing Sizes Only (Recommended)</strong>
                  <br />
                  <small style={{ opacity: 0.85 }}>
                    Preserves all your existing stock quantities and sizes.
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={confirmDialog.onResetAll}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <strong>2. Reset All Colours to Template</strong>
                <br />
                <small style={{ opacity: 0.85 }}>
                  Overwrites sizes on all colours and resets stock counts to 0.
                </small>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '0.8rem', marginTop: 4 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Colourway Cards List ─── */}
      {colorVariants.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {colorVariants.map((cVar, cIdx) => {
            const isPreset = ALL_BANGLE_COLORS.some(
              (c) => c.name.toLowerCase() === (cVar.colorName || '').trim().toLowerCase()
            );
            const totalStock = (cVar.sizes || []).reduce(
              (sum, s) => sum + (s.stockCount || 0),
              0
            );
            const hasInStockSize = (cVar.sizes || []).some(
              (s) => s.inStock && (s.stockCount || 0) > 0
            );

            return (
              <div
                key={cIdx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: cVar.isDefault
                    ? '1.5px solid var(--accent-gold, #C9A84C)'
                    : '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                  borderRadius: 14,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  position: 'relative',
                }}
              >
                {/* ─── Card Header Row ─── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    width: '100%',
                  }}
                >
                  {/* Left: Swatch & Colour Selector Dropdown */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flex: 1,
                      minWidth: 260,
                    }}
                  >
                    {/* Swatch color picker input */}
                    <input
                      type="color"
                      value={cVar.colorCode || '#E0218A'}
                      onChange={(e) =>
                        handleVariantFieldChange(cIdx, 'colorCode', e.target.value)
                      }
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
                        padding: 2,
                        cursor: 'pointer',
                        background: 'transparent',
                        flexShrink: 0,
                      }}
                      title="Adjust swatch color hex"
                    />

                    {/* Grouped Preset Dropdown */}
                    <select
                      value={isPreset ? cVar.colorName : '__custom__'}
                      onChange={(e) => handlePresetColorSelect(cIdx, e.target.value)}
                      className="admin-input"
                      style={{
                        height: 36,
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        flex: cVar.isCustom || !isPreset ? '0 0 auto' : 1,
                        minWidth: 160,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled>
                        -- Select Preset Colour --
                      </option>
                      {BANGLE_COLOR_FAMILIES.map((family) => (
                        <optgroup key={family.family} label={`── ${family.family} ──`}>
                          {family.colors.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="__custom__">🎨 Custom Colour (Manual Entry)</option>
                    </select>

                    {/* If Custom Colour or not in preset list, show text input */}
                    {(cVar.isCustom || !isPreset) && (
                      <input
                        type="text"
                        value={cVar.colorName}
                        onChange={(e) =>
                          handleVariantFieldChange(cIdx, 'colorName', e.target.value)
                        }
                        placeholder="Enter custom colour name..."
                        required
                        className="admin-input"
                        style={{
                          flex: 1,
                          height: 36,
                          fontSize: '0.84rem',
                          minWidth: 130,
                        }}
                      />
                    )}
                  </div>

                  {/* Right: Default Radio, Stock Summary Badge, Duplicate & Delete Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    {/* Default Colour Radio */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        color: cVar.isDefault
                          ? 'var(--accent-gold, #C9A84C)'
                          : 'var(--text-muted, #9CA3AF)',
                        fontWeight: cVar.isDefault ? 700 : 500,
                      }}
                      title="Set as the default colour shown first to customers"
                    >
                      <input
                        type="radio"
                        name="defaultColorVariant"
                        checked={Boolean(cVar.isDefault)}
                        onChange={() => handleVariantFieldChange(cIdx, 'isDefault', true)}
                      />
                      <span>Default</span>
                    </label>

                    {/* Stock Summary Badge */}
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: hasInStockSize
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                        border: hasInStockSize
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid rgba(239, 68, 68, 0.3)',
                        color: hasInStockSize ? '#10B981' : '#EF4444',
                      }}
                      title={
                        hasInStockSize
                          ? `Total ${totalStock} pieces in stock`
                          : 'All sizes have 0 stock or are marked out of stock'
                      }
                    >
                      {hasInStockSize ? `In Stock (${totalStock} pcs)` : 'Out of Stock'}
                    </span>

                    {/* Duplicate Colourway Button */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateVariant(cIdx)}
                      style={{
                        background: 'rgba(201, 168, 76, 0.1)',
                        border: '1px solid rgba(201, 168, 76, 0.25)',
                        borderRadius: 8,
                        color: 'var(--accent-gold, #C9A84C)',
                        cursor: 'pointer',
                        height: 32,
                        padding: '0 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      title="Duplicate this colourway (copies sizes, resets stock to 0, requires new photos)"
                    >
                      <Copy size={13} /> Duplicate
                    </button>

                    {/* Delete Colourway Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(cIdx)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 8,
                        color: '#EF4444',
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      title="Remove colour variant"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#EF4444';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#EF4444';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* ─── Photos Section for this Colour ─── */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary, #D1D5DB)',
                      fontWeight: 600,
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>
                      Photos for {cVar.colorName || 'Colour'} ({cVar.images?.length || 0})
                    </span>
                    {(!cVar.images || cVar.images.length === 0) && (
                      <span style={{ color: '#F59E0B', fontSize: '0.68rem', fontWeight: 500 }}>
                        (Photo needed)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {(cVar.images || []).map((img, imgIdx) => (
                      <div
                        key={imgIdx}
                        style={{
                          position: 'relative',
                          width: 68,
                          height: 68,
                          borderRadius: 10,
                          overflow: 'hidden',
                          border:
                            imgIdx === 0
                              ? '2px solid var(--accent-gold, #C9A84C)'
                              : '1px solid var(--card-border, rgba(255,255,255,0.1))',
                        }}
                      >
                        <img
                          src={img.url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {imgIdx === 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(201, 168, 76, 0.9)',
                              color: '#000',
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              padding: '1px 0',
                            }}
                          >
                            PRIMARY
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(cIdx, imgIdx)}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}

                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 68,
                        height: 68,
                        borderRadius: 10,
                        border: '1px dashed rgba(201, 168, 76, 0.4)',
                        cursor: 'pointer',
                        background: 'rgba(201, 168, 76, 0.04)',
                        color: 'var(--accent-gold, #C9A84C)',
                        gap: 2,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(cIdx, e)}
                        style={{ display: 'none' }}
                      />
                      <Upload size={16} />
                      <span style={{ fontSize: '0.62rem', fontWeight: 600 }}>Add Photo</span>
                    </label>
                  </div>
                </div>

                {/* ─── Size-Wise Stock Table / Grid ─── */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary, #D1D5DB)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        Size-Wise Inventory for {cVar.colorName || 'Colour'} (
                        {cVar.sizes?.length || 0} sizes)
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted, #9CA3AF)',
                        }}
                        title="Sizes can be customized independently for each colour. Type stock > 0 to mark in stock."
                      >
                        (Individual overrides supported)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddSizeToVariant(cIdx)}
                      className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4 }}
                    >
                      <Plus size={12} /> Add Size
                    </button>
                  </div>

                  {cVar.sizes && cVar.sizes.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 8,
                      }}
                    >
                      {cVar.sizes.map((sObj, sIdx) => {
                        const count = sObj.stockCount ?? 0;
                        const canBeInStock = count > 0;
                        const isCurrentlyIn = Boolean(sObj.inStock) && canBeInStock;

                        return (
                          <div
                            key={sIdx}
                            style={{
                              background: isCurrentlyIn
                                ? 'rgba(16, 185, 129, 0.04)'
                                : 'rgba(255, 255, 255, 0.02)',
                              border: isCurrentlyIn
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                              borderRadius: 8,
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxSizing: 'border-box',
                            }}
                          >
                            {/* Size Label Input */}
                            <input
                              type="text"
                              value={sObj.size}
                              onChange={(e) =>
                                handleSizeFieldChange(cIdx, sIdx, 'size', e.target.value)
                              }
                              placeholder="Size"
                              required
                              className="admin-input"
                              style={{
                                width: 52,
                                padding: '4px 6px',
                                height: 28,
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                              title="Bangle size (e.g. 2.2, 2.4, 2.6, 2.8)"
                            />

                            {/* Stock Count Input */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted, #9CA3AF)',
                                }}
                              >
                                Stock:
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={sObj.stockCount ?? 0}
                                onChange={(e) =>
                                  handleSizeFieldChange(cIdx, sIdx, 'stockCount', e.target.value)
                                }
                                className="admin-input"
                                style={{
                                  width: 52,
                                  padding: '4px 6px',
                                  height: 28,
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: count > 0 ? '#10B981' : '#9CA3AF',
                                }}
                                title="Available inventory count (Entering > 0 marks in-stock)"
                              />
                            </div>

                            {/* In-Stock Toggle */}
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                cursor: canBeInStock ? 'pointer' : 'not-allowed',
                                fontSize: '0.68rem',
                                color: isCurrentlyIn ? '#10B981' : 'var(--text-muted, #6B7280)',
                                flexShrink: 0,
                                opacity: canBeInStock ? 1 : 0.6,
                              }}
                              title={
                                canBeInStock
                                  ? 'Toggle in-stock status'
                                  : 'Stock count must be > 0 to mark in stock'
                              }
                            >
                              <input
                                type="checkbox"
                                disabled={!canBeInStock}
                                checked={isCurrentlyIn}
                                onChange={(e) =>
                                  handleSizeFieldChange(cIdx, sIdx, 'inStock', e.target.checked)
                                }
                              />
                              <span>{isCurrentlyIn ? 'In' : 'Out'}</span>
                            </label>

                            {/* Remove Size Button (Individual Override) */}
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeFromVariant(cIdx, sIdx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted, #9CA3AF)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title="Remove size from this colour"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 8,
                        fontSize: '0.74rem',
                        color: 'var(--text-muted, #9CA3AF)',
                        textAlign: 'center',
                      }}
                    >
                      No sizes configured for this colour.{' '}
                      <button
                        type="button"
                        onClick={() => handleAddSizeToVariant(cIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-gold, #C9A84C)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                        }}
                      >
                        + Add a size
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: 32,
            border: '1px dashed var(--card-border, rgba(201, 168, 76, 0.2))',
            borderRadius: 14,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Sparkles size={28} style={{ color: 'var(--accent-gold, #C9A84C)', opacity: 0.8 }} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#FFF' }}>
              No Colour Variations Added Yet
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #9CA3AF)' }}>
              Use <strong>Quick Add Colours</strong> to select 12–20 colors from our palette and common
              sizes at once.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '0.8rem',
                gap: 6,
                background: 'linear-gradient(135deg, #B8305E 0%, #E0218A 100%)',
              }}
            >
              <Sparkles size={14} /> Quick Add Colours
            </button>
            <button
              type="button"
              onClick={handleAddSingleVariant}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.8rem', gap: 6 }}
            >
              <Plus size={14} /> Add 1 Colour
            </button>
          </div>
        </div>
      )}

      {/* ─── Bulk Quick Add Modal ─── */}
      <QuickAddColorsModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        existingColorNames={existingColorNames}
        onGenerate={handleBulkGenerate}
      />
    </div>
  );
};

export default BangleVariationManager;
