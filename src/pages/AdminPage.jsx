// ─── AdminPage.jsx ────────────────────────────────────────────────────────────
// Professional admin dashboard for LalaBnB.
// Sections: sidebar nav, overview stats, listings management table,
// user management, slide-over modal for creating/editing listings.
//
// Firestore hooks are clearly marked — swap the mock data calls with
// the real Firestore calls shown in the comments when ready.

import React, { useState, useEffect } from 'react';
import { COLORS } from '../styles/theme';
import { useApp } from '../context/AppContext';
import { LISTINGS } from '../data/listings';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Firestore imports ────────────────────────────────────────────────────────
// Uncomment these once your firebase.js config values are filled in:
// import { db } from '../firebase';
// import {
//   collection, getDocs, addDoc, updateDoc,
//   deleteDoc, doc, onSnapshot, getDoc,
// } from 'firebase/firestore';

// ─── Design tokens specific to the admin shell ────────────────────────────────
const A = {
  bg:         '#f4f5f7',   // page background
  card:       '#ffffff',   // card / panel background
  sidebar:    '#3d2b1a',   // deep navy sidebar
  sidebarHov: '#4d3522',
  accent:     COLORS.tuscanDark || '#6B5235',
  text:       '#1a1a2e',
  muted:      '#6b7280',
  border:     '#e5e7eb',
  green:      '#10b981',
  amber:      '#f59e0b',
  red:        '#ef4444',
  blue:       '#3b82f6',
};

// ─── Seed mock data (replace with Firestore calls) ────────────────────────────
const MOCK_USERS = [
  { id: 'u1', name: 'Wanjiku Kamau',  email: 'wanjiku@gmail.com',    joined: '12 Jan 2025', bookings: 3 },
  { id: 'u2', name: 'Brian Otieno',   email: 'brian.o@gmail.com',    joined: '3 Feb 2025',  bookings: 1 },
  { id: 'u3', name: 'Fatuma Ahmed',   email: 'fatuma@yahoo.com',     joined: '19 Feb 2025', bookings: 5 },
  { id: 'u4', name: 'James Mwangi',   email: 'jmwangi@outlook.com',  joined: '2 Mar 2025',  bookings: 2 },
  { id: 'u5', name: 'Amina Waweru',   email: 'amina.w@gmail.com',    joined: '14 Mar 2025', bookings: 0 },
];

const MOCK_BOOKINGS_PENDING = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `KES ${Number(n).toLocaleString()}`;

const StatusDot = ({ color, label }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.muted }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
    {label}
  </span>
);

const Pill = ({ children, color }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: color + '18', color,
    border: `1px solid ${color}30`,
  }}>
    {children}
  </span>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: A.card, borderRadius: 16,
      padding: '22px 24px',
      border: `1px solid ${A.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: (accent || A.accent) + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: A.muted, margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: A.text, margin: '0 0 4px', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 12, color: A.muted, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Slide-over modal for Add / Edit listing ──────────────────────────────────
const EMPTY_FORM = { title: '', location: '', region: 'Nairobi', price: '', imageUrl: '', amenities: '', description: '' };

function SlideOver({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial]);

  const valid = form.title.trim() && form.location.trim() && form.price && form.imageUrl.trim();

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 1100, transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 100vw)',
        background: A.card, zIndex: 1200,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: `1px solid ${A.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: A.card,
        }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: A.text, margin: 0 }}>
              {initial ? 'Edit listing' : 'Add new listing'}
            </h2>
            <p style={{ fontSize: 13, color: A.muted, margin: '2px 0 0' }}>
              {initial ? 'Update property details' : 'Fill all required fields to publish'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: A.bg, border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, color: A.muted }}>
            ×
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {[
            { key: 'title',       label: 'Property title *',     placeholder: 'Oceanfront Villa, Diani' },
            { key: 'location',    label: 'Location / Address *',  placeholder: 'Diani Beach Road, Kwale' },
            { key: 'imageUrl',    label: 'Image URL *',           placeholder: 'https://images.unsplash.com/...' },
            { key: 'description', label: 'Description',           placeholder: 'Describe the property...', textarea: true },
            { key: 'amenities',   label: 'Amenities (comma-separated)', placeholder: 'Wi-Fi, Pool, Kitchen' },
          ].map(({ key, label, placeholder, textarea }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={formLabel}>{label}</label>
              {textarea ? (
                <textarea
                  rows={3}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => f(key, e.target.value)}
                  style={{ ...formInput, resize: 'vertical' }}
                />
              ) : (
                <input
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => f(key, e.target.value)}
                  style={formInput}
                />
              )}
            </div>
          ))}

          {/* Region + Price row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={formLabel}>Region *</label>
              <select value={form.region} onChange={e => f('region', e.target.value)} style={formInput}>
                {['Nairobi', 'Coast', 'Rift Valley', 'Western', 'Nyanza', 'Central'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={formLabel}>Price / night (KES) *</label>
              <input
                type="number"
                placeholder="7500"
                value={form.price}
                onChange={e => f('price', e.target.value)}
                style={formInput}
              />
            </div>
          </div>

          {/* Image preview */}
          {form.imageUrl && (
            <div style={{ marginBottom: 16 }}>
              <label style={formLabel}>Image preview</label>
              <div style={{ borderRadius: 10, overflow: 'hidden', height: 140, background: A.bg, border: `1px solid ${A.border}` }}>
                <img
                  src={form.imageUrl}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: `1px solid ${A.border}`,
          display: 'flex', gap: 10,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: `1px solid ${A.border}`, background: A.card,
            cursor: 'pointer', fontSize: 14, color: A.muted, fontWeight: 500,
          }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            style={{
              flex: 2, padding: '11px', borderRadius: 10,
              border: 'none', cursor: valid && !saving ? 'pointer' : 'not-allowed',
              background: valid ? A.accent : A.border,
              color: valid ? '#fff' : A.muted,
              fontWeight: 700, fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : initial ? '✓ Update listing' : '+ Add listing'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, setPage } = useApp();

  // ── State ────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('overview');
  const [listings, setListings]           = useState(
    LISTINGS.map(l => ({ ...l, status: 'active', hidden: false }))
  );
  const [pendingListings, setPendingListings] = useState([]);
  const [users]                           = useState(MOCK_USERS);
  const [analytics, setAnalytics]         = useState({ totalVisits: 0, uniqueUsers: 0, pageviews: {} });
  const [slideOpen, setSlideOpen]         = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [listingSearch, setListingSearch] = useState('');
  const [userSearch, setUserSearch]       = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Firestore: replace useState above with live listeners ────────────────
  // useEffect(() => {
  //   const q = collection(db, 'listings');
  //   const unsub = onSnapshot(q, snap => {
  //     setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  //   });
  //   return () => unsub();
  // }, []);

  
// ── Load pending listings submitted by hosts ─────────────────────────────
useEffect(() => {
  const q = collection(db, 'pendingListings');

  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPendingListings(data);
  });

  return () => unsub();
}, []);

  const handleApproveListing = async (listing) => {
  try {
    // move to approvedListings
    await addDoc(collection(db, 'listings'), {
      ...listing,
      approvedAt: new Date()
    });

    // delete from pending
    await deleteDoc(doc(db, 'pendingListings', listing.id));

  } catch (err) {
    console.error('Approve error:', err);
  }
};

const handleRejectListing = async (id) => {
  try {
    await deleteDoc(doc(db, 'pendingListings', id));
  } catch (err) {
    console.error('Reject error:', err);
  }
};

// ── Load analytics from Firestore ────────────────────────────────────────
useEffect(() => {
  const loadAnalytics = async () => {
    try {
      // demo / firebase logic
      setAnalytics({
        totalVisits: 248,
        uniqueUsers: 61,
        pageviews: { home: 124, search: 78, detail: 46 }
      });
    } catch {}
  };

  loadAnalytics();
}, []);

// 1. Loading state FIRST
if (!user) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      fontSize: 14,
      color: A.muted
    }}>
      Loading admin dashboard...
    </div>
  );
}

// 2. Admin guard SECOND
if (!user.isAdmin) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 12
    }}>
      <span style={{ fontSize: 48 }}>🔒</span>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: A.text }}>
        Admin access only
      </h2>
      <p style={{ color: A.muted, fontSize: 14 }}>
        You don't have permission to view this page.
      </p>
      <button
        onClick={() => setPage('home')}
        style={{
          marginTop: 8,
          padding: '10px 24px',
          background: A.accent,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        ← Back to site
      </button>
    </div>
  );
}

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalListings   = listings.length;
  const activeListings  = listings.filter(l => !l.hidden).length;
  const hiddenListings  = listings.filter(l => l.hidden).length;
  const totalUsers      = users.length;
  const platformOnline  = true; // TODO: ping /api/health

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleToggleHide = (id) => {
    setListings(ls => ls.map(l => l.id === id ? { ...l, hidden: !l.hidden } : l));
    // Firestore: await updateDoc(doc(db, 'listings', id), { hidden: !current });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setListings(ls => ls.filter(l => l.id !== id));
    // Firestore: await deleteDoc(doc(db, 'listings', id));
  };

  const handleSaveListing = async (form) => {
    if (editTarget) {
      // Edit
      setListings(ls => ls.map(l =>
        l.id === editTarget.id
          ? { ...l, ...form, price: Number(form.price), images: [form.imageUrl], amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean) }
          : l
      ));
      // Firestore: await updateDoc(doc(db, 'listings', editTarget.id), { ...form });
    } else {
      // Add
      const newListing = {
        id: Date.now(),
        ...form,
        price: Number(form.price),
        images: [form.imageUrl],
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
        rating: 0, reviews: 0, verified: false, hidden: false, status: 'active',
        host: user.name, hostPhone: '',
        beds: 1, baths: 1, guests: 2, lat: 0, lng: 0,
      };
      setListings(ls => [newListing, ...ls]);
      // Firestore: await addDoc(collection(db, 'listings'), { ...form });
    }
    setEditTarget(null);
  };

  const openEdit = (listing) => {
    setEditTarget(listing);
    setSlideOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setSlideOpen(true);
  };

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filteredListings = listings.filter(l =>
    l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
    l.location.toLowerCase().includes(listingSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Sidebar nav items ────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview',  icon: '◈',  label: 'Overview'                                    },
    { id: 'pending',   icon: '⏳', label: 'Pending Review', badge: pendingListings.length },
    { id: 'listings',  icon: '🏡', label: 'Listings'                                     },
    { id: 'users',     icon: '👥', label: 'Users'                                         },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: A.bg, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 220,
        background: A.sidebar,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width 0.25s ease',
        flexShrink: 0, zIndex: 100,
        overflow: 'hidden',
      }}>
        {/* Logo area */}
        <div style={{
          padding: sidebarCollapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        }}>
          {!sidebarCollapsed && (
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: A.accent, letterSpacing: -0.5 }}>
              LalaBnB
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              title={item.label}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 12, padding: sidebarCollapsed ? '10px 0' : '10px 12px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeSection === item.id ? 'rgba(255,94,58,0.18)' : 'transparent',
                color: activeSection === item.id ? A.accent : 'rgba(255,255,255,0.65)',
                fontSize: sidebarCollapsed ? 20 : 14,
                fontWeight: activeSection === item.id ? 600 : 400,
                marginBottom: 2, transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
            {!sidebarCollapsed && item.label}
            {!sidebarCollapsed && item.badge > 0 && (
              <span style={{ marginLeft: 'auto', background: A.amber, color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
                {item.badge}
              </span>
            )}
            {!sidebarCollapsed && activeSection === item.id && !item.badge && (
              <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: A.accent }} />
            )}
            </button>
          ))}
        </nav>

        {/* Bottom: back to site */}
        <div style={{ padding: '16px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setPage('home')}
            title="Back to site"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 12, padding: sidebarCollapsed ? '10px 0' : '10px 12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14, whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>←</span>
            {!sidebarCollapsed && 'Back to site'}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          background: A.card, borderBottom: `1px solid ${A.border}`,
          padding: '0 32px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
        }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: A.text, margin: 0 }}>
              {NAV.find(n => n.id === activeSection)?.label || 'Dashboard'}
            </p>
            <p style={{ fontSize: 12, color: A.muted, margin: 0 }}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StatusDot color={A.green} label="Platform online" />
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: A.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>
              {user.name[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ── OVERVIEW ─────────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <div>
              <SectionHeader
                title="Platform overview"
                sub="Live snapshot of your LalaBnB platform"
              />

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard icon="🏡" label="Available rooms"    value={activeListings}          sub={`${hiddenListings} hidden`}                    accent={A.green} />
                <StatCard icon="⏳" label="Pending review"     value={pendingListings.length}   sub="Host submissions"                              accent={A.amber} />
                <StatCard icon="👥" label="Registered users"   value={totalUsers}              sub={`${analytics.uniqueUsers} unique visitors`}    accent={A.blue}  />
                <StatCard icon="🌐" label="Website visits"     value={analytics.totalVisits}   sub="All-time page views"                           accent={A.accent}/>
                <StatCard icon="📋" label="Total listings"     value={totalListings}           sub={`${activeListings} active`}                    accent="#8B6F47" />
              </div>

              {/* Page-view breakdown */}
              <div style={{ background: A.card, borderRadius: 16, border: `1px solid ${A.border}`, padding: '20px 24px', marginBottom: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: A.text, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Page views breakdown
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  {Object.entries(analytics.pageviews).length > 0
                    ? Object.entries(analytics.pageviews).map(([pg, views]) => (
                        <div key={pg} style={{ background: A.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${A.border}` }}>
                          <p style={{ fontSize: 12, color: A.muted, margin: '0 0 4px', textTransform: 'capitalize' }}>{pg}</p>
                          <p style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0, fontFamily: "'Playfair Display', serif" }}>{views}</p>
                        </div>
                      ))
                    : <p style={{ color: A.muted, fontSize: 13 }}>No pageview data yet — connect Firestore analytics to track visits.</p>
                  }
                </div>
              </div>

              {/* Platform status */}
              <div style={{
                background: A.card, borderRadius: 16,
                border: `1px solid ${A.border}`,
                padding: '20px 24px', marginBottom: 28,
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: A.text, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Platform status
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Web app',          ok: true  },
                    { label: 'Firestore DB',      ok: true  },
                    { label: 'Firebase Auth',     ok: true  },
                    { label: 'M-Pesa API',        ok: false },
                    { label: 'WhatsApp API',      ok: true  },
                    { label: 'Google Maps API',   ok: false },
                  ].map(s => (
                    <div key={s.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: A.bg, border: `1px solid ${A.border}`,
                    }}>
                      <span style={{ fontSize: 13, color: A.text }}>{s.label}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: s.ok ? A.green + '18' : A.amber + '18',
                        color: s.ok ? A.green : A.amber,
                      }}>
                        {s.ok ? '● Online' : '○ Not set'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent listings preview */}
              <div style={{ background: A.card, borderRadius: 16, border: `1px solid ${A.border}`, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: A.text, margin: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Recent listings
                  </p>
                  <button onClick={() => setActiveSection('listings')} style={{ background: 'none', border: 'none', color: A.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    View all →
                  </button>
                </div>
                {listings.slice(0, 3).map(l => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: `1px solid ${A.border}` }}>
                    <img src={l.images[0]} alt={l.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: A.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</p>
                      <p style={{ color: A.muted, fontSize: 12, margin: 0 }}>📍 {l.location}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: A.text, whiteSpace: 'nowrap' }}>{fmt(l.price)}</span>
                    <Pill color={l.hidden ? A.muted : A.green}>{l.hidden ? 'Hidden' : 'Active'}</Pill>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PENDING LISTINGS ─────────────────────────────── */}
<div style={{ marginBottom: 30 }}>
  <h2 style={{
    fontFamily: "'Playfair Display', serif",
    marginBottom: 10
  }}>
    Pending Listings ({pendingListings.length})
  </h2>

  {pendingListings.length === 0 ? (
    <p style={{ color: A.muted }}>No pending listings</p>
  ) : (
    <div style={{ display: 'grid', gap: 12 }}>
      {pendingListings.map((listing) => (
        <div
          key={listing.id}
          style={{
            border: `1px solid ${A.border}`,
            padding: 16,
            borderRadius: 12,
            background: '#fff'
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              style={{
                width: 80,
                height: 60,
                objectFit: 'cover',
                borderRadius: 8
              }}
            />

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>{listing.title}</h4>
              <p style={{ margin: '4px 0', color: A.muted }}>
                📍 {listing.location}
              </p>
              <p style={{ fontWeight: 600 }}>
                {fmt(listing.price)}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={() => handleApproveListing(listing)}
                style={{
                  background: A.green,
                  color: '#fff',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>

              <button
                onClick={() => handleRejectListing(listing.id)}
                style={{
                  background: A.red,
                  color: '#fff',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          {/* ── LISTINGS ─────────────────────────────────────────────── */}
          {activeSection === 'listings' && (
            <div>
              <SectionHeader
                title="Listings management"
                sub={`${listings.length} total properties · ${activeListings} active`}
                action={
                  <button onClick={openAdd} style={primaryBtn}>
                    + Add listing
                  </button>
                }
              />

              {/* Search */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: A.muted, fontSize: 15 }}>🔍</span>
                  <input
                    placeholder="Search by title or location…"
                    value={listingSearch}
                    onChange={e => setListingSearch(e.target.value)}
                    style={{ ...searchInput, paddingLeft: 38 }}
                  />
                </div>
                <span style={{ color: A.muted, fontSize: 13 }}>{filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              <div style={{ background: A.card, borderRadius: 16, border: `1px solid ${A.border}`, overflow: 'hidden' }}>
                {filteredListings.length === 0 ? (
                  <EmptyState
                    icon="🏡"
                    title={listingSearch ? 'No listings match your search' : 'No listings found'}
                    sub={listingSearch ? 'Try a different search term' : 'Add your first property to get started!'}
                    action={!listingSearch && <button onClick={openAdd} style={primaryBtn}>+ Add your first property</button>}
                  />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: A.bg }}>
                        {['Property', 'Location', 'Price / night', 'Rating', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map((l, idx) => (
                        <tr
                          key={l.id}
                          style={{
                            borderBottom: idx < filteredListings.length - 1 ? `1px solid ${A.border}` : 'none',
                            background: l.hidden ? '#fafafa' : A.card,
                            transition: 'background 0.15s',
                          }}
                        >
                          {/* Property */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src={l.images[0]} alt={l.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, opacity: l.hidden ? 0.5 : 1 }} />
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 14, color: l.hidden ? A.muted : A.text, margin: 0, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {l.title}
                                </p>
                                {l.verified && (
                                  <span style={{ fontSize: 10, color: A.accent, fontWeight: 700 }}>✓ LalaVerified</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td style={{ padding: '14px 16px', fontSize: 13, color: A.muted, whiteSpace: 'nowrap' }}>
                            📍 {l.location}
                          </td>

                          {/* Price */}
                          <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14, color: A.text, whiteSpace: 'nowrap' }}>
                            {fmt(l.price)}
                          </td>

                          {/* Rating */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            {l.rating > 0 ? (
                              <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>★ {l.rating} <span style={{ color: A.muted, fontWeight: 400 }}>({l.reviews})</span></span>
                            ) : (
                              <span style={{ color: A.muted, fontSize: 13 }}>No reviews yet</span>
                            )}
                          </td>

                          {/* Status toggle */}
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              onClick={() => handleToggleHide(l.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 12px', borderRadius: 20, border: 'none',
                                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                background: l.hidden ? A.muted + '18' : A.green + '18',
                                color: l.hidden ? A.muted : A.green,
                                transition: 'all 0.2s',
                              }}
                            >
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.hidden ? A.muted : A.green }} />
                              {l.hidden ? 'Hidden' : 'Active'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {/* Edit */}
                              <button
                                onClick={() => openEdit(l)}
                                title="Edit listing"
                                style={{ ...iconBtn, background: A.blue + '15', color: A.blue }}
                              >
                                ✎
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(l.id)}
                                title="Delete listing"
                                style={{ ...iconBtn, background: A.red + '15', color: A.red }}
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── PENDING REVIEW ───────────────────────────────────────── */}
          {activeSection === 'pending' && (
            <div>
              <SectionHeader
                title="Pending review"
                sub={`${pendingListings.length} submission${pendingListings.length !== 1 ? 's' : ''} awaiting your decision`}
              />

              {pendingListings.length === 0 ? (
                <EmptyState
                  icon="📬"
                  title="No pending submissions"
                  sub="When property owners submit listings they will appear here for your review."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {pendingListings.map((p) => (
                    <PendingCard
                      key={p.id}
                      listing={p}
                      onApprove={() => {
                        // Move from pending → active listings
                        const approved = {
                          ...p,
                          id:      Date.now(),
                          status:  'active',
                          hidden:  false,
                          rating:  0,
                          reviews: 0,
                          verified: false,
                          images:  Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
                        };
                        setListings(ls => [approved, ...ls]);
                        const updated = pendingListings.filter(x => x.id !== p.id);
                        setPendingListings(updated);
                        localStorage.setItem('pendingListings', JSON.stringify(updated));
                        // Firestore version:
                        // await updateDoc(doc(db, 'pendingListings', p.id), { status: 'approved' });
                        // await addDoc(collection(db, 'listings'), { ...p, status: 'active' });
                      }}
                      onReject={() => {
                        if (!window.confirm(`Reject "${p.title}"? This cannot be undone.`)) return;
                        const updated = pendingListings.filter(x => x.id !== p.id);
                        setPendingListings(updated);
                        localStorage.setItem('pendingListings', JSON.stringify(updated));
                        // Firestore version:
                        // await updateDoc(doc(db, 'pendingListings', p.id), { status: 'rejected' });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── USERS ────────────────────────────────────────────────── */}
          {activeSection === 'users' && (
            <div>
              <SectionHeader
                title="User management"
                sub={`${users.length} registered accounts`}
              />

              {/* Search */}
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: A.muted, fontSize: 15 }}>🔍</span>
                  <input
                    placeholder="Search by name or email…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ ...searchInput, paddingLeft: 38 }}
                  />
                </div>
                <span style={{ color: A.muted, fontSize: 13 }}>{filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ background: A.card, borderRadius: 16, border: `1px solid ${A.border}`, overflow: 'hidden' }}>
                {filteredUsers.length === 0 ? (
                  <EmptyState icon="👥" title="No users found" sub="Try a different search term" />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: A.bg }}>
                        {['User', 'Email', 'Joined', 'Bookings', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, idx) => (
                        <tr key={u.id} style={{ borderBottom: idx < filteredUsers.length - 1 ? `1px solid ${A.border}` : 'none' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: A.accent + '25', color: A.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {u.name[0]}
                              </div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: A.text, margin: 0 }}>{u.name}</p>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: A.muted }}>{u.email}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: A.muted, whiteSpace: 'nowrap' }}>{u.joined}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <Pill color={u.bookings > 0 ? A.blue : A.muted}>
                              {u.bookings} booking{u.bookings !== 1 ? 's' : ''}
                            </Pill>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <button
                              onClick={() => window.confirm(`Suspend ${u.name}? (Coming soon — connect Firebase Admin SDK)`)}
                              style={{ ...iconBtn, background: A.amber + '15', color: A.amber, fontSize: 14 }}
                              title="Suspend user"
                            >
                              ⊘
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Note about Firestore users */}
              <div style={{ marginTop: 16, padding: '12px 16px', background: A.blue + '10', borderRadius: 10, border: `1px solid ${A.blue}25`, fontSize: 13, color: A.blue }}>
                💡 <strong>Tip:</strong> To load real users from Firebase Auth, use the <strong>Firebase Admin SDK</strong> on your backend and expose a <code>GET /api/admin/users</code> endpoint. The frontend calls that and populates this table.
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Slide-over ───────────────────────────────────────────────────── */}
      <SlideOver
        open={slideOpen}
        onClose={() => { setSlideOpen(false); setEditTarget(null); }}
        onSave={handleSaveListing}
        initial={editTarget ? {
          title:       editTarget.title,
          location:    editTarget.location,
          region:      editTarget.region || 'Nairobi',
          price:       String(editTarget.price),
          imageUrl:    editTarget.images?.[0] || '',
          amenities:   (editTarget.amenities || []).join(', '),
          description: editTarget.description || '',
        } : null}
      />
    </div>
  );
}

// ─── PendingCard ──────────────────────────────────────────────────────────────
// Renders a single host-submitted listing awaiting admin approval.

function PendingCard({ listing, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);

  const imageUrl = Array.isArray(listing.images)
    ? listing.images[0]
    : listing.images || null;

  return (
    <div style={{
      background: A.card, borderRadius: 16,
      border: `1.5px solid ${A.amber}40`,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {/* ── Header row ───────────────────────────────────────────────── */}
      <div style={{ padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Thumbnail */}
        <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: A.bg, flexShrink: 0 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏡</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: A.text, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              {listing.title || 'Untitled listing'}
            </p>
            <span style={{ background: A.amber + '20', color: A.amber, border: `1px solid ${A.amber}40`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '2px 9px' }}>
              ⏳ Pending
            </span>
          </div>
          <p style={{ color: A.muted, fontSize: 13, margin: '0 0 6px' }}>📍 {listing.location || '—'}</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: A.text, fontWeight: 600 }}>
              {listing.price ? `KES ${Number(listing.price).toLocaleString()} / night` : 'No price set'}
            </span>
            {listing.name && <span style={{ fontSize: 13, color: A.muted }}>Host: {listing.name}</span>}
            {listing.phone && <span style={{ fontSize: 13, color: A.muted }}>📞 {listing.phone}</span>}
            {listing.email && <span style={{ fontSize: 13, color: A.muted }}>✉️ {listing.email}</span>}
          </div>
          {listing.amenities?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {listing.amenities.map(a => (
                <span key={a} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: A.bg, border: `1px solid ${A.border}`, color: A.muted }}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submitted date */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: A.muted, margin: '0 0 4px' }}>Submitted</p>
          <p style={{ fontSize: 12, color: A.text, margin: 0, fontWeight: 500 }}>
            {listing.submittedAt
              ? new Date(listing.submittedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>

      {/* ── Description expand ───────────────────────────────────────── */}
      {listing.description && (
        <div style={{ paddingLeft: 22, paddingRight: 22, paddingBottom: expanded ? 14 : 0 }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.blue, fontSize: 13, padding: 0, marginBottom: 8, fontWeight: 500 }}
          >
            {expanded ? '▲ Hide description' : '▼ Read description'}
          </button>
          {expanded && (
            <p style={{ fontSize: 14, color: A.muted, lineHeight: 1.7, margin: 0, paddingBottom: 8 }}>
              {listing.description}
            </p>
          )}
        </div>
      )}

      {/* ── Action bar ───────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${A.border}`,
        padding: '14px 22px',
        display: 'flex', gap: 10, justifyContent: 'flex-end',
        background: A.bg,
      }}>
        <button
          onClick={onReject}
          style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${A.red}40`, background: A.red + '10', color: A.red, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          ✕ Reject
        </button>
        <button
          onClick={onApprove}
          style={{ padding: '8px 24px', borderRadius: 10, border: 'none', background: A.green, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          ✓ Approve & publish
        </button>
      </div>
    </div>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: A.text, margin: '0 0 4px' }}>{title}</h1>
        {sub && <p style={{ color: A.muted, fontSize: 13, margin: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p style={{ fontSize: 44, marginBottom: 12 }}>{icon}</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: A.text, marginBottom: 6 }}>{title}</p>
      <p style={{ color: A.muted, fontSize: 13, marginBottom: action ? 20 : 0 }}>{sub}</p>
      {action}
    </div>
  );
}

// ─── Shared style objects ─────────────────────────────────────────────────────

const primaryBtn = {
  background: A.accent, color: '#fff', border: 'none',
  borderRadius: 10, padding: '10px 20px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  border: 'none', cursor: 'pointer',
  fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'opacity 0.15s',
};

const searchInput = {
  width: '100%', padding: '9px 14px',
  borderRadius: 10, border: `1px solid ${A.border}`,
  fontSize: 14, color: A.text, background: A.card,
  outline: 'none', boxSizing: 'border-box',
};

const formLabel = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: A.muted, textTransform: 'uppercase',
  letterSpacing: 0.7, marginBottom: 6,
};

const formInput = {
  width: '100%', padding: '10px 13px',
  borderRadius: 8, border: `1px solid ${A.border}`,
  fontSize: 14, color: A.text, background: '#fafafa',
  outline: 'none', boxSizing: 'border-box',
};
