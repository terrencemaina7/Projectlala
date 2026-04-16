// ─── SearchPage ───────────────────────────────────────────────────────────────
// Property search results with sidebar filters, region pills, sort controls,
// map toggle, and a responsive listings grid.

import React, { useState } from 'react';
import { COLORS, formatKES } from '../styles/theme';
import { LISTINGS, ALL_AMENITIES, REGIONS } from '../data/listings';
import { useApp } from '../context/AppContext';
import ListingCard from '../components/ListingCard';
import FilterPanel from '../components/FilterPanel';

export default function SearchPage() {
  const { searchQuery, setSelectedListing, setPage } = useApp();

  const [filters, setFilters] = useState({
    amenities: [],
    minPrice: 0,
    maxPrice: 30000,
    region: 'all',
  });
  const [sort, setSort] = useState('rating');
  const [mapView, setMapView] = useState(false);

  // ── Toggle a single amenity in / out of the filter array ──────────────────
  const toggleAmenity = (a) =>
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

  // ── Filter + sort listings ─────────────────────────────────────────────────
  const filtered = LISTINGS.filter((l) => {
    const q = searchQuery?.where?.trim().toLowerCase() || '';
    if (q && !l.location.toLowerCase().includes(q) && !l.region.toLowerCase().includes(q)) return false;
    if (searchQuery?.category && l.category !== searchQuery.category) return false;
    if (filters.region !== 'all' && l.region !== filters.region) return false;
    if (l.price < filters.minPrice || l.price > filters.maxPrice) return false;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => l.amenities.includes(a))) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return b.id - a.id; // newest
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.white }}>

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        style={{
          width: 280, flexShrink: 0,
          padding: '28px 20px',
          borderRight: `1px solid ${COLORS.border}`,
          background: COLORS.pearl,
          position: 'sticky', top: 64,
          height: 'calc(100vh - 64px)', overflowY: 'auto',
          // Hidden on small screens via media — for simplicity we use inline logic
          display: window.innerWidth < 900 ? 'none' : 'block',
        }}
      >
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          toggleAmenity={toggleAmenity}
          allAmenities={ALL_AMENITIES}
          regions={REGIONS}
        />
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '28px 24px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: COLORS.charcoal, margin: 0 }}>
            {filtered.length} stays in Kenya
            {searchQuery?.where ? ` · "${searchQuery.where}"` : ''}
          </h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13, color: COLORS.charcoal,
                background: COLORS.white, cursor: 'pointer',
              }}
            >
              <option value="rating">Top rated</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
              <option value="newest">Newest</option>
            </select>
            <button
              onClick={() => setMapView(!mapView)}
              style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                background: mapView ? COLORS.orange : COLORS.white,
                color: mapView ? '#fff' : COLORS.charcoal,
                cursor: 'pointer', fontWeight: mapView ? 600 : 400,
              }}
            >
              🗺️ {mapView ? 'Hide map' : 'Show map'}
            </button>
          </div>
        </div>

        {/* ── Region + amenity pills (mobile-friendly quick filters) ─── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 20 }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setFilters((f) => ({ ...f, region: r }))}
              style={{
                padding: '6px 18px', borderRadius: 20,
                border: `1px solid ${filters.region === r ? COLORS.orange : COLORS.border}`,
                background: filters.region === r ? COLORS.orange : COLORS.white,
                color: filters.region === r ? '#fff' : COLORS.charcoal,
                fontSize: 13, fontWeight: filters.region === r ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {r === 'all' ? '🇰🇪 All Kenya' : r}
            </button>
          ))}
          <div style={{ width: 1, height: 32, background: COLORS.border, flexShrink: 0 }} />
          {ALL_AMENITIES.map((a) => (
            <button
              key={a}
              onClick={() => toggleAmenity(a)}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: `1px solid ${filters.amenities.includes(a) ? COLORS.orange : COLORS.border}`,
                background: filters.amenities.includes(a) ? COLORS.orange + '15' : COLORS.white,
                color: filters.amenities.includes(a) ? COLORS.orange : COLORS.charcoal,
                fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {/* ── Map view placeholder ──────────────────────────────────── */}
        {mapView && (
          <div
            style={{
              background: COLORS.pearlDark, borderRadius: 16,
              height: 320, marginBottom: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${COLORS.border}`, position: 'relative',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🗺️</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.charcoal }}>
                Interactive Map View
              </p>
              <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 12 }}>
                Connect your Google Maps API key to enable the live map
              </p>
              {/* Price pill markers */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {filtered.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedListing(l); setPage('detail'); }}
                    style={{
                      background: COLORS.charcoal, color: '#fff',
                      border: 'none', borderRadius: 20,
                      padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {formatKES(l.price)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Listings grid ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filtered.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onClick={(listing) => { setSelectedListing(listing); setPage('detail'); }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🏖️</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: COLORS.charcoal }}>
        No listings match your filters
      </p>
      <p style={{ color: COLORS.muted, fontSize: 14 }}>Try adjusting your search criteria</p>
    </div>
  );
}
