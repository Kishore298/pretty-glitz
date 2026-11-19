import React from 'react';
import { Phone, Edit2, Trash2, CheckCircle2, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AddressCard = ({
  address,
  isSelected = false,
  onSelect = null,
  onEdit = null,
  onDelete = null,
  onSetDefault = null,
  selectable = false,
}) => {
  const { isDark } = useTheme();

  const isDefault = Boolean(address.isDefault);
  const fullAddress = address.addressLine || address.address || '';
  const cityState = [address.city, address.state].filter(Boolean).join(', ');
  const pin = address.pincode ? `- ${address.pincode}` : '';

  return (
    <div
      onClick={() => {
        if (selectable && onSelect) onSelect(address);
      }}
      style={{
        background: isSelected
          ? (isDark ? 'rgba(196, 56, 108, 0.12)' : 'rgba(196, 56, 108, 0.05)')
          : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF'),
        border: isSelected
          ? '2px solid var(--accent, #C4386C)'
          : (isDefault ? '1.5px solid rgba(201, 168, 76, 0.45)' : '1px solid var(--border)'),
        borderRadius: 16,
        padding: '18px 20px',
        position: 'relative',
        cursor: selectable ? 'pointer' : 'default',
        boxShadow: isSelected
          ? '0 6px 20px rgba(196, 56, 108, 0.2)'
          : (isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.03)'),
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Row: Name, Default Badge & Selection Radio */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {selectable && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: isSelected ? '6px solid var(--accent)' : '2px solid var(--border)',
                background: '#FFFFFF',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            />
          )}

          <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)' }}>
            {address.name || 'Recipient'}
          </span>

          {isDefault && (
            <span
              style={{
                background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.2), rgba(201, 168, 76, 0.1))',
                border: '1px solid rgba(201, 168, 76, 0.4)',
                color: '#C9A84C',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Star size={10} style={{ fill: '#C9A84C' }} /> Default
            </span>
          )}
        </div>

        {isSelected && (
          <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        )}
      </div>

      {/* Address Details */}
      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '6px 0 10px', paddingLeft: selectable ? 30 : 0 }}>
        <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 2 }}>
          {fullAddress}
        </div>
        <div>
          {cityState} {pin}
        </div>
        {address.mobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            <Phone size={12} />
            <span>+91 {address.mobile}</span>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 10,
          paddingLeft: selectable ? 30 : 0,
        }}
      >
        {!isDefault && onSetDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(address);
            }}
            title="Make this address default"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A84C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Star size={12} /> Set as Default
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address);
            }}
            title="Edit address details"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
              borderRadius: 6,
            }}
          >
            <Edit2 size={12} /> Edit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address);
            }}
            title="Delete this address"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
              borderRadius: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
