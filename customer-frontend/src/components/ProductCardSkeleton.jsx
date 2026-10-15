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
        borderRadius: 14,
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
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 10 }} />
      </div>

      {/* Content lines matching ProductCard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, padding: '2px 2px 0', width: '100%' }}>
        {/* Category line */}
        <div
          className="skeleton"
          style={{ height: 9, width: 45, marginBottom: 4, borderRadius: 4 }}
        />

        {/* Title placeholder (2 clamped lines) */}
        <div
          className="skeleton"
          style={{ height: 14, width: '85%', marginBottom: 4, borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 14, width: '50%', marginBottom: 8, borderRadius: 4 }}
        />

        {/* Price & action row on the same line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 'auto',
            paddingTop: 4,
          }}
        >
          <div className="skeleton" style={{ height: 16, width: 60, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 26, width: 68, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
