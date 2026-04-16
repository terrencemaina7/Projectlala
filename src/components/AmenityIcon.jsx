// ─── AmenityIcon ─────────────────────────────────────────────────────────────
// Pill-shaped amenity chip with an emoji icon. Used on listing cards and the
// property detail page's "What's Included" section.

import React from 'react';
import { COLORS } from '../styles/theme';

const ICONS = {
  'Wi-Fi': '📶',
  Kitchen: '🍳',
  Pool: '🏊',
  Parking: '🅿️',
  'Air Conditioning': '❄️',
  'M-Pesa Accepted': '📱',
};

/**
 * @param {string} name - amenity name matching a key in ICONS above
 */
export default function AmenityIcon({ name }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: COLORS.pearl,
        borderRadius: 20,
        fontSize: 13,
        color: COLORS.charcoal,
        border: `1px solid ${COLORS.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 14 }}>{ICONS[name] || '✦'}</span>
      {name}
    </span>
  );
}
