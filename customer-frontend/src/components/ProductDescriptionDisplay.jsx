import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Parses raw description text into individual bullet points or specification items.
 * Handles newlines, bullets, semicolons, and multi-sentence paragraphs automatically.
 */
export function parseDescriptionPoints(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  let items = [];

  // 1. If multi-line (newlines exist), split on newlines
  if (trimmed.includes('\n')) {
    items = trimmed.split(/\r?\n+/);
  }
  // 2. If bullets or semicolons or pipes are used inline
  else if (/[•▪▫◆|;]/.test(trimmed)) {
    items = trimmed.split(/[•▪▫◆|;]+/);
  }
  // 3. If dash-separated points (e.g. " - Item 1 - Item 2")
  else if (/(?:^|\s)-+\s+/.test(trimmed)) {
    items = trimmed.split(/(?:^|\s)-+\s+/);
  }
  // 4. If a continuous paragraph with multiple complete sentences
  else {
    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    if (sentences.length > 1) {
      items = sentences;
    } else {
      items = [trimmed];
    }
  }

  return items
    .map((item) => {
      // Strip leading bullet marks, dashes, numbers like "1.", "1)"
      let cleaned = item.trim().replace(/^[\s•*▪▫◆\->–—\d.)]+/, '').trim();
      return cleaned;
    })
    .filter((item) => item.length > 0);
}

const ProductDescriptionDisplay = ({ description, className = '' }) => {
  const points = parseDescriptionPoints(description);

  if (!points || points.length === 0) {
    return (
      <p className="product-details-body" style={{ fontStyle: 'italic', opacity: 0.7 }}>
        Artisanal jewellery handcrafted with precision and premium finishes.
      </p>
    );
  }

  // If only 1 short line and not a key:value pair, render as a clean paragraph
  if (points.length === 1 && !points[0].includes(':')) {
    return (
      <p className="product-details-body" style={{ margin: 0, lineHeight: 1.65 }}>
        {points[0]}
      </p>
    );
  }

  return (
    <ul className={`product-description-bullets ${className}`} style={{
      listStyle: 'none',
      padding: 0,
      margin: '8px 0 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {points.map((pt, idx) => {
        // Check for Key: Value pattern (e.g. "Material: Brass", "Closure: Drawstring")
        const colonMatch = pt.match(/^([^:\n]{2,32}):\s*(.+)$/);

        if (colonMatch) {
          const key = colonMatch[1].trim();
          const val = colonMatch[2].trim();
          return (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                fontSize: '0.88rem',
                lineHeight: 1.55,
                wordBreak: 'break-word',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}
              >
                {key}:
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {val}
              </span>
            </li>
          );
        }

        return (
          <li
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              fontSize: '0.88rem',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
              wordBreak: 'break-word',
            }}
          >
            <span
              style={{
                color: 'var(--accent, #C4386C)',
                flexShrink: 0,
                marginTop: 3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <Sparkles size={13} />
            </span>
            <span style={{ flex: 1 }}>{pt}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default ProductDescriptionDisplay;

