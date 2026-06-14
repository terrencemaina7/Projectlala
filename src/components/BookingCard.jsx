// ─── BookingCard.jsx ──────────────────────────────────────────────────────────
// Booking widget on the Property Detail page.
// The "Pay" and "Book now" buttons call onBookNow() which navigates to PaymentPage.
// BookingCard itself no longer handles payment — it only collects dates/guests
// and shows the price breakdown.
//
// Props:
//   listing        {object}    property data
//   checkIn        {Date|null}
//   checkOut       {Date|null}
//   onDatesChange  {fn}        ({ checkIn, checkOut }) => void
//   guests         {object}    { adults, children, infants }
//   onGuestsChange {fn}        (guests) => void
//   onBookNow      {fn}        called when user clicks any pay button — triggers navigation
//   user           {object|null}

import React, { useState } from 'react';
import { createPortal }    from 'react-dom';
import DateRangePicker     from './DateRangePicker';
import GuestPicker         from './GuestPicker';

// ── Try to import payment modules — gracefully skip if not yet created ─────────
let initiateMpesaPayment = null;
let checkMpesaStatus     = null;
let CardPaymentForm      = null;
try {
  const mpesa = require('../payment/mpesa');
  initiateMpesaPayment = mpesa.initiateMpesaPayment;
  checkMpesaStatus     = mpesa.checkMpesaStatus;
} catch {}
try {
  const card = require('../payment/card');
  CardPaymentForm = card.CardPaymentForm;
} catch {}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  tuscanDark:'#5C4425', tuscan:'#8B6F47', tuscanLight:'#A68B5B',
  pearl:'#F8F6F0', pearlDark:'#EDE9E0', pearlDeep:'#DDD6C8',
  orange:'#FF5E3A', charcoal:'#2C1F0E', muted:'#7A6A56',
  white:'#FFFFFF', green:'#16a34a', red:'#ef4444', whatsapp:'#25D366',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = n => `KES ${Number(n).toLocaleString()}`;
const fmtShort = d => d.toLocaleDateString('en-KE', { day:'numeric', month:'short' });

/** Derive number of nights from two Date objects. Returns 0 if either is null. */
const calcNights = (ci, co) =>
  ci && co ? Math.max(1, Math.round((co - ci) / 86_400_000)) : 0;

/** Push checkOut forward or backward by delta days */
const shiftCheckOut = (checkOut, delta) => {
  const d = new Date(checkOut);
  d.setDate(d.getDate() + delta);
  return d;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const miniLabel = {
  display:'block', fontSize:11, fontWeight:700,
  color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6,
};

function StepBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:34, height:34, borderRadius:'50%',
      border:`2px solid ${disabled ? C.pearlDeep : C.tuscan}`,
      background:disabled ? C.pearlDark : C.white,
      color:disabled ? C.pearlDeep : C.tuscan,
      fontSize:20, fontWeight:700, lineHeight:1,
      cursor:disabled ? 'not-allowed' : 'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0, transition:'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function PriceLine({ label, value, bold, warn }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
      <span style={{ color:warn?'#d97706':C.muted, fontSize:14 }}>{label}</span>
      <span style={{ color:warn?'#d97706':C.charcoal, fontSize:14,
        fontWeight:bold||warn ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function PayBtn({ onClick, disabled, children, secondary }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'13px', marginBottom:10,
      background: secondary ? 'none' : disabled ? C.pearlDeep : C.orange,
      color: secondary ? C.muted : disabled ? C.muted : C.white,
      border: secondary ? `1px solid ${C.pearlDeep}` : 'none',
      borderRadius:12, fontSize:15, fontWeight:700,
      cursor:disabled ? 'not-allowed' : 'pointer',
      letterSpacing:0.3, transition:'background 0.15s',
    }}>
      {children}
    </button>
  );
}

function ConfirmedBanner({ listing, method, nights, grandTotal, checkIn, checkOut }) {
  return (
    <div style={{ textAlign:'center', padding:'8px 0' }}>
      <div style={{ fontSize:48, marginBottom:10 }}>🎉</div>
      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18,
        color:C.charcoal, marginBottom:8 }}>
        Booking confirmed!
      </p>
      <div style={{ background:'#f0fdf4', border:'1px solid #86efac',
        borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <p style={{ color:C.green, fontWeight:700, fontSize:14, margin:'0 0 4px' }}>
          ✓ Payment received via {method === 'mpesa' ? 'M-Pesa' : 'card'}
        </p>
        {checkIn && checkOut && (
          <p style={{ color:'#15803d', fontSize:13, margin:0 }}>
            {fmtShort(checkIn)} → {fmtShort(checkOut)} · {nights} night{nights!==1?'s':''} · {fmt(grandTotal)}
          </p>
        )}
      </div>
      <a
        href={`https://wa.me/${listing.hostPhone}?text=Hi ${listing.host}! I've just confirmed my booking for "${listing.title}" on LalaKenya 🏡`}
        target="_blank" rel="noreferrer"
        style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:8, background:C.whatsapp, color:C.white, borderRadius:12,
          padding:'12px', fontWeight:700, fontSize:14, textDecoration:'none' }}
      >
        💬 Message your host
      </a>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BookingCard({
  listing,
  checkIn,
  checkOut,
  blockedDates,
  onDatesChange,
  guests,
  onGuestsChange,
  onBookNow,
  user,
}) {
  const [calOpen,   setCalOpen]   = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  // ── All pricing derived — no stored nights/total state ───────────────────
  const nights        = calcNights(checkIn, checkOut);
  const pricePerNight = listing?.price || 0;
  const subtotal      = pricePerNight * (nights || 1);
  // Service fee exists internally but is NOT shown to guests
  const serviceFee    = Math.round(subtotal * 0.1);
  const grandTotal    = subtotal + serviceFee;
  // Guest-facing total — clean, no fee
  const guestTotal    = subtotal;
  const totalGuests   = (guests?.adults || 1) + (guests?.children || 0);
  const overCapacity  = totalGuests > (listing?.guests || 99);

  // ── Night stepper — shifts checkOut, no setNights anywhere ─────────────
  const addNight = () => {
    if (!checkIn) return;
    const base = checkOut || new Date(checkIn);
    onDatesChange({ checkIn, checkOut: shiftCheckOut(base, 1) });
  };

  const removeNight = () => {
    if (!checkIn || !checkOut || nights <= 1) return;
    const next = shiftCheckOut(checkOut, -1);
    if (next <= checkIn) return;
    onDatesChange({ checkIn, checkOut: next });
  };

  const handleBookNow = () => {
    if (!user)                 { alert('Please log in to book.'); return; }
    if (!checkIn || !checkOut) { alert('Please select your dates first.'); return; }
    onBookNow?.();
  };

  return (
    <>
      {/* ── Price per night headline ────────────────────────────────── */}
      <div style={{ marginBottom:18, display:'flex', alignItems:'baseline', gap:6 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26,
          fontWeight:700, color:C.charcoal }}>
          {fmt(pricePerNight)}
        </span>
        <span style={{ color:C.muted, fontSize:14 }}> / night</span>
        {nights > 0 && (
          <span style={{ marginLeft:'auto', fontSize:13, color:C.tuscan, fontWeight:600 }}>
            {nights} night{nights!==1?'s':''}
          </span>
        )}
      </div>

      {/* ── Date selector ──────────────────────────────────────────── */}
      <div style={{ marginBottom:12 }}>
        <label style={miniLabel}>Dates</label>
        <button
          onClick={() => { setCalOpen(o => !o); setGuestOpen(false); }}
          style={{
            width:'100%', padding:'11px 14px', borderRadius:10,
            border:`1.5px solid ${calOpen ? C.tuscanDark : C.pearlDeep}`,
            background:C.pearlDark, cursor:'pointer',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            fontSize:14, color:checkIn ? C.charcoal : C.muted,
            fontWeight:checkIn ? 500 : 400,
          }}
        >
          <span>
            {checkIn && checkOut
              ? `${fmtShort(checkIn)} → ${fmtShort(checkOut)}`
              : checkIn
              ? `${fmtShort(checkIn)} — pick end date`
              : '📅 Select dates'}
          </span>
          <span style={{ fontSize:12, color:C.muted }}>▾</span>
        </button>
      </div>

      {/* ── Night stepper (visible once dates are chosen) ──────────── */}
      {checkIn && checkOut && (
        <div style={{ marginBottom:14 }}>
          <label style={miniLabel}>Adjust nights</label>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <StepBtn onClick={removeNight} disabled={nights <= 1}>−</StepBtn>
            <div style={{ flex:1, textAlign:'center' }}>
              <span style={{ fontSize:18, fontWeight:700, color:C.charcoal,
                fontFamily:"'Playfair Display',serif" }}>
                {nights}
              </span>
              <span style={{ fontSize:13, color:C.muted, marginLeft:5 }}>
                night{nights!==1?'s':''}
              </span>
            </div>
            <StepBtn onClick={addNight} disabled={false}>+</StepBtn>
          </div>
        </div>
      )}

      {/* ── Guest selector ─────────────────────────────────────────── */}
      <div style={{ marginBottom:18 }}>
        <label style={miniLabel}>Guests</label>
        <button
          onClick={() => { setGuestOpen(o => !o); setCalOpen(false); }}
          style={{
            width:'100%', padding:'11px 14px', borderRadius:10,
            border:`1.5px solid ${guestOpen ? C.tuscanDark : C.pearlDeep}`,
            background:C.pearlDark, cursor:'pointer',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            fontSize:14, color:C.charcoal, fontWeight:500,
          }}
        >
          <span>
            👥 {totalGuests} guest{totalGuests!==1?'s':''}
            {(guests?.infants||0) > 0 ? `, ${guests.infants} infant${guests.infants!==1?'s':''}` : ''}
          </span>
          {overCapacity && (
            <span style={{ fontSize:11, color:'#d97706', fontWeight:600 }}>
              Over limit ⚠️
            </span>
          )}
          {!overCapacity && <span style={{ fontSize:12, color:C.muted }}>▾</span>}
        </button>
      </div>

      {/* ── Pricing breakdown ──────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${C.pearlDeep}`, paddingTop:14, marginBottom:18 }}>
        {nights > 0 ? (
          <>
            <PriceLine
              label={`${fmt(pricePerNight)} × ${nights} night${nights!==1?'s':''}`}
              value={fmt(subtotal)}
            />
            {checkIn && checkOut && (
              <PriceLine
                label={`${fmtShort(checkIn)} – ${fmtShort(checkOut)} · ${totalGuests} guest${totalGuests!==1?'s':''}`}
                value=""
              />
            )}
            {overCapacity && (
              <PriceLine
                label={`⚠️ ${totalGuests - listing.guests} over host limit`}
                value="Contact host"
                warn
              />
            )}
            <PriceLine
              label="Service fee (10%)"
              value={fmt(serviceFee)}
            />
            <div style={{ display:'flex', justifyContent:'space-between',
              borderTop:`1px solid ${C.pearlDeep}`, paddingTop:10, marginTop:4 }}>
              <span style={{ fontWeight:700, fontSize:15, color:C.charcoal }}>Total</span>
              <span style={{ fontWeight:700, fontSize:20, color:C.tuscanDark,
                fontFamily:"'Playfair Display',serif" }}>
                {fmt(grandTotal)}
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'10px 0 6px' }}>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>
              Select your dates to see the total price
            </p>
          </div>
        )}
      </div>

      {/* ── Book Now button ────────────────────────────────────────── */}
      <button
        onClick={handleBookNow}
        disabled={!checkIn || !checkOut}
        style={{
          width:'100%', padding:'14px',
          background: checkIn && checkOut ? C.orange : C.pearlDeep,
          color: checkIn && checkOut ? C.white : C.muted,
          border:'none', borderRadius:12, fontSize:15, fontWeight:700,
          cursor: checkIn && checkOut ? 'pointer' : 'not-allowed',
          letterSpacing:0.3, marginBottom:10, transition:'background 0.15s',
        }}
      >
        {checkIn && checkOut
          ? `Book now — ${fmt(grandTotal)}`
          : 'Select dates to continue'}
      </button>
      <p style={{ color:C.muted, fontSize:11, textAlign:'center', marginBottom:12 }}>
        You won't be charged yet · Choose payment on the next screen
      </p>

      {/* ── WhatsApp ───────────────────────────────────────────────── */}
      <a
        href={`https://wa.me/${listing.hostPhone}?text=Hi, I'm interested in "${listing.title}" on LalaKenya`}
        target="_blank" rel="noreferrer"
        style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:8, background:C.whatsapp, color:C.white, borderRadius:12,
          padding:'11px', fontWeight:700, fontSize:14,
          textDecoration:'none', marginTop:4, marginBottom:6 }}
      >
        💬 Contact host via WhatsApp
      </a>
      <p style={{ color:C.muted, fontSize:11, textAlign:'center' }}>
        Hosted by {listing.host} · M-Pesa and card accepted
      </p>

      {/* ── Portaled modals ────────────────────────────────────────── */}
      {calOpen && createPortal(
  <DateRangePicker
    checkIn={checkIn} checkOut={checkOut} blockedDates={blockedDates || []}
    onChange={({ checkIn:ci, checkOut:co }) => onDatesChange({ checkIn:ci, checkOut:co })}
    onClose={() => setCalOpen(false)}
    />,
      document.body
    )}

      {guestOpen && createPortal(
        <GuestPicker
          value={guests}
          onChange={onGuestsChange}
          onClose={() => setGuestOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
