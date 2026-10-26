import React from 'react';

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const SkeletonStatCards = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, marginRight: 16 }}>
          <SkeletonBox width="60%" height="14px" style={{ marginBottom: 12 }} />
          <SkeletonBox width="40%" height="36px" />
        </div>
        <SkeletonBox width="48px" height="48px" borderRadius="14px" />
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 16,
      overflow: 'hidden',
      padding: '20px',
    }}
  >
    <div style={{ display: 'flex', gap: 20, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--card-border)' }}>
      <SkeletonBox width="40px" height="14px" />
      <SkeletonBox width="60px" height="14px" />
      <SkeletonBox width="30%" height="14px" />
      <SkeletonBox width="20%" height="14px" />
      <SkeletonBox width="15%" height="14px" />
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 0', borderBottom: idx < rows - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
        <SkeletonBox width="36px" height="36px" borderRadius="8px" />
        <SkeletonBox width="48px" height="48px" borderRadius="10px" />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="70%" height="16px" style={{ marginBottom: 6 }} />
          <SkeletonBox width="40%" height="12px" />
        </div>
        <SkeletonBox width="80px" height="24px" borderRadius="999px" />
        <SkeletonBox width="70px" height="20px" />
        <SkeletonBox width="100px" height="32px" borderRadius="8px" />
      </div>
    ))}
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <SkeletonBox width="100%" height="170px" borderRadius="0" />
        <div style={{ padding: '20px' }}>
          <SkeletonBox width="75%" height="18px" style={{ marginBottom: 10 }} />
          <SkeletonBox width="45%" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBox;
