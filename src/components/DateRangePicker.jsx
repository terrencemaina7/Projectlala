// ─── DateRangePicker.jsx ──────────────────────────────────────────────────────
// A self-contained popup calendar that lets guests pick a check-in / check-out
// date range.  Blocked/booked dates are greyed out and unclickable.
// The popup appears directly below whichever button triggered it.
//
// Usage:
//   <DateRangePicker
//     checkIn={checkIn}              // Date | null
//     checkOut={checkOut}            // Date | null
//     onChange={({ checkIn, checkOut }) => ...}
//     blockedDates={['2025-06-10', '2025-06-11']}   // 'YYYY-MM-DD' strings
//     onClose={() => setCalOpen(false)}
//   />

import React, { useState, useEffect, useRef } from 'react';

// ─── Palette (inline so the component works without theme.js) ─────────────────
const C = {
  tuscanDark:  '#5C4425',
  tuscan:      '#8B6F47',
  tuscanLight: '#A68B5B',
  tuscanPale:  '#E8D5BC',
  pearl:       '#F8F6F0',
  pearlDark:   '#EDE9E0',
  pearlDeep:   '#DDD6C8',
  orange:      '#FF5E3A',
  charcoal:    '#2C1F0E',
  muted:       '#7A6A56',
  mutedLight:  '#C0A882',
  white:       '#FFFFFF',
  blocked:     '#F0EBE3',
  blockedText: '#C0A882',
  inRange:     '#F0E4D4',
  green:       '#16a34a',
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Date → 'YYYY-MM-DD' */
const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/** Are two dates the same calendar day? */
const sameDay = (a, b) => a && b && toKey(a) === toKey(b);

/** Is `date` strictly between `start` and `end`? */
const between = (date, start, end) => {
  if (!start || !end) return false;
  const t = date.getTime();
  return t > Math.min(start.getTime(), end.getTime()) &&
         t < Math.max(start.getTime(), end.getTime());
};

/** Does the range [start, end) contain any blocked date? */
const rangeHasBlocked = (start, end, blocked) => {
  if (!start || !end) return false;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < end) {
    if (blocked.includes(toKey(cursor))) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
};

/** How many days are in a given month? */
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

/** What weekday does the 1st fall on? */
const firstWeekday = (y, m) => new Date(y, m, 1).getDay();

/** Add/subtract whole months from a Date (always returns the 1st) */
const shiftMonth = (date, delta) => {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return d;
};

/** Format a Date for display, e.g. "5 Jun" */
const fmtShort = (d) =>
  d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

// ─── Single month calendar grid ───────────────────────────────────────────────

function MonthGrid({ year, month, checkIn, checkOut, hovered, blocked, onPick, onHover }) {
  const today   = new Date(); today.setHours(0,0,0,0);
  const total   = daysInMonth(year, month);
  const offset  = firstWeekday(year, month);
  const rangeEnd = checkOut || hovered;

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));

  return (
    <div style={{ flex: '1 1 260px', minWidth: 240 }}>
      {/* Month + year heading */}
      <p style={{
        textAlign: 'center', margin: '0 0 12px',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 15, fontWeight: 700, color: C.tuscanDark,
      }}>
        {MONTHS[month]} {year}
      </p>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: C.muted, padding: '2px 0', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {cells.map((date, idx) => {
          if (!date) return <div key={`e${idx}`} style={{ height: 38 }} />;

          const key        = toKey(date);
          const isBlocked  = blocked.includes(key);
          const isPast     = date < today;
          const disabled   = isBlocked || isPast;
          const isStart    = sameDay(date, checkIn);
          const isEnd      = sameDay(date, checkOut);
          const isEndHover = sameDay(date, hovered) && !checkOut;
          const inRange    = !disabled && checkIn && between(date, checkIn, rangeEnd);
          const isToday    = sameDay(date, today);

          // Background for range strip
          let stripBg = 'transparent';
          let stripRadius = '0';
          if (inRange) {
            stripBg     = C.inRange;
            stripRadius = '0';
            if (sameDay(date, checkIn) || date.getDay() === 0) stripRadius = '20px 0 0 20px';
            if (sameDay(date, rangeEnd) || date.getDay() === 6) stripRadius = '0 20px 20px 0';
          }

          // Circle background
          let circleBg     = 'transparent';
          let circleColor  = disabled ? C.blockedText : C.charcoal;
          let circleBorder = 'none';

          if (isStart || isEnd) {
            circleBg    = C.tuscanDark;
            circleColor = C.white;
          } else if (isEndHover && checkIn) {
            circleBg    = C.tuscanLight;
            circleColor = C.white;
          } else if (isToday && !disabled) {
            circleBorder = `2px solid ${C.orange}`;
          }

          return (
            <div
              key={key}
              style={{ background: stripBg, borderRadius: stripRadius, padding: '1px 0' }}
            >
              <div
                onClick={() => !disabled && onPick(date)}
                onMouseEnter={() => !disabled && checkIn && !checkOut && onHover(date)}
                onMouseLeave={() => onHover(null)}
                title={isBlocked ? '🚫 Already booked' : isPast ? 'Past date' : undefined}
                style={{
                  height:          38,
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  cursor:          disabled ? 'not-allowed' : 'pointer',
                  borderRadius:    '50%',
                  background:      circleBg,
                  border:          circleBorder,
                  color:           circleColor,
                  fontSize:        13,
                  fontWeight:      isStart || isEnd ? 700 : 400,
                  opacity:         disabled ? 0.35 : 1,
                  transition:      'background 0.1s, transform 0.1s',
                  transform:       !disabled && !isStart && !isEnd ? undefined : undefined,
                  position:        'relative',
                  userSelect:      'none',
                  WebkitUserSelect:'none',
                  // Strikethrough for blocked
                  textDecoration:  isBlocked ? 'line-through' : 'none',
                }}
              >
                {date.getDate()}
                {/* Booked indicator dot */}
                {isBlocked && (
                  <span style={{
                    position: 'absolute', bottom: 3, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%',
                    background: C.mutedLight,
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main DateRangePicker popup ───────────────────────────────────────────────

export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  blockedDates = [],
  onClose,
}) {
  const today = new Date(); today.setHours(0,0,0,0);

  // Left calendar always starts at current month; right is next month
  const [leftMonth, setLeftMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [hovered,   setHovered]   = useState(null);
  // Are we waiting for checkIn or checkOut next?
  const [step,      setStep]      = useState(checkIn ? 'out' : 'in');

  const rightMonth = shiftMonth(leftMonth, 1);
  const popupRef   = useRef(null);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    // Small delay so the button that opened us doesn't immediately close us
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // ── Handle a day being clicked ────────────────────────────────────────────
  const handlePick = (date) => {
    if (step === 'in' || (checkIn && date <= checkIn)) {
      // Start a fresh selection
      onChange({ checkIn: date, checkOut: null });
      setStep('out');
      setHovered(null);
    } else {
      // Completing the range — guard against blocked dates inside it
      if (rangeHasBlocked(checkIn, date, blockedDates)) {
        alert(
          'One or more dates in your selected range are already booked.\n' +
          'Please choose dates that avoid the unavailable (greyed-out) dates.'
        );
        onChange({ checkIn: null, checkOut: null });
        setStep('in');
        return;
      }
      onChange({ checkIn, checkOut: date });
      setStep('in');
      setHovered(null);
    }
  };

  const nights = checkIn && checkOut
    ? Math.round((checkOut - checkIn) / 86_400_000)
    : 0;

  const canGoBack = leftMonth > today;

  return (
    <div
      ref={popupRef}
      style={{
        position:    'absolute',
        top:         'calc(100% + 8px)',
        left:        '50%',
        transform:   'translateX(-50%)',
        zIndex:      3000,
        background:  C.white,
        borderRadius: 20,
        boxShadow:   '0 20px 64px rgba(61,43,16,0.22)',
        border:      `1px solid ${C.pearlDeep}`,
        padding:     '24px 20px 18px',
        width:       'min(640px, 96vw)',
        boxSizing:   'border-box',
      }}
    >
      {/* ── Instruction strip ──────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   18,
        flexWrap:       'wrap',
        gap:            8,
      }}>
        <div>
          <p style={{
            fontFamily:   "'Playfair Display', serif",
            fontSize:     15, fontWeight: 700,
            color:        C.tuscanDark, margin: 0,
          }}>
            {step === 'in' ? '📅 Pick your check-in date' : '📅 Now pick check-out date'}
          </p>
          <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0' }}>
            {checkIn && checkOut
              ? `✓ ${fmtShort(checkIn)} → ${fmtShort(checkOut)}  ·  ${nights} night${nights !== 1 ? 's' : ''}`
              : checkIn
              ? `Check-in: ${fmtShort(checkIn)} — now select check-out`
              : 'Greyed-out dates are already booked'}
          </p>
        </div>
        {/* Close X */}
        <button
          onClick={onClose}
          style={{
            background: C.pearlDark, border: 'none',
            width: 30, height: 30, borderRadius: '50%',
            cursor: 'pointer', fontSize: 16,
            color: C.muted, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* ── Month navigation ───────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   12,
      }}>
        <button
          onClick={() => canGoBack && setLeftMonth(m => shiftMonth(m, -1))}
          style={{
            background:  canGoBack ? C.pearl : C.pearlDark,
            border:      `1px solid ${C.pearlDeep}`,
            borderRadius:'50%', width: 34, height: 34,
            cursor:      canGoBack ? 'pointer' : 'not-allowed',
            fontSize:    18, color: canGoBack ? C.tuscanDark : C.mutedLight,
            display:     'flex', alignItems: 'center', justifyContent: 'center',
            opacity:     canGoBack ? 1 : 0.35,
          }}
        >‹</button>

        <button
          onClick={() => setLeftMonth(m => shiftMonth(m, 1))}
          style={{
            background:  C.pearl, border: `1px solid ${C.pearlDeep}`,
            borderRadius:'50%', width: 34, height: 34,
            cursor:      'pointer', fontSize: 18, color: C.tuscanDark,
            display:     'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      </div>

      {/* ── Two-month grid ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <MonthGrid
          year={leftMonth.getFullYear()} month={leftMonth.getMonth()}
          checkIn={checkIn} checkOut={checkOut} hovered={hovered}
          blocked={blockedDates}
          onPick={handlePick} onHover={setHovered}
        />
        <MonthGrid
          year={rightMonth.getFullYear()} month={rightMonth.getMonth()}
          checkIn={checkIn} checkOut={checkOut} hovered={hovered}
          blocked={blockedDates}
          onPick={handlePick} onHover={setHovered}
        />
      </div>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        gap:            16,
        marginTop:      16,
        flexWrap:       'wrap',
        justifyContent: 'center',
        paddingTop:     14,
        borderTop:      `1px solid ${C.pearlDeep}`,
      }}>
        {[
          { bg: C.tuscanDark, label: 'Selected date' },
          { bg: C.inRange,    label: 'Your stay'      },
          { bg: C.pearlDark,  label: 'Unavailable / booked', strike: true },
          { outline: C.orange, label: 'Today'          },
        ].map(({ bg, outline, label, strike }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.muted }}>
            <span style={{
              width:  14, height: 14, borderRadius: '50%',
              background:    bg || 'transparent',
              border:        outline ? `2px solid ${outline}` : 'none',
              flexShrink:    0,
              textDecoration: strike ? 'line-through' : 'none',
              opacity:        strike ? 0.4 : 1,
            }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Action buttons ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            onChange({ checkIn: null, checkOut: null });
            setStep('in');
            setHovered(null);
          }}
          style={{
            padding:      '9px 18px', borderRadius: 10,
            border:       `1px solid ${C.pearlDeep}`,
            background:   'none', cursor: 'pointer',
            fontSize:     13, color: C.muted,
          }}
        >
          Clear dates
        </button>
        <button
          onClick={onClose}
          disabled={!checkIn || !checkOut}
          style={{
            padding:      '9px 24px', borderRadius: 10,
            border:       'none', fontWeight: 700, fontSize: 13,
            background:   checkIn && checkOut ? C.tuscanDark : C.pearlDeep,
            color:        checkIn && checkOut ? C.white : C.muted,
            cursor:       checkIn && checkOut ? 'pointer' : 'not-allowed',
          }}
        >
          {checkIn && checkOut
            ? `Confirm — ${nights} night${nights !== 1 ? 's' : ''}`
            : 'Select both dates'}
        </button>
      </div>
    </div>
  );
}
