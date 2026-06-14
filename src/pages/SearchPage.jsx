// ─── SearchPage.jsx ───────────────────────────────────────────────────────────
// Search results page.
//
// On load it reads searchDates + searchGuests from AppContext (set by HomePage).
// The user can change dates/guests inline via the top filter bar without going
// back to the homepage.
//
// Pricing model:  total = pricePerNight × guests × nights
// Each ListingCard receives checkIn, checkOut, and guestCount so it can
// display the correct total price prominently.

import React, { useState, useMemo, useEffect } from 'react';
import { useApp }                      from '../context/AppContext';
import { LISTINGS, ALL_AMENITIES, REGIONS } from '../data/listings';
import ListingCard                     from '../components/ListingCard';
import DateRangePicker                 from '../components/DateRangePicker';
import GuestPicker                     from '../components/GuestPicker';
import FilterPanel                     from '../components/FilterPanel';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  tuscanDark:  '#5C4425',
  tuscan:      '#8B6F47',
  pearl:       '#F8F6F0',
  pearlDark:   '#EDE9E0',
  pearlDeep:   '#DDD6C8',
  orange:      '#FF5E3A',
  charcoal:    '#2C1F0E',
  muted:       '#7A6A56',
  white:       '#FFFFFF',
};

const fmt      = (n) => `KES ${Number(n).toLocaleString()}`;
const fmtShort = (d) => d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });

// ── Night calculator ──────────────────────────────────────────────────────────
const calcNights = (ci, co) =>
  ci && co ? Math.max(1, Math.round((co - ci) / 86_400_000)) : 0;

export default function SearchPage() {
  // Read full context object once so portal callbacks never get stale references
  const appCtx = useApp();
  const searchQuery        = appCtx.searchQuery        || {};
  const setSearchQuery     = appCtx.setSearchQuery     || (() => {});
  const setSelectedListing = appCtx.setSelectedListing || (() => {});
  const setPage            = appCtx.setPage            || (() => {});

  // ── Local state for dates + guests ────────────────────────────────────────
  // Initialised from context (pre-fills from homepage search).
  // Local state owns the UI — context is synced via useEffect below.
  // This pattern is required because DateRangePicker and GuestPicker render
  // via React portals, and portal callbacks lose context references.
  const [checkIn,  setCheckIn]  = useState(() => appCtx.searchDates?.checkIn  ?? null);
  const [checkOut, setCheckOut] = useState(() => appCtx.searchDates?.checkOut ?? null);
  const [guests,   setGuests]   = useState(
    () => appCtx.searchGuests ?? { adults: 1, children: 0, infants: 0 }
  );

  // Sync local → context so DetailPage and other pages stay up to date
  useEffect(() => {
    appCtx.setSearchDates?.({ checkIn, checkOut });
  }, [checkIn, checkOut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    appCtx.setSearchGuests?.(guests);
  }, [guests]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Other UI state ────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    amenities: [],
    minPrice:  0,
    maxPrice:  30000,
    region:    'all',
  });
  const [sort,      setSort]      = useState('rating');
  const [mapView,   setMapView]   = useState(false);
  const [calOpen,   setCalOpen]   = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const nights     = calcNights(checkIn, checkOut);
  const guestCount = (guests.adults || 1) + (guests.children || 0);

  const toggleAmenity = (a) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  // ── Filter + sort listings ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery?.where?.trim().toLowerCase() || '';
    return LISTINGS
      .filter((l) => {
        if (q && !l.location.toLowerCase().includes(q) &&
                 !l.region.toLowerCase().includes(q) &&
                 !l.title.toLowerCase().includes(q)) return false;
        if (searchQuery?.category && l.category !== searchQuery.category) return false;
        if (filters.region !== 'all' && l.region !== filters.region) return false;
        if (l.price < filters.minPrice || l.price > filters.maxPrice) return false;
        if (filters.amenities.length > 0 &&
            !filters.amenities.every((a) => l.amenities.includes(a))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'price_asc')  return a.price - b.price;
        if (sort === 'price_desc') return b.price - a.price;
        if (sort === 'rating')     return b.rating - a.rating;
        return b.id - a.id;
      });
  }, [searchQuery, filters, sort]);

  // ── Guest label ───────────────────────────────────────────────────────────
  const guestLabel = () => {
    const total = guestCount;
    let label = `${total} guest${total !== 1 ? 's' : ''}`;
    if ((guests.infants || 0) > 0) {
      label += `, ${guests.infants} infant${guests.infants !== 1 ? 's' : ''}`;
    }
    return label;
  };

  return (
    <div style={{ background: C.pearl, minHeight: '100vh' }}>

      {/* ── Top filter bar ───────────────────────────────────────────────── */}
      <div style={{
        background:   C.white,
        borderBottom: `1px solid ${C.pearlDeep}`,
        padding:      '14px 24px',
        display:      'flex',
        gap:          12,
        alignItems:   'center',
        flexWrap:     'wrap',
        position:     'sticky',
        top:          68,    // below navbar
        zIndex:       200,
        boxShadow:    '0 2px 8px rgba(61,43,16,0.06)',
      }}>

        {/* Where */}
        <div style={{ flex: '1 1 180px', minWidth: 140 }}>
          <p style={microLabel}>Where</p>
          <input
            placeholder="Diani, Nairobi…"
            value={searchQuery?.where || ''}
            onChange={(e) => setSearchQuery({ ...searchQuery, where: e.target.value })}
            style={{
              border:     'none',
              outline:    'none',
              fontSize:   14,
              color:      C.charcoal,
              width:      '100%',
              background: 'transparent',
              fontWeight: searchQuery?.where ? 600 : 400,
            }}
          />
        </div>

        <Divider />

        {/* Dates — pre-filled from homepage, editable */}
        <div style={{ flex: '1 1 160px', minWidth: 140, position: 'relative' }}>
          <p style={microLabel}>Dates</p>
          <button
            onClick={() => { setCalOpen((o) => !o); setGuestOpen(false); }}
            style={pillBtn(!!checkIn)}
          >
            {checkIn && checkOut
              ? `${fmtShort(checkIn)} – ${fmtShort(checkOut)}`
              : checkIn
              ? `${fmtShort(checkIn)} – end date`
              : '📅 Add dates'}
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

        <Divider />

        {/* Guests — pre-filled from homepage, editable */}
        <div style={{ flex: '1 1 140px', minWidth: 120, position: 'relative' }}>
          <p style={microLabel}>Guests</p>
          <button
            onClick={() => { setGuestOpen((o) => !o); setCalOpen(false); }}
            style={pillBtn(guestCount > 1)}
          >
            👥 {guestLabel()}
          </button>
          {guestOpen && (
            <GuestPicker
              value={guests}
              onChange={(g) => setGuests(g)}
              onClose={() => setGuestOpen(false)}
            />
          )}
        </div>

        <Divider />

        {/* Sort */}
        <div style={{ flex: '0 0 auto' }}>
          <p style={microLabel}>Sort</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              border:     'none',
              outline:    'none',
              fontSize:   14,
              color:      C.charcoal,
              background: 'transparent',
              cursor:     'pointer',
              fontWeight: 500,
            }}
          >
            <option value="rating">Top rated</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Map toggle */}
        <button
          onClick={() => setMapView(!mapView)}
          style={{
            padding:      '8px 16px',
            borderRadius: 20,
            border:       `1px solid ${C.pearlDeep}`,
            fontSize:     13,
            background:   mapView ? C.tuscanDark : C.white,
            color:        mapView ? '#fff' : C.charcoal,
            cursor:       'pointer',
            fontWeight:   mapView ? 600 : 400,
            whiteSpace:   'nowrap',
          }}
        >
          🗺️ {mapView ? 'Hide map' : 'Map'}
        </button>
      </div>

      {/* ── Context banner: showing prices for selected dates ─────────────── */}
        {checkIn && checkOut && (
          <div style={{
            background:   C.tuscanDark,
            padding:      '10px 24px',
            display:      'flex',
            alignItems:   'center',
            gap:          8,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
          💡 Showing total prices for{' '}
          <strong>{fmtShort(checkIn)} – {fmtShort(checkOut)}</strong>
          {' '}({nights} night{nights !== 1 ? 's' : ''}){' · '}
          <strong>{guestLabel()}</strong>
          </span>
          <button
            onClick={() => { setCheckIn(null); setCheckOut(null); }}
            style={{
              marginLeft:   'auto',
              background:   'rgba(255,255,255,0.15)',
              border:       '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20,
              padding:      '3px 12px',
              fontSize:     12,
              color:        '#fff',
              cursor:       'pointer',
            }}
          >
      Clear dates
    </button>
  </div>
)}  

      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Desktop sidebar filters ───────────────────────────────────── */}
        <aside style={{
          width:      280,
          flexShrink: 0,
          padding:    '24px 20px',
          borderRight:`1px solid ${C.pearlDeep}`,
          background: C.white,
          height:     'calc(100vh - 130px)',
          position:   'sticky',
          top:        130,
          overflowY:  'auto',
          display:    window.innerWidth < 900 ? 'none' : 'block',
        }}>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            toggleAmenity={toggleAmenity}
            allAmenities={ALL_AMENITIES}
            regions={REGIONS}
          />
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '24px' }}>

          {/* Region pill filters */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 16, marginBottom: 16 }}>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setFilters((f) => ({ ...f, region: r }))}
                style={{
                  padding:      '6px 18px',
                  borderRadius: 20,
                  border:       `1px solid ${filters.region === r ? C.orange : C.pearlDeep}`,
                  background:   filters.region === r ? C.orange : C.white,
                  color:        filters.region === r ? '#fff' : C.charcoal,
                  fontSize:     13,
                  fontWeight:   filters.region === r ? 600 : 400,
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                }}
              >
                {r === 'all' ? '🇰🇪 All Kenya' : r}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   22,
              color:      C.charcoal,
              margin:     0,
            }}>
              {filtered.length} stay{filtered.length !== 1 ? 's' : ''} in Kenya
              {searchQuery?.where ? ` · "${searchQuery.where}"` : ''}
            </h1>
          </div>

          {/* Map placeholder */}
          {mapView && (
            <div style={{
              background:   C.pearlDark,
              borderRadius: 16,
              height:       280,
              marginBottom: 24,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              border:       `1px solid ${C.pearlDeep}`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🗺️</p>
                <p style={{ fontFamily: "'Playfair Display', serif",
                  fontSize: 16, color: C.charcoal }}>
                  Map view
                </p>
                <p style={{ color: C.muted, fontSize: 13 }}>
                  Connect Google Maps API key to enable
                </p>
              </div>
            </div>
          )}

          {/* Listings grid */}
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap:                 24,
            }}>
              {filtered.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guestCount}
                  onClick={(listing) => {
                    setSelectedListing(listing);
                    setPage('detail');
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{ width: 1, height: 36, background: '#DDD6C8', flexShrink: 0 }} />
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🏖️</p>
      <p style={{ fontFamily: "'Playfair Display', serif",
        fontSize: 20, color: '#2C1F0E' }}>
        No listings match your filters
      </p>
      <p style={{ color: '#7A6A56', fontSize: 14 }}>
        Try adjusting your search criteria
      </p>
    </div>
  );
}

const microLabel = {
  fontSize:      10,
  fontWeight:    700,
  color:         '#7A6A56',
  textTransform: 'uppercase',
  letterSpacing: 1,
  margin:        '0 0 4px',
};

const pillBtn = (active) => ({
  border:     'none',
  background: 'none',
  cursor:     'pointer',
  fontSize:   14,
  color:      active ? '#2C1F0E' : '#C0A882',
  fontWeight: active ? 600 : 400,
  padding:    0,
  textAlign:  'left',
  display:    'block',
  width:      '100%',
});
