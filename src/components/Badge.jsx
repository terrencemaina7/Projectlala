// ─── Badge ────────────────────────────────────────────────────────────────────
// Small pill badge used for "LalaVerified" and other status labels.

import React from 'react';
import { COLORS } from '../styles/theme';

/**
 * @param {string} text           - label text (e.g. "LalaVerified")
 * @param {string} [color]        - accent color (defaults to brand orange)
 */
export default function Badge({ text, color = COLORS.tuscanDark }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: color + '18',
        color: color,
        border: `1px solid ${color}30`,
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'Playfair Display', Georgia, serif",
        letterSpacing: 0.3,
      }}
    >
      ✓ {text}
    </span>
  );
}
