// ─── FilterPanel ─────────────────────────────────────────────────────────────
// Sidebar filter widget used inside the Search Results page.
// Includes region radio buttons, price range inputs, and amenity checkboxes.

import React from 'react';
import { COLORS, inputStyle } from '../styles/theme';

/**
 * @param {object}   filters        - current filter state from SearchPage
 * @param {function} setFilters     - setter from SearchPage
 * @param {function} toggleAmenity  - toggles a single amenity in/out of the array
 * @param {string[]} allAmenities   - full list of available amenity options
 * @param {string[]} regions        - full list of region options (incl. "all")
 */
export default function FilterPanel({ filters, setFilters, toggleAmenity, allAmenities, regions }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, marginBottom: 20, color: COLORS.charcoal,
        }}
      >
        Filters
      </h3>

      {/* ── Region ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <p style={sectionLabel}>Region</p>
        {regions.map((r) => (
          <label
            key={r}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}
          >
            <input
              type="radio"
              name="region"
              checked={filters.region === r}
              onChange={() => setFilters((f) => ({ ...f, region: r }))}
            />
            <span style={{ fontSize: 14, color: COLORS.charcoal }}>
              {r === 'all' ? 'All Kenya' : r}
            </span>
          </label>
        ))}
      </section>

      {/* ── Price range ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <p style={sectionLabel}>Price Range (KES / night)</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: Number(e.target.value) || 0 }))}
            style={{ ...inputStyle, marginBottom: 0, flex: 1, padding: '8px 10px' }}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice === 30000 ? '' : filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) || 30000 }))}
            style={{ ...inputStyle, marginBottom: 0, flex: 1, padding: '8px 10px' }}
          />
        </div>
      </section>

      {/* ── Amenities ──────────────────────────────────────────────────── */}
      <section>
        <p style={sectionLabel}>Amenities</p>
        {allAmenities.map((a) => (
          <label
            key={a}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={filters.amenities.includes(a)}
              onChange={() => toggleAmenity(a)}
            />
            <span style={{ fontSize: 14, color: COLORS.charcoal }}>{a}</span>
          </label>
        ))}
      </section>
    </div>
  );
}

const sectionLabel = {
  fontSize: 12, fontWeight: 700, color: COLORS.muted,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
};
