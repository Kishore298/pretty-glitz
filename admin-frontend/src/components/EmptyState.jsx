import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  action = null, // { label: string, onClick: fn, icon: IconComponent }
  style = {},
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px 24px',
        background: 'var(--surface-primary)',
        border: '1px dashed var(--card-border)',
        borderRadius: 20,
        ...style,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'rgba(236, 22, 140, 0.08)',
          border: '1px solid rgba(236, 22, 140, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-pink)',
          marginBottom: 18,
          boxShadow: '0 0 24px rgba(236, 22, 140, 0.12)',
        }}
      >
        <Icon size={30} />
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: '0 0 24px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          maxWidth: 360,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
          style={{ textDecoration: 'none' }}
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
