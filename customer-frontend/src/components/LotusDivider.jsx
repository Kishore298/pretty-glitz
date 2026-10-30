import React from 'react';

const LotusDivider = ({ className = '', style = {}, color = '#C4386C' }) => {
  return (
    <div
      className={`lotus-divider-wrapper ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        margin: '16px auto 24px',
        width: '100%',
        maxWidth: 380,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Left horizontal line fading inwards */}
      <span
        style={{
          flex: 1,
          height: '1.5px',
          background: `linear-gradient(90deg, transparent 0%, ${color} 100%)`,
          borderRadius: 2,
          opacity: 0.8,
        }}
      />

      {/* Lotus icon matching client reference design */}
      <svg
        width="30"
        height="22"
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: color, flexShrink: 0 }}
      >
        {/* Center tall petal */}
        <path
          d="M16 2.5 C13.5 7 13 12 16 16.5 C19 12 18.5 7 16 2.5 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Mid Left Petal */}
        <path
          d="M14.5 6 C10 8.5 9 13.5 14 17"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Mid Right Petal */}
        <path
          d="M17.5 6 C22 8.5 23 13.5 18 17"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Outer Left Petal */}
        <path
          d="M12 10 C6.5 12.5 5.5 16.5 12.5 18.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Outer Right Petal */}
        <path
          d="M20 10 C25.5 12.5 26.5 16.5 19.5 18.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Bottom base / calyx tip */}
        <path
          d="M13.5 18 L16 21.5 L18.5 18"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Right horizontal line fading outwards */}
      <span
        style={{
          flex: 1,
          height: '1.5px',
          background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
          borderRadius: 2,
          opacity: 0.8,
        }}
      />
    </div>
  );
};

export default LotusDivider;

