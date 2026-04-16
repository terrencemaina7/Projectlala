// ─── HomePage.jsx ─────────────────────────────────────────────────────────────
// Landing page — Tuscan primary, Pearl white surfaces, Sunset Orange CTAs.

import React, { useState } from 'react';
import { COLORS } from '../styles/theme';
import { LISTINGS, COLLECTIONS } from '../data/listings';
import { useApp } from '../context/AppContext';
import ListingCard from '../components/ListingCard';

export default function HomePage() {
  const { setPage, setSearchQuery, setSelectedListing } = useApp();
  const [search, setSearch] = useState({ where: '', dates: '', guests: '' });

  const handleSearch = () => { setSearchQuery(search); setPage('search'); };

  return (
    <div style={{ background: COLORS.pearl }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'min(90vh, 680px)', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1504284966723-0eb8f8cbf9c8?w=1600"
          alt="Diani Beach Kenya sunset"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }}
        />
        {/* Tuscan-toned gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(92,68,37,0.4) 0%, rgba(61,43,16,0.75) 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ color: COLORS.tuscanPale, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>
            Hospitality & Nature's Goodness
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px,7vw,72px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16, textShadow: '0 2px 24px rgba(61,43,16,0.5)', maxWidth: 720 }}>
            Find your perfect getaway
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(15px,2vw,18px)', marginBottom: 40, maxWidth: 480 }}>
            Beach villas, safari tents, mountain escapes — all bookable with M-Pesa or card
          </p>

          {/* Search bar */}
          <div style={{ background: COLORS.white, borderRadius: 20, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', width: '100%', maxWidth: 720, boxShadow: '0 12px 48px rgba(61,43,16,0.3)' }}>
            <SearchField label="Where"  placeholder="Diani, Nairobi, Naivasha..." value={search.where}  onChange={v => setSearch({ ...search, where: v })} />
            <Divider />
            <SearchField label="Dates"  placeholder="Add dates"  value={search.dates}  onChange={v => setSearch({ ...search, dates: v })} />
            <Divider />
            <SearchField label="Guests" placeholder="How many?"  value={search.guests} onChange={v => setSearch({ ...search, guests: v })} />
            <button onClick={handleSearch} style={{ background: COLORS.orange, color: '#fff', border: 'none', borderRadius: 14, padding: '13px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: COLORS.tuscanDark, marginBottom: 8 }}>Explore collections</h2>
        <p style={{ color: COLORS.muted, marginBottom: 32 }}>Handpicked stays for every kind of escape</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {COLLECTIONS.map(c => (
            <CollectionCard key={c.id} collection={c} onClick={() => { setSearchQuery({ category: c.name }); setPage('search'); }} />
          ))}
        </div>
      </section>

      {/* ── Featured listings ────────────────────────────────────────────── */}
      <section style={{ padding: '0 28px 64px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: COLORS.tuscanDark }}>Top-rated stays</h2>
          <button onClick={() => setPage('search')} style={{ background: 'none', border: `1px solid ${COLORS.pearlDeep}`, color: COLORS.tuscan, padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>View all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {LISTINGS.slice(0, 3).map(l => (
            <ListingCard key={l.id} listing={l} onClick={listing => { setSelectedListing(listing); setPage('detail'); }} />
          ))}
        </div>
      </section>

      {/* ── Instagram-style gallery ──────────────────────────────────────── */}
      <section style={{ background: COLORS.pearlDark, padding: '64px 28px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: COLORS.tuscanDark, marginBottom: 8 }}>#LalaKenya moments</h2>
        <p style={{ color: COLORS.muted, marginBottom: 32 }}>Shared by our guests on Instagram</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, maxWidth: 900, margin: '0 auto' }}>
          {GALLERY.map((src, i) => (
            <div key={i} style={{ paddingTop: '100%', position: 'relative', overflow: 'hidden', borderRadius: i===0?'16px 0 0 0':i===2?'0 16px 0 0':i===3?'0 0 0 16px':i===5?'0 0 16px 0':0 }}>
              <img src={src} alt="Guest moment" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Host CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${COLORS.tuscanDeep} 0%, ${COLORS.tuscan} 100%)`, padding: '80px 28px', textAlign: 'center' }}>
        <p style={{ color: COLORS.tuscanPale, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Property owners</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,48px)', color: '#fff', maxWidth: 620, margin: '0 auto 16px' }}>
          Turn your space into income
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Join thousands of Kenyan hosts welcoming guests from around the world. Receive M-Pesa and card payments directly.
        </p>
        <button onClick={() => setPage('list')} style={{ background: COLORS.orange, color: '#fff', border: 'none', borderRadius: 14, padding: '16px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 4px 20px rgba(255,94,58,0.4)' }}>
          List your property →
        </button>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchField({ label, placeholder, value, onChange }) {
  return (
    <div style={{ flex: '1 1 140px', minWidth: 120 }}>
      <p style={{ fontSize: 10, color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px 4px' }}>{label}</p>
      <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ border: 'none', outline: 'none', fontSize: 14, color: COLORS.charcoal, width: '100%', background: 'transparent', padding: '0 4px' }} />
    </div>
  );
}

function Divider() { return <div style={{ width: 1, height: 36, background: COLORS.pearlDeep }} />; }

function CollectionCard({ collection, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 20, overflow: 'hidden', position: 'relative', paddingTop: '60%', textAlign: 'left', display: 'block', width: '100%' }}>
      <img src={collection.image} alt={collection.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(61,43,16,0.85) 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{collection.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '4px 0 0' }}>{collection.desc}</p>
      </div>
    </button>
  );
}

const GALLERY = [
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400',
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400',
  'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=400',
];
