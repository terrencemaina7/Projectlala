// ─── ListingCard.jsx ──────────────────────────────────────────────────────────
// Property card — tuscan palette, orange accents.

import React, { useState } from 'react';
import { COLORS, formatKES } from '../styles/theme';
import StarRating from './StarRating';

export default function ListingCard({ listing, onClick }) {
  const [imgIdx,   setImgIdx]   = useState(0);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onClick={() => onClick(listing)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        cursor: 'pointer', borderRadius: 18, overflow: 'hidden',
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        transition: 'transform 0.25s, box-shadow 0.25s',
        transform: hovering ? 'translateY(-5px)' : 'none',
        boxShadow: hovering
          ? '0 16px 48px rgba(74,53,32,0.16)'
          : '0 2px 8px rgba(74,53,32,0.06)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', paddingTop: '65%', overflow: 'hidden' }}>
        <img src={listing.images[imgIdx]} alt={listing.title} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.4s',
          transform: hovering ? 'scale(1.05)' : 'scale(1)',
        }} />
        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {listing.images.slice(0, 5).map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }} style={{
              width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.55)',
              border: 'none', cursor: 'pointer', transition: 'width 0.2s', padding: 0,
            }} />
          ))}
        </div>
        {/* LalaVerified badge */}
        {listing.verified && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span style={{
              background: COLORS.white, color: COLORS.tuscanDark,
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              border: `1px solid ${COLORS.tuscan}40`,
            }}>
              ✓ LalaVerified
            </span>
          </div>
        )}
        {/* Wishlist */}
        <button onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, lineHeight: 1,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
          color: '#fff',
        }}>♡</button>
        {/* Orange bottom accent on hover */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: COLORS.orange,
          transform: hovering ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.35s',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{
            fontSize: 15, fontWeight: 700, color: COLORS.tuscanDark,
            margin: 0, fontFamily: "'Playfair Display', serif",
            lineHeight: 1.3, flex: 1, paddingRight: 8,
          }}>
            {listing.title}
          </p>
          <StarRating rating={listing.rating} />
        </div>
        <p style={{ color: COLORS.muted, fontSize: 13, margin: '4px 0 10px' }}>
          📍 {listing.location}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal }}>
            {formatKES(listing.price)}
            <span style={{ fontWeight: 400, color: COLORS.muted, fontSize: 13 }}> / night</span>
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>{listing.reviews} reviews</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {listing.amenities.slice(0, 3).map(a => (
            <span key={a} style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 10,
              background: COLORS.pearlDark, color: COLORS.tuscanDark,
              border: `1px solid ${COLORS.border}`,
            }}>{a}</span>
          ))}
          {listing.amenities.length > 3 && (
            <span style={{ fontSize: 11, color: COLORS.muted }}>
              +{listing.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
