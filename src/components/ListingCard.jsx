// ─── ListingCard.jsx ─────────────────────────────────────────────────────────
// Property card used on search results and homepage featured grid.
//
// Pricing model:  totalPrice = pricePerNight × guests × nights
//
// When dates + guests are provided (from context), the card shows:
//   • Total price  (bold, prominent)  ← what the trip costs
//   • KES X / person / night          ← smaller text below
//
// When no dates are selected, falls back to showing price per night only.

import React, { useState, useEffect } from 'react';

const C = {
  tuscanDark:  '#5C4425',
  tuscan:      '#8B6F47',
  tuscanLight: '#A68B5B',
  pearl:       '#F8F6F0',
  pearlDark:   '#EDE9E0',
  pearlDeep:   '#DDD6C8',
  orange:      '#FF5E3A',
  charcoal:    '#2C1F0E',
  muted:       '#7A6A56',
  white:       '#FFFFFF',
  star:        '#F59E0B',
  // ADD these lines after  star: '#F59E0B',
  red:         '#dc2626',
  redBg:       '#fef2f2',
  redBorder:   '#fca5a5',
  amber:       '#d97706',
  amberBg:     '#fffbeb',
  amberBorder: '#fcd34d',
  green:       '#16a34a',
};

const fmt = (n) => `KES ${Number(n).toLocaleString()}`;

/**
 * @param {object}   listing   — property data from listings.js
 * @param {function} onClick   — called with the listing when card is clicked
 * @param {Date|null} checkIn  — from context, may be null
 * @param {Date|null} checkOut — from context, may be null
 * @param {number}   guests    — total guest count (adults + children)
 */

const toKey = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

const expandRange = (ci, co) => {
  const dates  = [];
  const cursor = new Date(ci); cursor.setHours(0,0,0,0);
  const end    = new Date(co); end.setHours(0,0,0,0);
  while (cursor < end) {
    dates.push(toKey(new Date(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const checkDateConflict = (listingId, checkIn, checkOut) => {
  if (!checkIn || !checkOut || !listingId) return false;
  try {
    const guestBookings = JSON.parse(localStorage.getItem(`bookings_${listingId}`) || '[]');
    const ownerBlocks   = JSON.parse(localStorage.getItem(`booked_${listingId}`)   || '[]');
    const allBooked = [...guestBookings, ...ownerBlocks].flatMap(b => {
      try { return expandRange(b.checkIn, b.checkOut); } catch { return []; }
    });
    const selectedDays = expandRange(checkIn, checkOut);
    return selectedDays.some(d => allBooked.includes(d));
  } catch {
    return false;
  }
};


export default function ListingCard({ listing, onClick, checkIn, checkOut, guests = 1 }) {
  const [imgIdx,   setImgIdx]   = useState(0);
  const [hovering,     setHovering]     = useState(false);
  const [dateConflict, setDateConflict] = useState(false);

  useEffect(() => {
  setDateConflict(checkDateConflict(listing.id, checkIn, checkOut));
}, [listing.id, checkIn, checkOut]);

const overCapacity = Math.max(1, guests) > (listing.guests || 99);

  // ── Pricing calculation ─────────────────────────────────────────────────
  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((checkOut - checkIn) / 86_400_000))
    : 0;
  const guestCount   = Math.max(1, guests);
  const pricePerNight = listing.price;                           // per person per night
  const totalPrice   = nights > 0
    ? pricePerNight * guestCount * nights
    : null;

  // ── Dates label ────────────────────────────────────────────────────────
  const fmtShort = (d) => d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

  return (
    <div
      onClick={() => onClick(listing)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        cursor:       'pointer',
        borderRadius: 16,
        overflow:     'hidden',
        background:   C.white,
        border: `1.5px solid ${overCapacity ? C.redBorder : dateConflict ? C.amberBorder : C.pearlDeep}`,
        transition:   'transform 0.2s, box-shadow 0.2s',
        transform:    hovering ? 'translateY(-4px)' : 'none',
        boxShadow:    hovering
          ? '0 12px 40px rgba(61,43,16,0.14)'
          : '0 2px 8px rgba(61,43,16,0.06)',
      }}
    >
      {/* PASTE THIS BLOCK directly above the image div */}
  {overCapacity && (
    <div style={{
    background: C.redBg, borderBottom: `1px solid ${C.redBorder}`,
    padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
    }}>
    <span style={{ fontSize: 14 }}>🚫</span>
    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.red }}>
      Exceeds capacity — max {listing.guests} guest{listing.guests !== 1 ? 's' : ''}
    </p>
    </div>
    )}

  {dateConflict && (
    <div style={{
    background: C.amberBg, borderBottom: `1px solid ${C.amberBorder}`,
    padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
    }}>
    <span style={{ fontSize: 14 }}>⚠️</span>
    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.amber }}>
      Dates unavailable — some nights already booked
    </p>
    </div>
    )}
      {/* ── Image ────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', paddingTop: '65%', overflow: 'hidden' }}>
        <img
          src={listing.images[imgIdx]}
          alt={listing.title}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            transition: 'transform 0.4s',
            transform:  hovering ? 'scale(1.04)' : 'scale(1)',
          }}
        />

        {/* Image carousel dots */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%',
          transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {listing.images.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
              style={{
                width:        i === imgIdx ? 18 : 6,
                height:       6,
                borderRadius: 3,
                background:   i === imgIdx ? '#fff' : 'rgba(255,255,255,0.6)',
                border:       'none',
                cursor:       'pointer',
                transition:   'width 0.2s',
                padding:      0,
              }}
            />
          ))}
        </div>

        {/* LalaVerified badge */}
        {listing.verified && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span style={{
              background:   C.white,
              color:        C.orange,
              padding:      '3px 10px',
              borderRadius: 20,
              fontSize:     11,
              fontWeight:   700,
              border:       `1px solid ${C.orange}40`,
            }}>
              ✓ LalaVerified
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            position:   'absolute',
            top:        12,
            right:      12,
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            fontSize:   22,
            lineHeight: 1,
            filter:     'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
          }}
        >
          ♡
        </button>
      </div>

      {/* ── Info ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px' }}>

        {/* Title + rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 4 }}>
          <p style={{
            fontSize:    15,
            fontWeight:  600,
            color:       C.charcoal,
            margin:      0,
            fontFamily:  "'Playfair Display', serif",
            lineHeight:  1.3,
            flex:        1,
            paddingRight: 8,
          }}>
            {listing.title}
          </p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 13, flexShrink: 0 }}>
            <span style={{ color: C.star }}>★</span>
            <span style={{ fontWeight: 600, color: C.charcoal }}>{listing.rating}</span>
            <span style={{ color: C.muted }}>({listing.reviews})</span>
          </span>
        </div>

        {/* Location */}
        <p style={{ color: C.muted, fontSize: 13, margin: '0 0 10px' }}>
          📍 {listing.location}
        </p>

        {/* ── Pricing block ─────────────────────────────────────────── */}
        {totalPrice ? (
          // Dates selected — show total + breakdown
          <div>
            {/* Total price — bold and prominent */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                  fontSize:       19,
                  fontWeight:     800,
                  color:          dateConflict ? C.muted : C.tuscanDark,
                  fontFamily:     "'Playfair Display', serif",
                  textDecoration: dateConflict ? 'line-through' : 'none',
            }}>
                {fmt(totalPrice)}
              </span>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>
                total
              </span>
            </div>

            {/* Per-person per-night breakdown */}
            <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>
              {fmt(pricePerNight)} / person / night
              {' · '}
              {guestCount} guest{guestCount !== 1 ? 's' : ''}
              {' · '}
              {nights} night{nights !== 1 ? 's' : ''}
            </p>

            {/* Date range pill */}
            <div style={{ marginTop: 6 }}>
              <span style={{
                fontSize:     11,
                padding:      '3px 8px',
                borderRadius: 20,
                background:   C.pearl,
                color:        C.tuscan,
                fontWeight:   600,
                border:       `1px solid ${C.pearlDeep}`,
              }}>
                {fmtShort(checkIn)} – {fmtShort(checkOut)}
              </span>
            </div>
          </div>
        ) : (
          // No dates — show per-night price only
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>
              {fmt(pricePerNight)}
              <span style={{ fontWeight: 400, color: C.muted, fontSize: 13 }}>
                {' '}/ person / night
              </span>
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              {listing.reviews} reviews
            </span>
          </div>
        )}

        {/* Amenity preview chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {listing.amenities.slice(0, 3).map((a) => (
            <span key={a} style={{
              fontSize:     11,
              padding:      '2px 8px',
              borderRadius: 10,
              background:   C.pearlDark,
              color:        C.tuscanDark,
            }}>
              {a}
            </span>
          ))}
          {listing.amenities.length > 3 && (
            <span style={{ fontSize: 11, color: C.muted }}>
              +{listing.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}