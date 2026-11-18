import React from 'react';

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) => (
  <div
    className={`skeleton-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius,
      flexShrink: 0,
      ...style,
    }}
  />
);

export const SkeletonStatCards = ({ count = 4 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, marginBottom: 40 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 18,
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 140,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <SkeletonBox width="55%" height="13px" style={{ marginBottom: 12 }} />
            <SkeletonBox width="45%" height="34px" borderRadius="6px" />
          </div>
          <SkeletonBox width="46px" height="46px" borderRadius="14px" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
          <SkeletonBox width="50%" height="12px" />
          <SkeletonBox width="64px" height="20px" borderRadius="999px" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonCategories = ({ count = 6 }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 960,
      width: '100%',
      margin: 0,
    }}
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          borderRadius: 14,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Left: Drag handle badge, Thumbnail, Title & details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
          <SkeletonBox width="52px" height="32px" borderRadius="8px" />
          <SkeletonBox width="72px" height="52px" borderRadius="10px" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <SkeletonBox width="180px" height="18px" style={{ marginBottom: 6 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <SkeletonBox width="110px" height="12px" />
              <SkeletonBox width="140px" height="12px" />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SkeletonBox width="74px" height="34px" borderRadius="8px" />
          <SkeletonBox width="74px" height="34px" borderRadius="8px" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonProductCards = ({ count = 8 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <SkeletonBox width="100%" height="100%" borderRadius="0" />
          </div>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SkeletonBox width="65px" height="18px" borderRadius="999px" />
            <SkeletonBox width="50px" height="18px" borderRadius="999px" />
          </div>
          <SkeletonBox width="85%" height="18px" />
          <SkeletonBox width="45%" height="14px" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
            <SkeletonBox width="75px" height="22px" />
            <div style={{ display: 'flex', gap: 8 }}>
              <SkeletonBox width="34px" height="34px" borderRadius="10px" />
              <SkeletonBox width="34px" height="34px" borderRadius="10px" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div
    style={{
      background: 'var(--surface-primary)',
      border: '1px solid var(--card-border)',
      borderRadius: 18,
      overflow: 'hidden',
      padding: '24px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--card-border)' }}>
      <SkeletonBox width="180px" height="20px" />
      <SkeletonBox width="120px" height="36px" borderRadius="10px" />
    </div>
    <div style={{ display: 'flex', gap: 20, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--card-border)' }}>
      <SkeletonBox width="40px" height="14px" />
      <SkeletonBox width="52px" height="14px" />
      <SkeletonBox width="30%" height="14px" />
      <SkeletonBox width="18%" height="14px" />
      <SkeletonBox width="14%" height="14px" />
      <SkeletonBox width="80px" height="14px" style={{ marginLeft: 'auto' }} />
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px 0',
          borderBottom: idx < rows - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
        }}
      >
        <SkeletonBox width="28px" height="28px" borderRadius="6px" />
        <SkeletonBox width="48px" height="48px" borderRadius="12px" />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="65%" height="16px" style={{ marginBottom: 6 }} />
          <SkeletonBox width="35%" height="12px" />
        </div>
        <SkeletonBox width="85px" height="24px" borderRadius="999px" />
        <SkeletonBox width="70px" height="18px" />
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <SkeletonBox width="32px" height="32px" borderRadius="8px" />
          <SkeletonBox width="32px" height="32px" borderRadius="8px" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        <SkeletonBox width="100%" height="180px" borderRadius="0" />
        <div style={{ padding: '20px' }}>
          <SkeletonBox width="70%" height="18px" style={{ marginBottom: 10 }} />
          <SkeletonBox width="40%" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTestimonials = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width="50px" height="20px" borderRadius="6px" />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBox width="64px" height="22px" borderRadius="999px" />
            <SkeletonBox width="52px" height="24px" borderRadius="8px" />
            <SkeletonBox width="30px" height="24px" borderRadius="8px" />
          </div>
        </div>
        <SkeletonBox width="100px" height="16px" borderRadius="4px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '6px 0 14px' }}>
          <SkeletonBox width="95%" height="13px" />
          <SkeletonBox width="80%" height="13px" />
          <SkeletonBox width="45%" height="13px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid var(--card-border)', marginTop: 'auto' }}>
          <SkeletonBox width="44px" height="44px" borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width="60%" height="14px" />
            <SkeletonBox width="40%" height="12px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonOfferCards = ({ count = 6 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.14))',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minHeight: 120,
        }}
      >
        <SkeletonBox width="96px" height="96px" borderRadius="12px" />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBox width="35%" height="11px" borderRadius="4px" />
          <SkeletonBox width="80%" height="15px" borderRadius="6px" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SkeletonBox width="60px" height="18px" borderRadius="4px" />
            <SkeletonBox width="45px" height="14px" borderRadius="4px" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <SkeletonBox width="50%" height="26px" borderRadius="8px" />
            <SkeletonBox width="50%" height="26px" borderRadius="8px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBox;
