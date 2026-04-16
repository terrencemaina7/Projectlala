// ─── StarRating ───────────────────────────────────────────────────────────────
// Reusable star + numeric rating display used on listing cards and detail page.

import React from 'react';
import { COLORS } from '../styles/theme';

/**
 * @param {number}  rating   - e.g. 4.97
 * @param {number}  [reviews] - optional review count shown in parentheses
 * @param {number}  [size=14] - font-size in px
 */
export default function StarRating({ rating, reviews, size = 14 }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: size }}>
      <span style={{ color: COLORS.star }}>★</span>
      <span style={{ fontWeight: 600, color: COLORS.charcoal }}>{rating}</span>
      {reviews !== undefined && (
        <span style={{ color: COLORS.muted }}>({reviews})</span>
      )}
    </span>
  );
}
