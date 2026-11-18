import React, { useState } from 'react';
import { Sparkles, Percent, Pencil, Trash2, Plus, ArrowRight, Check } from 'lucide-react';
import { optimizeImageUrl } from '../utils/cloudinary';

/**
 * AdminOfferCard
 *
 * Compact horizontal product card designed specifically for the Admin Offers section.
 * - Left side: Square image thumbnail with optional discount overlay.
 * - Right side: Category, Product Name, Price, Original Price, Discount Information, and Action (Add / Edit / Remove) button.
 * - Responsive: Adapts effortlessly across mobile, tablet, and desktop.
 */
export const AdminOfferCard = ({
  product,
  mode = 'active', // 'active' | 'add'
  onEdit,
  onRemove,
  onAddOffer,
  adding = false,
}) => {
  const primaryImg = product.images?.[0]?.url;

  // Active Offer calculations
  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  // State for 'add' mode inline offer price input
  const defaultSuggestedPrice = Math.round(product.price * 0.85); // 15% off by default
  const [offerPriceInput, setOfferPriceInput] = useState(defaultSuggestedPrice);

  const candidateSavings =
    offerPriceInput && Number(offerPriceInput) < product.price
      ? product.price - Number(offerPriceInput)
      : 0;

  const candidateDiscountPct =
    candidateSavings > 0
      ? Math.round((candidateSavings / product.price) * 100)
      : null;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!offerPriceInput || Number(offerPriceInput) <= 0) return;
    onAddOffer(product, Number(offerPriceInput));
  };

  return (
    <div
      style={{
        background: 'var(--surface-primary, #14131E)',
        border: '1px solid var(--card-border, rgba(201, 168, 76, 0.14))',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        minHeight: 120,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow =
          '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(201, 168, 76, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--card-border, rgba(201, 168, 76, 0.14))';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.22)';
      }}
    >
      {/* ── LEFT SIDE: Product Thumbnail Image ───────────────────── */}
      <div
        style={{
          width: 96,
          height: 96,
          minWidth: 96,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          background: '#111019',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={primaryImg ? optimizeImageUrl(primaryImg, 200) : '/pretty-glitz-logo.png'}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/pretty-glitz-logo.png';
            e.currentTarget.style.objectFit = 'contain';
            e.currentTarget.style.padding = '8px';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: primaryImg ? 'cover' : 'contain',
            display: 'block',
          }}
        />

        {/* Discount Badge on Image (Active Mode) */}
        {mode === 'active' && discountPct && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 6,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            <Percent size={8} />
            {discountPct}% OFF
          </span>
        )}

        {/* Live Preview Discount Badge on Image (Add Mode) */}
        {mode === 'add' && candidateDiscountPct && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              background: 'rgba(16, 185, 129, 0.9)',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 6,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              lineHeight: 1,
            }}
          >
            {candidateDiscountPct}% OFF
          </span>
        )}
      </div>

      {/* ── RIGHT SIDE: Essential Product Information & Actions ─── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        {/* Category Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Sparkles size={11} color="var(--accent-gold, #C9A84C)" />
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--accent-gold, #C9A84C)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {product.category}
          </span>
          {product.packagingType && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              ({product.packagingQuantity && Number(product.packagingQuantity) > 1
                ? `${product.packagingQuantity} ${product.packagingType}${product.packagingType.toLowerCase() === 'set' ? 's' : ''}`
                : `${product.packagingQuantity ? `${product.packagingQuantity} ` : ''}${product.packagingType}`})
            </span>
          )}
        </div>

        {/* Product Title (2-line clamped) */}
        <h3
          style={{
            margin: 0,
            color: 'var(--text-primary, #FAF9FC)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.94rem',
            fontWeight: 700,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Pricing & Discount Information */}
        {mode === 'active' ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--accent-gold, #C9A84C)',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              ₹{product.price}
            </span>

            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted, #7E7C88)',
                    textDecoration: 'line-through',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ₹{product.originalPrice}
                </span>

                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#34D399',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '1.5px 6px',
                    borderRadius: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Save ₹{savings}
                </span>
              </>
            )}
          </div>
        ) : (
          /* Add Mode: Catalog Price + Offer Input */
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              MRP: <span style={{ textDecoration: 'line-through', fontWeight: 600 }}>₹{product.price}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                Offer: ₹
              </span>
              <input
                type="number"
                min="1"
                value={offerPriceInput}
                onChange={(e) => setOfferPriceInput(e.target.value)}
                className="admin-input"
                style={{
                  width: 72,
                  height: 28,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  padding: '0 6px',
                  borderRadius: 6,
                  color: 'var(--accent-gold, #C9A84C)',
                }}
              />
            </div>

            {candidateSavings > 0 && (
              <span
                style={{
                  fontSize: '0.66rem',
                  color: '#34D399',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.14)',
                  padding: '1.5px 6px',
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                Save ₹{candidateSavings}
              </span>
            )}
          </div>
        )}

        {/* ── ACTION BUTTONS ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 2,
            paddingTop: 6,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {mode === 'active' ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(product._id)}
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <Pencil size={12} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => onRemove(product)}
                className="btn-danger"
                style={{
                  flex: 1,
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </>
          ) : (
            /* Add Mode: Dedicated Add Button */
            <button
              type="button"
              disabled={adding || !offerPriceInput || Number(offerPriceInput) <= 0}
              onClick={handleAddSubmit}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                opacity: adding ? 0.7 : 1,
              }}
            >
              <Plus size={13} />
              <span>{adding ? 'Adding...' : 'Add to Offers'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOfferCard;
