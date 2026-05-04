// ─── GuestPicker.jsx ──────────────────────────────────────────────────────────
// Dropdown popup for selecting number of guests (adults + children + infants).
// Closes on outside click.  Renders below whatever button opens it.
//
// Usage:
//   <GuestPicker
//     value={{ adults: 2, children: 0, infants: 0 }}
//     onChange={(guests) => setGuests(guests)}
//     onClose={() => setGuestOpen(false)}
//   />

import React, { useEffect, useRef } from 'react';

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
  border:      '#DDD6C8',
};

const ROWS = [
  { key: 'adults',   label: 'Adults',   sub: 'Age 13+',    min: 1,  max: 16 },
  { key: 'children', label: 'Children', sub: 'Ages 2–12',  min: 0,  max: 10 },
  { key: 'infants',  label: 'Infants',  sub: 'Under 2',    min: 0,  max: 5  },
];

export default function GuestPicker({ value, onChange, onClose }) {
  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  const update = (key, delta) => {
    const row  = ROWS.find(r => r.key === key);
    const next = Math.min(row.max, Math.max(row.min, (value[key] || 0) + delta));
    onChange({ ...value, [key]: next });
  };

  const total = (value.adults || 1) + (value.children || 0);

  return (
    <div
      ref={popupRef}
      style={{
        position:     'absolute',
        top:          'calc(100% + 8px)',
        left:         '50%',
        transform:    'translateX(-50%)',
        zIndex:       3000,
        background:   C.white,
        borderRadius: 20,
        boxShadow:    '0 20px 64px rgba(61,43,16,0.22)',
        border:       `1px solid ${C.pearlDeep}`,
        padding:      '20px 24px',
        width:        'min(340px, 96vw)',
        boxSizing:    'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: C.tuscanDark, margin: 0 }}>
          Guests
        </p>
        <button
          onClick={onClose}
          style={{ background: C.pearlDark, border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 15, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
      </div>

      {/* Rows */}
      {ROWS.map(({ key, label, sub, min, max }, i) => (
        <div
          key={key}
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'space-between',
            padding:       '14px 0',
            borderBottom:  i < ROWS.length - 1 ? `1px solid ${C.pearlDeep}` : 'none',
          }}
        >
          {/* Label */}
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: C.charcoal, margin: 0 }}>{label}</p>
            <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>{sub}</p>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StepBtn
              onClick={() => update(key, -1)}
              disabled={(value[key] || 0) <= min}
              label="−"
            />
            <span style={{
              fontSize: 16, fontWeight: 700, color: C.charcoal,
              minWidth: 20, textAlign: 'center',
            }}>
              {value[key] || 0}
            </span>
            <StepBtn
              onClick={() => update(key, +1)}
              disabled={(value[key] || 0) >= max}
              label="+"
            />
          </div>
        </div>
      ))}

      {/* Infants note */}
      {(value.infants || 0) > 0 && (
        <p style={{ fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
          ℹ️ Infants are not counted in the total guest limit set by the host.
        </p>
      )}

      {/* Confirm */}
      <button
        onClick={onClose}
        style={{
          width:        '100%',
          marginTop:    18,
          padding:      '11px',
          background:   C.tuscanDark,
          color:        C.white,
          border:       'none',
          borderRadius: 12,
          fontSize:     14,
          fontWeight:   700,
          cursor:       'pointer',
        }}
      >
        Confirm — {total} guest{total !== 1 ? 's' : ''}
        {(value.infants || 0) > 0 && `, ${value.infants} infant${value.infants !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

// ── Stepper button ────────────────────────────────────────────────────────────
function StepBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:          32,
        height:         32,
        borderRadius:   '50%',
        border:         `1.5px solid ${disabled ? C.pearlDeep : C.tuscan}`,
        background:     disabled ? C.pearlDark : C.white,
        color:          disabled ? C.pearlDeep : C.tuscan,
        fontSize:       18,
        fontWeight:     700,
        cursor:         disabled ? 'not-allowed' : 'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.15s',
        lineHeight:     1,
        flexShrink:     0,
      }}
    >
      {label}
    </button>
  );
}
