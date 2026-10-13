import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ProductCardSkeleton = () => {
  const { isDark } = useTheme();

  return (
    <div
      className="product-card-skeleton"
      style={{
        background: isDark ? 'var(--bg-secondary)' : '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Square image placeholder */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
      </div>

      {/* Content lines matching ProductCard */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 4px' }}>
        {/* Category line */}
        <div
          className="skeleton"
          style={{ height: 10, width: '45%', marginBottom: 6, borderRadius: 4 }}
        />

        {/* Title placeholder (2 clamped lines) */}
        <div
          className="skeleton"
          style={{ height: 13, width: '85%', marginBottom: 5, borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 13, width: '60%', marginBottom: 12, borderRadius: 4 }}
        />

        {/* Price & action row at bottom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div className="skeleton" style={{ height: 16, width: 55, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 10, width: 35, borderRadius: 4 }} />
          </div>
          <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
