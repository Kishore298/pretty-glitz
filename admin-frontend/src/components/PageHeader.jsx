import React from 'react';

const PageHeader = ({
  title,
  subtitle,
  badge = null,
  actions = null,
  style = {},
}) => {
  return (
    <div
      className="page-header-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
        ...style,
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 240px' }}>
        <div className="page-header-title-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1
            className="page-header-title"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              className="page-header-badge"
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--card-border)',
                padding: '3px 12px',
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className="page-header-subtitle"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.92rem',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
