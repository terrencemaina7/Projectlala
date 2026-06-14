// ─── HomePage.jsx ─────────────────────────────────────────────────────────────
// Landing page.  When the user presses Search, dates + guests are written to
// AppContext so SearchPage and DetailPage can read them without re-entry.

import React, { useState } from 'react';
import { useApp }           from '../context/AppContext';
import { LISTINGS, COLLECTIONS } from '../data/listings';
import ListingCard          from '../components/ListingCard';
import DateRangePicker      from '../components/DateRangePicker';
import GuestPicker          from '../components/GuestPicker';

const C = {
  tuscanDark:  '#5C4425',
  tuscan:      '#8B6F47',
  tuscanLight: '#A68B5B',
  tuscanDeep:  '#3D2B10',
  pearl:       '#F8F6F0',
  pearlDark:   '#EDE9E0',
  pearlDeep:   '#DDD6C8',
  orange:      '#FF5E3A',
  charcoal:    '#2C1F0E',
  muted:       '#7A6A56',
  mutedLight:  '#C0A882',
  white:       '#FFFFFF',
};

const fmtShort = (d) =>
  d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

const guestSummary = ({ adults, children, infants }) => {
  const total = (adults || 1) + (children || 0);
  let s = `${total} guest${total !== 1 ? 's' : ''}`;
  if (infants > 0) s += `, ${infants} infant${infants !== 1 ? 's' : ''}`;
  return s;
};

export default function HomePage() {
  const appCtx = useApp();
  const { searchDates, searchGuests } = appCtx;

  // Local state — mirrors context so user can edit before pressing Search
  const [where,    setWhere]    = useState('');
  const [checkIn,  setCheckIn]  = useState(searchDates?.checkIn  ?? null);
  const [checkOut, setCheckOut] = useState(searchDates?.checkOut ?? null);
  const [guests,   setGuests]   = useState(searchGuests ?? { adults: 1, children: 0, infants: 0 });

  const [calOpen,   setCalOpen]   = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((checkOut - checkIn) / 86_400_000))
    : 0;

  const handleSearch = () => {
    appCtx.setSearchDates({ checkIn, checkOut });
    appCtx.setSearchGuests(guests);
    appCtx.setSearchQuery({
      where,
      checkIn,
      checkOut,
      guests,
      dates: checkIn && checkOut
        ? `${fmtShort(checkIn)} – ${fmtShort(checkOut)}`
        : '',
    });
    appCtx.setPage('search');
    setCalOpen(false);
    setGuestOpen(false);
  };

  return (
    <div style={{ background: C.pearl }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'min(90vh, 680px)', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1504284966723-0eb8f8cbf9c8?w=1600"
          alt="Diani Beach Kenya sunset"
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: 'center 60%' }}
        />
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(92,68,37,0.4) 0%, rgba(61,43,16,0.78) 100%)' }}
        />

        <div style={{ position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>

          <p style={{ color: '#C9A97A', fontSize: 13, letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 12,
            fontFamily: "'Playfair Display', serif" }}>
            Hospitality & Nature's Goodness
          </p>

          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(36px,7vw,72px)', fontWeight: 700, color: '#fff',
            lineHeight: 1.1, marginBottom: 16,
            textShadow: '0 2px 24px rgba(61,43,16,0.5)', maxWidth: 720 }}>
            Find your perfect getaway
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.82)',
            fontSize: 'clamp(15px,2vw,18px)', marginBottom: 40, maxWidth: 480 }}>
            Beach villas, safari tents, mountain escapes — book with M-Pesa or card
          </p>

          {/* ── Search bar ─────────────────────────────────────────────── */}
          <div style={{
            background:   C.white,
            borderRadius: 20,
            padding:      '14px 16px',
            display:      'flex',
            flexWrap:     'wrap',
            gap:          10,
            alignItems:   'center',
            width:        '100%',
            maxWidth:     800,
            boxShadow:    '0 16px 56px rgba(61,43,16,0.35)',
          }}>

            {/* Where */}
            <div style={{ flex: '1 1 160px', minWidth: 130 }}>
              <p style={fieldLabel}>Where</p>
              <input
                placeholder="Diani, Nairobi, Naivasha..."
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ border: 'none', outline: 'none', fontSize: 14,
                  color: C.charcoal, width: '100%', background: 'transparent',
                  padding: '0 4px' }}
              />
            </div>

            <SearchDivider />

            {/* Dates */}
            <div style={{ flex: '1 1 170px', minWidth: 150, position: 'relative' }}>
              <p style={fieldLabel}>Dates</p>
              <button
                onClick={() => { setCalOpen((o) => !o); setGuestOpen(false); }}
                style={searchFieldBtn(!!checkIn)}
              >
                <span style={{ fontSize: 14 }}>📅</span>
                {checkIn && checkOut
                  ? `${fmtShort(checkIn)} – ${fmtShort(checkOut)}`
                  : checkIn
                  ? `${fmtShort(checkIn)} – end date`
                  : 'Add dates'}
              </button>

              {calOpen && (
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  blockedDates={[]}
                  onChange={({ checkIn: ci, checkOut: co }) => {
                    setCheckIn(ci);
                    setCheckOut(co);
                  }}
                  onClose={() => setCalOpen(false)}
                />
              )}
            </div>

            <SearchDivider />

            {/* Guests */}
            <div style={{ flex: '1 1 150px', minWidth: 130, position: 'relative' }}>
              <p style={fieldLabel}>Guests</p>
              <button
                onClick={() => { setGuestOpen((o) => !o); setCalOpen(false); }}
                style={searchFieldBtn(guests.adults > 1 || guests.children > 0)}
              >
                <span style={{ fontSize: 14 }}>👥</span>
                {guestSummary(guests)}
              </button>

              {guestOpen && (
                <GuestPicker
                  value={guests}
                  onChange={setGuests}
                  onClose={() => setGuestOpen(false)}
                />
              )}
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              style={{
                background:   C.orange,
                color:        '#fff',
                border:       'none',
                borderRadius: 14,
                padding:      '13px 26px',
                fontWeight:   700,
                fontSize:     15,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                whiteSpace:   'nowrap',
                flexShrink:   0,
                boxShadow:    '0 4px 16px rgba(255,94,58,0.35)',
              }}
            >
              🔍 Search
            </button>
          </div>

          {/* Active filter pills */}
          {(checkIn || guests.adults > 1 || guests.children > 0) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12,
              flexWrap: 'wrap', justifyContent: 'center' }}>
              {checkIn && checkOut && (
                <ActivePill
                  label={`${fmtShort(checkIn)} – ${fmtShort(checkOut)} · ${nights} night${nights !== 1 ? 's' : ''}`}
                  onClear={() => { setCheckIn(null); setCheckOut(null); }}
                />
              )}
              {(guests.adults > 1 || guests.children > 0) && (
                <ActivePill
                  label={guestSummary(guests)}
                  onClear={() => setGuests({ adults: 1, children: 0, infants: 0 })}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32,
          color: C.tuscanDark, marginBottom: 8 }}>
          Explore collections
        </h2>
        <p style={{ color: C.muted, marginBottom: 32 }}>
          Handpicked stays for every kind of escape
        </p>
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {COLLECTIONS.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              onClick={() => {
                appCtx.setSearchDates({ checkIn, checkOut });
                appCtx.setSearchGuests(guests);
                appCtx.setSearchQuery({ category: c.name });
                appCtx.setPage('search');
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Featured listings ────────────────────────────────────────────── */}
      <section style={{ padding: '0 28px 64px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif",
            fontSize: 28, color: C.tuscanDark }}>
            Top-rated stays
          </h2>
          <button
            onClick={() => {
              appCtx.setSearchDates({ checkIn, checkOut });
              appCtx.setSearchGuests(guests);
              appCtx.setPage('search');
            }}
            style={{ background: 'none', border: `1px solid ${C.pearlDeep}`,
              color: C.tuscan, padding: '8px 18px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13 }}
          >
            View all →
          </button>
        </div>
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {LISTINGS.slice(0, 3).map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={(guests.adults || 1) + (guests.children || 0)}
              onClick={(listing) => {
                appCtx.setSearchDates({ checkIn, checkOut });
                appCtx.setSearchGuests(guests);
                appCtx.setSelectedListing(listing);
                appCtx.setPage('detail');
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Instagram gallery ────────────────────────────────────────────── */}
      <section style={{ background: C.pearlDark, padding: '64px 28px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28,
          color: C.tuscanDark, marginBottom: 8 }}>
          #LalaKenya moments
        </h2>
        <p style={{ color: C.muted, marginBottom: 32 }}>
          Shared by our guests on Instagram
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 4, maxWidth: 900, margin: '0 auto' }}>
          {GALLERY.map((src, i) => (
            <div key={i} style={{
              paddingTop:   '100%',
              position:     'relative',
              overflow:     'hidden',
              borderRadius: i===0?'16px 0 0 0':i===2?'0 16px 0 0':
                            i===3?'0 0 0 16px':i===5?'0 0 16px 0':0,
            }}>
              <img src={src} alt="" style={{ position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Host CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.tuscanDeep} 0%, ${C.tuscan} 100%)`,
        padding: '80px 28px', textAlign: 'center',
      }}>
        <p style={{ color: '#C9A97A', fontSize: 13, letterSpacing: 2,
          textTransform: 'uppercase', marginBottom: 12 }}>
          Property owners
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px,5vw,48px)', color: '#fff',
          maxWidth: 620, margin: '0 auto 16px' }}>
          Turn your space into income
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16,
          maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Join thousands of Kenyan hosts welcoming guests from around the world.
        </p>
        <button
          onClick={() => appCtx.setPage('list')}
          style={{ background: C.orange, color: '#fff', border: 'none',
            borderRadius: 14, padding: '16px 40px', fontSize: 16,
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255,94,58,0.4)' }}
        >
          List your property →
        </button>
      </section>
    </div>
  );
}

// ── Local sub-components ──────────────────────────────────────────────────────

function SearchDivider() {
  return <div style={{ width: 1, height: 36, background: '#DDD6C8', flexShrink: 0 }} />;
}

function ActivePill({ label, onClear }) {
  return (
    <span style={{
      display:        'flex',
      alignItems:     'center',
      gap:            6,
      background:     'rgba(255,255,255,0.15)',
      border:         '1px solid rgba(255,255,255,0.3)',
      borderRadius:   20,
      padding:        '4px 12px',
      fontSize:       12,
      color:          '#fff',
      backdropFilter: 'blur(4px)',
    }}>
      {label}
      <button
        onClick={onClear}
        style={{ background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          fontSize: 14, lineHeight: 1, padding: 0 }}
      >
        ×
      </button>
    </span>
  );
}

function CollectionCard({ collection, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer',
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        paddingTop: '60%', textAlign: 'left', display: 'block', width: '100%' }}
    >
      <img src={collection.image} alt={collection.name}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(61,43,16,0.85) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, color: '#fff', margin: 0 }}>
          {collection.name}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>
          {collection.desc}
        </p>
      </div>
    </button>
  );
}

const fieldLabel = {
  fontSize:      10,
  color:         '#7A6A56',
  fontWeight:    700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  margin:        '0 0 4px 4px',
};

const searchFieldBtn = (active) => ({
  border:     'none',
  background: 'none',
  cursor:     'pointer',
  fontSize:   14,
  color:      active ? '#2C1F0E' : '#C0A882',
  fontWeight: active ? 600 : 400,
  padding:    '0 4px',
  textAlign:  'left',
  width:      '100%',
  display:    'flex',
  alignItems: 'center',
  gap:        6,
});

const GALLERY = [
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400',
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
  'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=400',
];
