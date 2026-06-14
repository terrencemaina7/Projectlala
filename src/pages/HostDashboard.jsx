// ─── HostDashboard.jsx ───────────────────────────────────────────────────────
// Private page for property owners to manage their listings.
//
// Features:
//   1. Lists all properties owned by the logged-in user
//   2. Calendar manager per property — owner can:
//      • Block a date range (e.g. property under maintenance)
//      • See all currently blocked ranges (guest bookings + owner blocks)
//      • Remove an owner-blocked range to re-open those dates
//      • Guest bookings are shown but CANNOT be deleted by the owner
//
// Access control:
//   • Requires user to be logged in
//   • In the seed data every listing has a `hostEmail` field
//   • In production, match user.email or user.uid against Firestore listing.hostUid

import React, { useState } from 'react';
import { useApp }           from '../context/AppContext';
import { LISTINGS }         from '../data/listings';
import { useBookedDates, expandRange, toKey } from '../hooks/useBookedDates';
import DateRangePicker      from '../components/DateRangePicker';

// ── Palette ───────────────────────────────────────────────────────────────────
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
  green:       '#16a34a',
  red:         '#ef4444',
  amber:       '#d97706',
};

const fmt       = (n)  => `KES ${Number(n).toLocaleString()}`;
const fmtDate   = (d)  => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort  = (d)  => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
const nightsDiff = (ci, co) =>
  Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86_400_000));

// ── Property selector card ────────────────────────────────────────────────────
function PropertyCard({ listing, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        width:        '100%',
        background:   selected ? C.orange + '12' : C.white,
        border:       `1.5px solid ${selected ? C.orange : C.pearlDeep}`,
        borderRadius: 14,
        padding:      '12px 14px',
        cursor:       'pointer',
        textAlign:    'left',
        transition:   'all 0.15s',
        marginBottom: 8,
      }}
    >
      <img
        src={listing.images?.[0]}
        alt={listing.title}
        style={{ width: 52, height: 52, borderRadius: 8,
          objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: C.charcoal,
          margin: 0, fontFamily: "'Playfair Display', serif",
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {listing.title}
        </p>
        <p style={{ color: C.muted, fontSize: 12, margin: '2px 0 0' }}>
          📍 {listing.location}
        </p>
      </div>
      {selected && (
        <span style={{ color: C.orange, fontSize: 18, flexShrink: 0 }}>›</span>
      )}
    </button>
  );
}

// ── Range row in the blocked-dates table ──────────────────────────────────────
function RangeRow({ range, onRemove }) {
  const nights  = nightsDiff(range.checkIn, range.checkOut);
  const isBlock = range.source === 'owner_block';
  const isBook  = range.source === 'booking';

  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           12,
      padding:       '12px 16px',
      borderBottom:  `1px solid ${C.pearlDeep}`,
      flexWrap:      'wrap',
    }}>
      {/* Source badge */}
      <span style={{
        fontSize:     11,
        fontWeight:   700,
        padding:      '3px 10px',
        borderRadius: 20,
        background:   isBook  ? '#E6F7E6' : '#FFF7E6',
        color:        isBook  ? C.green   : C.amber,
        border:       `1px solid ${isBook ? '#86efac' : '#fcd34d'}`,
        whiteSpace:   'nowrap',
        flexShrink:   0,
      }}>
        {isBook ? '🧳 Guest booking' : '🔒 Owner block'}
      </span>

      {/* Dates */}
      <span style={{ fontSize: 14, color: C.charcoal, fontWeight: 500, flex: 1 }}>
        {fmtShort(range.checkIn)} → {fmtShort(range.checkOut)}
        <span style={{ color: C.muted, fontSize: 12, marginLeft: 6 }}>
          ({nights} night{nights !== 1 ? 's' : ''})
        </span>
      </span>

      {/* Extra info */}
      {isBook && range.totalKES && (
        <span style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
          {fmt(range.totalKES)} · {range.method || 'paid'}
        </span>
      )}
      {range.note && !isBook && (
        <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic',
          flex: 1, minWidth: 80 }}>
          "{range.note}"
        </span>
      )}

      {/* Remove button — only owner blocks can be removed */}
      {isBlock ? (
        <button
          onClick={() => onRemove(range.id)}
          title="Remove this block to re-open these dates"
          style={{
            background:   C.red + '15',
            border:       `1px solid ${C.red}30`,
            color:        C.red,
            borderRadius: 8,
            padding:      '5px 12px',
            fontSize:     12,
            fontWeight:   600,
            cursor:       'pointer',
            whiteSpace:   'nowrap',
            flexShrink:   0,
          }}
        >
          🗑 Remove block
        </button>
      ) : (
        <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic',
          whiteSpace: 'nowrap', flexShrink: 0 }}>
          Cannot cancel
        </span>
      )}
    </div>
  );
}

// ── Calendar manager for a single listing ────────────────────────────────────
function CalendarManager({ listing }) {
  const { blockedDates, ranges, loading, addRange, removeRange } =
    useBookedDates(listing.id);

  const [pickerOpen, setPickerOpen]   = useState(false);
  const [newCheckIn, setNewCheckIn]   = useState(null);
  const [newCheckOut, setNewCheckOut] = useState(null);
  const [note,       setNote]         = useState('');
  const [saving,     setSaving]       = useState(false);
  const [tab,        setTab]          = useState('upcoming'); // 'upcoming' | 'all'

  const handleBlock = async () => {
    if (!newCheckIn || !newCheckOut) return;
    setSaving(true);
    await addRange({
      checkIn:  newCheckIn,
      checkOut: newCheckOut,
      source:   'owner_block',
      note:     note.trim() || 'Blocked by owner',
    });
    setNewCheckIn(null);
    setNewCheckOut(null);
    setNote('');
    setPickerOpen(false);
    setSaving(false);
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const upcoming = ranges.filter(
    (r) => new Date(r.checkOut) >= today
  ).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

  const past = ranges.filter(
    (r) => new Date(r.checkOut) < today
  ).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  const displayRanges = tab === 'upcoming' ? upcoming : past;

  const blockedCount = ranges.filter((r) => r.source === 'owner_block').length;
  const bookingCount = ranges.filter((r) => r.source === 'booking').length;

  return (
    <div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Guest bookings', value: bookingCount, color: C.green },
          { label: 'Owner blocks',   value: blockedCount, color: C.amber },
          { label: 'Blocked dates',  value: blockedDates.length, color: C.orange },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.white, borderRadius: 12,
            padding: '14px 16px', border: `1px solid ${C.pearlDeep}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted,
              textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>
              {label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color,
              fontFamily: "'Playfair Display', serif", margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Block dates button ──────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setPickerOpen((o) => !o)}
          style={{
            background:   pickerOpen ? C.tuscanDark : C.orange,
            color:        C.white,
            border:       'none',
            borderRadius: 12,
            padding:      '12px 22px',
            fontSize:     14,
            fontWeight:   700,
            cursor:       'pointer',
          }}
        >
          {pickerOpen ? '× Cancel' : '+ Block date range'}
        </button>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
          Block dates for maintenance, personal use, or any reason you choose.
          Guests will not be able to book these dates.
        </p>
      </div>

      {/* ── Date range picker for new block ─────────────────────────── */}
      {pickerOpen && (
        <div style={{ background: C.white, borderRadius: 16,
          border: `1px solid ${C.pearlDeep}`,
          padding: '20px', marginBottom: 24,
          boxShadow: '0 4px 20px rgba(61,43,16,0.08)' }}>

          <p style={{ fontFamily: "'Playfair Display', serif",
            fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>
            Select dates to block
          </p>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
            Greyed-out dates are already blocked or booked by guests.
          </p>

          {/* Inline calendar — always visible, not a popup */}
          <InlineCalendar
            checkIn={newCheckIn}
            checkOut={newCheckOut}
            blockedDates={blockedDates}
            onChange={({ checkIn: ci, checkOut: co }) => {
              setNewCheckIn(ci);
              setNewCheckOut(co);
            }}
          />

          {/* Selected range summary */}
          {newCheckIn && (
            <div style={{ marginTop: 16, padding: '12px 16px',
              background: C.pearl, borderRadius: 10,
              border: `1px solid ${C.pearlDeep}` }}>
              <p style={{ fontSize: 14, color: C.charcoal, margin: 0, fontWeight: 600 }}>
                {newCheckOut
                  ? `Blocking: ${fmtShort(newCheckIn)} → ${fmtShort(newCheckOut)} (${nightsDiff(newCheckIn, newCheckOut)} night${nightsDiff(newCheckIn, newCheckOut) !== 1 ? 's' : ''})`
                  : `Check-in: ${fmtShort(newCheckIn)} — select end date`}
              </p>
            </div>
          )}

          {/* Note input */}
          <div style={{ marginTop: 14 }}>
            <label style={smallLabel}>Reason (optional)</label>
            <input
              placeholder="e.g. Maintenance, Family stay, Renovation…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${C.pearlDeep}`, fontSize: 14,
                color: C.charcoal, background: C.pearlDark,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Confirm button */}
          <button
            onClick={handleBlock}
            disabled={!newCheckIn || !newCheckOut || saving}
            style={{
              marginTop:    16,
              width:        '100%',
              padding:      '12px',
              background:   newCheckIn && newCheckOut ? C.tuscanDark : C.pearlDeep,
              color:        newCheckIn && newCheckOut ? C.white : C.muted,
              border:       'none',
              borderRadius: 12,
              fontSize:     14,
              fontWeight:   700,
              cursor:       newCheckIn && newCheckOut ? 'pointer' : 'not-allowed',
            }}
          >
            {saving
              ? 'Saving…'
              : newCheckIn && newCheckOut
              ? `🔒 Block ${nightsDiff(newCheckIn, newCheckOut)} night${nightsDiff(newCheckIn, newCheckOut) !== 1 ? 's' : ''}`
              : 'Select a date range above'}
          </button>
        </div>
      )}

      {/* ── Blocked ranges table ─────────────────────────────────────── */}
      <div style={{ background: C.white, borderRadius: 16,
        border: `1px solid ${C.pearlDeep}`, overflow: 'hidden' }}>

        {/* Table header + tabs */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.pearlDeep}`,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontFamily: "'Playfair Display', serif",
            fontSize: 16, fontWeight: 700, color: C.charcoal, margin: 0 }}>
            Date blocks & bookings
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { id: 'all',      label: `Past (${past.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding:      '5px 14px',
                  borderRadius: 20,
                  border:       `1px solid ${tab === t.id ? C.orange : C.pearlDeep}`,
                  background:   tab === t.id ? C.orange + '12' : C.white,
                  color:        tab === t.id ? C.orange : C.muted,
                  fontSize:     12,
                  fontWeight:   tab === t.id ? 700 : 400,
                  cursor:       'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: C.muted }}>Loading…</p>
          </div>
        ) : displayRanges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📅</p>
            <p style={{ fontFamily: "'Playfair Display', serif",
              fontSize: 16, color: C.charcoal, marginBottom: 4 }}>
              {tab === 'upcoming' ? 'No upcoming blocks or bookings' : 'No past records'}
            </p>
            <p style={{ color: C.muted, fontSize: 13 }}>
              {tab === 'upcoming'
                ? 'Your calendar is open. Block dates above when needed.'
                : 'Past bookings will appear here.'}
            </p>
          </div>
        ) : (
          displayRanges.map((r) => (
            <RangeRow key={r.id} range={r} onRemove={removeRange} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Inline two-month calendar (no popup — always visible for host UI) ─────────
function InlineCalendar({ checkIn, checkOut, blockedDates, onChange }) {
  const [leftMonth, setLeftMonth] = useState(() => {
    const t = new Date(); t.setDate(1); return t;
  });
  const [hovered, setHovered] = useState(null);
  const [step,    setStep]    = useState(checkIn ? 'out' : 'in');

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];

  const daysInMonth  = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstWeekday = (y, m) => new Date(y, m, 1).getDay();
  const shiftMonth   = (d, n) => {
    const r = new Date(d); r.setDate(1); r.setMonth(r.getMonth() + n); return r;
  };
  const sameDay = (a, b) => a && b && toKey(a) === toKey(b);
  const between = (date, s, e) => {
    if (!s || !e) return false;
    const t = date.getTime();
    return t > Math.min(s.getTime(), e.getTime()) && t < Math.max(s.getTime(), e.getTime());
  };

  const rightMonth = shiftMonth(leftMonth, 1);
  const rangeEnd   = checkOut || hovered;

  const handlePick = (date) => {
    if (step === 'in' || (checkIn && date <= checkIn)) {
      onChange({ checkIn: date, checkOut: null });
      setStep('out'); setHovered(null);
    } else {
      onChange({ checkIn, checkOut: date });
      setStep('in'); setHovered(null);
    }
  };

  const renderMonth = (year, month) => {
    const total  = daysInMonth(year, month);
    const offset = firstWeekday(year, month);
    const cells  = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));

    return (
      <div style={{ flex: '1 1 220px', minWidth: 200 }}>
        <p style={{ textAlign: 'center', fontFamily: "'Playfair Display', serif",
          fontWeight: 700, fontSize: 13, color: C.tuscanDark, margin: '0 0 10px' }}>
          {MONTHS[month]} {year}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700,
              color: C.muted, textTransform: 'uppercase', padding: '2px 0' }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((date, idx) => {
            if (!date) return <div key={`e${idx}`} style={{ height: 34 }} />;
            const key       = toKey(date);
            const isBlocked = blockedDates.includes(key);
            const isPast    = date < today;
            const disabled  = isBlocked || isPast;
            const isStart   = sameDay(date, checkIn);
            const isEnd     = sameDay(date, checkOut);
            const isHov     = sameDay(date, hovered) && !checkOut && checkIn;
            const inRange   = !disabled && checkIn && between(date, checkIn, rangeEnd);
            const isToday   = sameDay(date, today);

            let stripBg = 'transparent', stripRadius = '0';
            if (inRange) {
              stripBg = '#F0E4D4';
              if (date.getDay() === 0 || sameDay(date, checkIn))       stripRadius = '20px 0 0 20px';
              else if (date.getDay() === 6 || sameDay(date, rangeEnd)) stripRadius = '0 20px 20px 0';
            }

            let bg = 'transparent', fg = disabled ? '#C0A882' : C.charcoal, border = 'none';
            if (isStart || isEnd)        { bg = C.tuscanDark; fg = C.white; }
            else if (isHov)              { bg = C.tuscanLight; fg = C.white; }
            else if (isToday && !disabled) border = `2px solid ${C.orange}`;

            return (
              <div key={key} style={{ background: stripBg, borderRadius: stripRadius, padding: '1px 0' }}>
                <div
                  onClick={() => !disabled && handlePick(date)}
                  onMouseEnter={() => !disabled && checkIn && !checkOut && setHovered(date)}
                  onMouseLeave={() => setHovered(null)}
                  title={isBlocked ? 'Already blocked/booked' : isPast ? 'Past date' : undefined}
                  style={{
                    height: 34, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
                    borderRadius: '50%', background: bg, border, color: fg,
                    fontSize: 12, fontWeight: isStart || isEnd ? 700 : 400,
                    opacity: disabled ? 0.3 : 1, userSelect: 'none',
                    textDecoration: isBlocked ? 'line-through' : 'none',
                  }}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canBack = leftMonth > today;

  return (
    <div>
      {/* Instruction */}
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontWeight: 500 }}>
        {step === 'in'
          ? '👆 Click the first date you want to block'
          : `✅ Start: ${fmtShort(checkIn)} — now click the end date`}
      </p>

      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={() => canBack && setLeftMonth((m) => shiftMonth(m, -1))}
          style={{ background: canBack ? C.pearl : C.pearlDark,
            border: `1px solid ${C.pearlDeep}`, borderRadius: '50%',
            width: 32, height: 32, cursor: canBack ? 'pointer' : 'not-allowed',
            fontSize: 16, color: canBack ? C.tuscanDark : '#C0A882',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canBack ? 1 : 0.4 }}>
          ‹
        </button>
        <button
          onClick={() => setLeftMonth((m) => shiftMonth(m, 1))}
          style={{ background: C.pearl, border: `1px solid ${C.pearlDeep}`,
            borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
            fontSize: 16, color: C.tuscanDark,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ›
        </button>
      </div>

      {/* Two month grids */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {renderMonth(leftMonth.getFullYear(), leftMonth.getMonth())}
        {renderMonth(rightMonth.getFullYear(), rightMonth.getMonth())}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        {[
          { bg: C.tuscanDark, label: 'Selected' },
          { bg: '#F0E4D4',    label: 'Range' },
          { bg: '#EDE9E0',    label: 'Blocked/Booked', fade: true },
          { ring: C.orange,   label: 'Today' },
        ].map(({ bg, ring, label, fade }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center',
            gap: 5, fontSize: 11, color: C.muted }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%',
              background: bg || 'transparent', opacity: fade ? 0.4 : 1,
              border: ring ? `2px solid ${ring}` : 'none', flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main HostDashboard ────────────────────────────────────────────────────────
export default function HostDashboard() {
  const { user, setPage } = useApp();
  const [selectedId, setSelectedId] = useState(null);

  // ── Guard: must be logged in ─────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🔐</p>
        <p style={{ fontFamily: "'Playfair Display', serif",
          fontSize: 20, color: C.charcoal, marginBottom: 20 }}>
          Please log in to access your host dashboard
        </p>
        <button
          onClick={() => setPage('home')}
          style={{ background: C.orange, color: C.white, border: 'none',
            borderRadius: 12, padding: '12px 28px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer' }}
        >
          ← Back to home
        </button>
      </div>
    );
  }

  // ── Filter listings to ones owned by this user ───────────────────────────
  // In production: match listing.hostUid === user.uid from Firestore
  // For demo: show all listings (every logged-in user acts as a host)
  const myListings = LISTINGS.filter(
    (l) => l.host === user.name ||
           l.hostEmail === user.email ||
           true  // ← remove this line in production; keeps demo working
  );

  const selectedListing = myListings.find((l) => l.id === selectedId);

  return (
    <div style={{ background: C.pearl, minHeight: '100vh', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => setPage('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, fontSize: 14, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Back to site
          </button>
          <h1 style={{ fontFamily: "'Playfair Display', serif",
            fontSize: 30, color: C.charcoal, margin: '0 0 6px' }}>
            Host Dashboard
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            Manage your listings and block unavailable dates to prevent double booking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* ── Left: property list ───────────────────────────────────── */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: C.white, borderRadius: 16,
              border: `1px solid ${C.pearlDeep}`, padding: '20px' }}>
              <p style={{ fontFamily: "'Playfair Display', serif",
                fontSize: 16, fontWeight: 700, color: C.charcoal, margin: '0 0 14px' }}>
                Your properties
              </p>

              {myListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>🏡</p>
                  <p style={{ color: C.muted, fontSize: 13 }}>
                    No listings yet.
                  </p>
                  <button
                    onClick={() => setPage('list')}
                    style={{ marginTop: 10, background: C.orange, color: C.white,
                      border: 'none', borderRadius: 10, padding: '8px 18px',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + List a property
                  </button>
                </div>
              ) : (
                myListings.map((l) => (
                  <PropertyCard
                    key={l.id}
                    listing={l}
                    selected={selectedId === l.id}
                    onClick={() => setSelectedId(l.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Right: calendar manager ───────────────────────────────── */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            {selectedListing ? (
              <div>
                {/* Property title bar */}
                <div style={{ background: C.white, borderRadius: 16,
                  border: `1px solid ${C.pearlDeep}`, padding: '16px 20px',
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src={selectedListing.images?.[0]}
                    alt={selectedListing.title}
                    style={{ width: 56, height: 56, borderRadius: 10,
                      objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ fontFamily: "'Playfair Display', serif",
                      fontWeight: 700, fontSize: 16, color: C.charcoal, margin: 0 }}>
                      {selectedListing.title}
                    </p>
                    <p style={{ color: C.muted, fontSize: 13, margin: '2px 0 0' }}>
                      📍 {selectedListing.location}
                    </p>
                  </div>
                </div>

                <CalendarManager listing={selectedListing} />
              </div>
            ) : (
              // No listing selected yet
              <div style={{ background: C.white, borderRadius: 16,
                border: `1px solid ${C.pearlDeep}`, padding: '60px 24px',
                textAlign: 'center' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>📅</p>
                <p style={{ fontFamily: "'Playfair Display', serif",
                  fontSize: 20, color: C.charcoal, marginBottom: 8 }}>
                  Select a property
                </p>
                <p style={{ color: C.muted, fontSize: 14 }}>
                  Choose a property on the left to manage its calendar
                  and prevent double booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const smallLabel = {
  display:       'block',
  fontSize:      11,
  fontWeight:    700,
  color:         '#7A6A56',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom:  6,
};
