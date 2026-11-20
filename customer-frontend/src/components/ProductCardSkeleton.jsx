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
        padding: 7,
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
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
          marginBottom: 4,
        }}
      >
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 10 }} />
      </div>

      {/* Content lines matching ProductCard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, padding: '2px 2px 0', width: '100%' }}>
        {/* Category line */}
        <div
          className="skeleton"
          style={{ height: 8, width: 45, marginBottom: 2, borderRadius: 4 }}
        />

        {/* Title placeholder (compact) */}
        <div
          className="skeleton"
          style={{ height: 13, width: '85%', marginBottom: 2, borderRadius: 4 }}
        />

        {/* Price & action row on the same line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 2,
            paddingTop: 0,
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
