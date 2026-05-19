// ─── DateRangePicker.jsx ──────────────────────────────────────────────────────
// Renders as a centred modal overlay via React Portal.
// A semi-transparent dark backdrop covers the whole page so the calendar
// floats above everything — no positioning math, no scroll bugs.

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const C = {
  tuscanDark:'#5C4425', tuscan:'#8B6F47', tuscanLight:'#A68B5B',
  pearl:'#F8F6F0', pearlDark:'#EDE9E0', pearlDeep:'#DDD6C8',
  orange:'#FF5E3A', charcoal:'#2C1F0E', muted:'#7A6A56',
  mutedLight:'#C0A882', white:'#FFFFFF', inRange:'#F0E4D4',
};

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const toKey = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sameDay = (a,b) => a && b && toKey(a) === toKey(b);
const between = (date,s,e) => {
  if(!s||!e) return false;
  const t=date.getTime();
  return t>Math.min(s.getTime(),e.getTime()) && t<Math.max(s.getTime(),e.getTime());
};
const rangeHasBlocked = (s,e,blocked) => {
  if(!s||!e) return false;
  const cur=new Date(s); cur.setDate(cur.getDate()+1);
  while(cur<e){if(blocked.includes(toKey(cur)))return true; cur.setDate(cur.getDate()+1);}
  return false;
};
const daysInMonth  = (y,m) => new Date(y,m+1,0).getDate();
const firstWeekday = (y,m) => new Date(y,m,1).getDay();
const shiftMonth   = (d,n) => { const r=new Date(d); r.setDate(1); r.setMonth(r.getMonth()+n); return r; };
const fmtShort     = d => d.toLocaleDateString('en-KE',{day:'numeric',month:'short'});

// ── Single month grid ─────────────────────────────────────────────────────────
function MonthGrid({ year, month, checkIn, checkOut, hovered, blocked, onPick, onHover }) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const total    = daysInMonth(year, month);
  const offset   = firstWeekday(year, month);
  const rangeEnd = checkOut || hovered;
  const cells    = [];
  for(let i=0;i<offset;i++) cells.push(null);
  for(let d=1;d<=total;d++) cells.push(new Date(year,month,d));

  return (
    <div style={{ flex:'1 1 240px', minWidth:220 }}>
      <p style={{ textAlign:'center', margin:'0 0 12px',
        fontFamily:"'Playfair Display',serif", fontSize:14,
        fontWeight:700, color:C.tuscanDark }}>
        {MONTHS[month]} {year}
      </p>

      {/* Day-of-week headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
        {DAYS.map(d=>(
          <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700,
            color:C.muted, textTransform:'uppercase', letterSpacing:0.4, padding:'2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {cells.map((date,idx)=>{
          if(!date) return <div key={`e${idx}`} style={{ height:38 }}/>;

          const key       = toKey(date);
          const isBlocked = blocked.includes(key);
          const isPast    = date < today;
          const disabled  = isBlocked || isPast;
          const isStart   = sameDay(date,checkIn);
          const isEnd     = sameDay(date,checkOut);
          const isHov     = sameDay(date,hovered) && !checkOut && checkIn;
          const inRange   = !disabled && checkIn && between(date,checkIn,rangeEnd);
          const isToday   = sameDay(date,today);

          // Range strip behind the circle
          let stripBg='transparent', stripRadius='0';
          if(inRange){
            stripBg='#F0E4D4';
            if(date.getDay()===0 || sameDay(date,checkIn))       stripRadius='20px 0 0 20px';
            else if(date.getDay()===6 || sameDay(date,rangeEnd)) stripRadius='0 20px 20px 0';
          }

          // Circle styles
          let bg='transparent', fg=disabled?C.mutedLight:C.charcoal, border='none';
          if(isStart||isEnd)        { bg=C.tuscanDark; fg=C.white; }
          else if(isHov)            { bg=C.tuscanLight; fg=C.white; }
          else if(isToday&&!disabled) border=`2px solid ${C.orange}`;

          return (
            <div key={key} style={{ background:stripBg, borderRadius:stripRadius, padding:'1px 0' }}>
              <div
                onClick={()=>!disabled && onPick(date)}
                onMouseEnter={()=>!disabled && checkIn && !checkOut && onHover(date)}
                onMouseLeave={()=>onHover(null)}
                title={isBlocked?'Already booked':isPast?'Past date':undefined}
                style={{
                  height:38, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:disabled?'not-allowed':'pointer',
                  borderRadius:'50%', background:bg, border, color:fg,
                  fontSize:13, fontWeight:isStart||isEnd?700:400,
                  opacity:disabled?0.3:1, position:'relative',
                  userSelect:'none', WebkitUserSelect:'none',
                  textDecoration:isBlocked?'line-through':'none',
                  transition:'background 0.1s',
                }}
              >
                {date.getDate()}
                {isBlocked && (
                  <span style={{ position:'absolute', bottom:2, left:'50%',
                    transform:'translateX(-50%)', width:3, height:3,
                    borderRadius:'50%', background:C.mutedLight }}/>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DateRangePicker({
  checkIn, checkOut, onChange, blockedDates=[], onClose,
}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [leftMonth, setLeftMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [hovered, setHovered] = useState(null);
  const [step,    setStep]    = useState(checkIn ? 'out' : 'in');
  const panelRef = useRef(null);

  const rightMonth = shiftMonth(leftMonth, 1);
  const canBack    = leftMonth > today;

  // Close on Escape key
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePick = date => {
    if(step==='in' || (checkIn && date<=checkIn)){
      onChange({ checkIn:date, checkOut:null });
      setStep('out'); setHovered(null);
    } else {
      if(rangeHasBlocked(checkIn, date, blockedDates)){
        alert('Your range includes unavailable dates. Please choose different dates.');
        onChange({ checkIn:null, checkOut:null }); setStep('in'); return;
      }
      onChange({ checkIn, checkOut:date }); setStep('in'); setHovered(null);
    }
  };

  const nights = checkIn && checkOut
    ? Math.round((checkOut-checkIn)/86400000) : 0;

  const modal = (
    <>
      {/* ── Dark backdrop — clicking it closes the picker ───────────── */}
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

      {/* ── Floating panel — centred in viewport ───────────────────── */}
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
          padding:   '28px 24px 20px',
          width:     'min(680px, 95vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Header row */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17,
              fontWeight:700, color:C.tuscanDark, margin:0 }}>
              {step==='in' ? '📅 Select your check-in date' : '📅 Select your check-out date'}
            </p>
            <p style={{ fontSize:13, color:C.muted, margin:'5px 0 0' }}>
              {checkIn && checkOut
                ? `✓  ${fmtShort(checkIn)} → ${fmtShort(checkOut)}  ·  ${nights} night${nights!==1?'s':''}`
                : checkIn
                ? `Check-in: ${fmtShort(checkIn)}  —  now pick check-out`
                : 'Greyed-out dates are already booked and cannot be selected'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background:C.pearlDark, border:'none', width:34, height:34,
              borderRadius:'50%', cursor:'pointer', fontSize:20, color:C.muted,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, marginLeft:16 }}
          >×</button>
        </div>

        {/* Month navigation */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:16 }}>
          <button
            onClick={()=>canBack && setLeftMonth(m=>shiftMonth(m,-1))}
            style={{ background:canBack?C.pearl:C.pearlDark,
              border:`1px solid ${C.pearlDeep}`, borderRadius:'50%',
              width:36, height:36, cursor:canBack?'pointer':'not-allowed',
              fontSize:18, color:canBack?C.tuscanDark:C.mutedLight,
              display:'flex', alignItems:'center', justifyContent:'center',
              opacity:canBack?1:0.35 }}
          >‹</button>

          <button
            onClick={()=>setLeftMonth(m=>shiftMonth(m,1))}
            style={{ background:C.pearl, border:`1px solid ${C.pearlDeep}`,
              borderRadius:'50%', width:36, height:36, cursor:'pointer',
              fontSize:18, color:C.tuscanDark,
              display:'flex', alignItems:'center', justifyContent:'center' }}
          >›</button>
        </div>

        {/* Two month grids side by side */}
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          <MonthGrid
            year={leftMonth.getFullYear()} month={leftMonth.getMonth()}
            checkIn={checkIn} checkOut={checkOut} hovered={hovered}
            blocked={blockedDates} onPick={handlePick} onHover={setHovered}
          />
          <MonthGrid
            year={rightMonth.getFullYear()} month={rightMonth.getMonth()}
            checkIn={checkIn} checkOut={checkOut} hovered={hovered}
            blocked={blockedDates} onPick={handlePick} onHover={setHovered}
          />
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:18, flexWrap:'wrap',
          justifyContent:'center', borderTop:`1px solid ${C.pearlDeep}`, paddingTop:14 }}>
          {[
            { bg:C.tuscanDark, label:'Selected date' },
            { bg:'#F0E4D4',    label:'Your stay' },
            { bg:C.pearlDark,  label:'Unavailable', fade:true },
            { ring:C.orange,   label:'Today' },
          ].map(({bg,ring,label,fade})=>(
            <span key={label} style={{ display:'flex', alignItems:'center',
              gap:6, fontSize:11, color:C.muted }}>
              <span style={{ width:13, height:13, borderRadius:'50%', flexShrink:0,
                background:bg||'transparent', opacity:fade?0.4:1,
                border:ring?`2px solid ${ring}`:'none' }}/>
              {label}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'flex-end' }}>
          <button
            onClick={()=>{ onChange({checkIn:null,checkOut:null}); setStep('in'); setHovered(null); }}
            style={{ padding:'9px 18px', borderRadius:10,
              border:`1px solid ${C.pearlDeep}`, background:'none',
              cursor:'pointer', fontSize:13, color:C.muted }}
          >
            Clear dates
          </button>
          <button
            onClick={onClose}
            disabled={!checkIn||!checkOut}
            style={{ padding:'9px 26px', borderRadius:10, border:'none',
              fontWeight:700, fontSize:13,
              background:checkIn&&checkOut?C.tuscanDark:C.pearlDeep,
              color:checkIn&&checkOut?C.white:C.muted,
              cursor:checkIn&&checkOut?'pointer':'not-allowed' }}
          >
            {checkIn&&checkOut
              ? `Confirm — ${nights} night${nights!==1?'s':''}`
              : 'Select both dates to confirm'}
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
