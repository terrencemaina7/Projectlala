// ─── GuestPicker.jsx ──────────────────────────────────────────────────────────
// Centred modal overlay via React Portal.
// Dark backdrop covers the whole page; picker floats above everything.

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const C = {
  tuscanDark:'#5C4425', tuscan:'#8B6F47',
  pearl:'#F8F6F0', pearlDark:'#EDE9E0', pearlDeep:'#DDD6C8',
  charcoal:'#2C1F0E', muted:'#7A6A56', white:'#FFFFFF',
};

const ROWS = [
  { key:'adults',   label:'Adults',   sub:'Age 13 and above', min:1, max:16 },
  { key:'children', label:'Children', sub:'Ages 2 – 12',      min:0, max:10 },
  { key:'infants',  label:'Infants',  sub:'Under 2',          min:0, max:5  },
];

export default function GuestPicker({ value, onChange, onClose }) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const update = (key, delta) => {
    const row  = ROWS.find(r => r.key === key);
    const next = Math.min(row.max, Math.max(row.min, (value[key]||0) + delta));
    onChange({ ...value, [key]: next });
  };

  const total = (value.adults||1) + (value.children||0);

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0,
          background:'rgba(30,15,0,0.55)',
          zIndex:99998,
          backdropFilter:'blur(2px)',
          WebkitBackdropFilter:'blur(2px)',
        }}
      />

      {/* Panel — centred in viewport */}
      <div
        ref={panelRef}
        style={{
          position:  'fixed',
          top:       '50%',
          left:      '50%',
          transform: 'translate(-50%, -50%)',
          zIndex:    99999,
          background: C.white,
          borderRadius: 24,
          boxShadow: '0 32px 100px rgba(61,43,16,0.35)',
          border:    `1px solid ${C.pearlDeep}`,
          padding:   '28px 28px 24px',
          width:     'min(380px, 92vw)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:20 }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18,
              fontWeight:700, color:C.tuscanDark, margin:0 }}>
              Who's coming?
            </p>
            <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>
              Select the number of guests for your stay
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:C.pearlDark, border:'none', width:34, height:34,
              borderRadius:'50%', cursor:'pointer', fontSize:20, color:C.muted,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >×</button>
        </div>

        {/* Guest type rows */}
        {ROWS.map(({ key, label, sub, min, max }, i) => (
          <div
            key={key}
            style={{ display:'flex', alignItems:'center',
              justifyContent:'space-between', padding:'16px 0',
              borderBottom: i < ROWS.length-1 ? `1px solid ${C.pearlDeep}` : 'none' }}
          >
            <div>
              <p style={{ fontWeight:600, fontSize:15, color:C.charcoal, margin:0 }}>
                {label}
              </p>
              <p style={{ fontSize:12, color:C.muted, margin:'3px 0 0' }}>{sub}</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <StepBtn
                onClick={()=>update(key,-1)}
                disabled={(value[key]||0) <= min}
                label="−"
              />
              <span style={{ fontSize:18, fontWeight:700, color:C.charcoal,
                minWidth:24, textAlign:'center', fontFamily:"'Playfair Display',serif" }}>
                {value[key]||0}
              </span>
              <StepBtn
                onClick={()=>update(key,+1)}
                disabled={(value[key]||0) >= max}
                label="+"
              />
            </div>
          </div>
        ))}

        {/* Infants note */}
        {(value.infants||0) > 0 && (
          <p style={{ fontSize:11, color:C.muted, marginTop:12,
            lineHeight:1.6, background:C.pearl,
            borderRadius:8, padding:'8px 12px' }}>
            ℹ️ Infants under 2 are not counted toward the guest limit set by the host.
          </p>
        )}

        {/* Summary + confirm */}
        <div style={{ marginTop:20, padding:'14px 16px',
          background:C.pearl, borderRadius:12, marginBottom:16 }}>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>Selected</p>
          <p style={{ fontSize:16, fontWeight:700, color:C.tuscanDark, margin:'2px 0 0',
            fontFamily:"'Playfair Display',serif" }}>
            {total} guest{total!==1?'s':''}
            {(value.infants||0)>0
              ? `, ${value.infants} infant${value.infants!==1?'s':''}`
              : ''}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{ width:'100%', padding:'13px',
            background:C.tuscanDark, color:C.white,
            border:'none', borderRadius:12,
            fontSize:15, fontWeight:700, cursor:'pointer',
            letterSpacing:0.3 }}
        >
          Confirm guests
        </button>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}

function StepBtn({ onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:36, height:36, borderRadius:'50%',
        border:`2px solid ${disabled?C.pearlDeep:'#8B6F47'}`,
        background:disabled?C.pearlDark:C.white,
        color:disabled?C.pearlDeep:'#8B6F47',
        fontSize:20, fontWeight:700,
        cursor:disabled?'not-allowed':'pointer',
        display:'flex', alignItems:'center',
        justifyContent:'center', lineHeight:1,
        transition:'all 0.15s', flexShrink:0,
      }}
    >
      {label}
    </button>
  );
}
