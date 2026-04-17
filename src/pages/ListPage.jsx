// ─── ListPage ─────────────────────────────────────────────────────────────────
// Property listing form for hosts. Collects contact info, property details,
// location, amenities, and photos. Simulates a database submission.

import React, { useState } from 'react';
import { COLORS, inputStyle, primaryBtnStyle, labelStyle } from '../styles/theme';
import { ALL_AMENITIES } from '../data/listings';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


export default function ListPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    title: '', description: '', location: '',
    price: '', amenities: [], images: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleAmenity = (a) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, 'pendingListings'), {
      ...form,
      price: Number(form.price),
      status: 'pending',
      images: form.images ? [form.images] : [],
      submittedAt: serverTimestamp(),
      rating: 0,
      reviews: 0,
      verified: false,
    });

    setSubmitted(true);

  } catch (err) {
    console.error(err);
    alert('Submission failed');
  }
};

const handleReset = () => {
  setSubmitted(false);

  setForm({
    name: '',
    phone: '',
    email: '',
    title: '',
    description: '',
    location: '',
    price: '',
    amenities: [],
    images: '',
  });
};

  if (submitted)
  return <SuccessScreen onReset={handleReset} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: COLORS.charcoal, marginBottom: 8 }}>
          List your property
        </h1>
        <p style={{ color: COLORS.muted, fontSize: 16, lineHeight: 1.6 }}>
          Earn from your space by welcoming guests from across Kenya and beyond. Join our growing community of Kenyan hosts today.
        </p>

        {/* Benefits strip */}
        <div
          style={{
            display: 'flex', gap: 20, marginTop: 20,
            padding: 20, background: COLORS.pearl,
            borderRadius: 16, border: `1px solid ${COLORS.border}`,
          }}
        >
          {[
            ['🏠', 'Easy listing', 'Go live in minutes'],
            ['💰', 'Earn in KES', 'M-Pesa payments'],
            ['✓', 'LalaVerified', 'Badge for quality hosts'],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ fontSize: 28, margin: '0 0 4px' }}>{icon}</p>
              <p style={{ fontWeight: 700, fontSize: 13, color: COLORS.charcoal, margin: 0 }}>{title}</p>
              <p style={{ color: COLORS.muted, fontSize: 12, margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Section: Your details ──────────────────────────────────── */}
        <SectionHeading>Your details</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>Full name *</label>
            <input
              required
              placeholder="Jane Wanjiru"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone (WhatsApp) *</label>
            <input
              required
              placeholder="+254 7XX XXX XXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
        <label style={labelStyle}>Email address *</label>
        <input
          required
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
        />

        {/* ── Section: Property details ──────────────────────────────── */}
        <SectionHeading>Property details</SectionHeading>
        <label style={labelStyle}>Property title *</label>
        <input
          required
          placeholder="e.g. Beachfront Villa with Pool, Diani"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={inputStyle}
        />
        <label style={labelStyle}>Description *</label>
        <textarea
          required
          rows={4}
          placeholder="Describe your property — location, unique features, nearby attractions..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <label style={labelStyle}>Location / Address *</label>
        <input
          required
          placeholder="e.g. Diani Beach Road, Kwale County"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          style={inputStyle}
        />

        {/* Google Maps picker placeholder */}
        <div
          style={{
            background: COLORS.pearl, borderRadius: 12,
            padding: 16, border: `1px solid ${COLORS.border}`,
            marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 28 }}>📍</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: COLORS.charcoal, margin: 0 }}>
              Google Maps pin (coming soon)
            </p>
            <p style={{ color: COLORS.muted, fontSize: 12, margin: '2px 0 0' }}>
              Drag-and-drop location picker — connect Google Maps API to enable
            </p>
          </div>
        </div>

        <label style={labelStyle}>Price per night (KES) *</label>
        <input
          required
          type="number"
          placeholder="5000"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          style={inputStyle}
        />

        {/* ── Section: Amenities ─────────────────────────────────────── */}
        <SectionHeading>Amenities</SectionHeading>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {ALL_AMENITIES.map((a) => {
            const active = form.amenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                style={{
                  padding: '8px 18px', borderRadius: 20,
                  border: `1.5px solid ${active ? COLORS.orange : COLORS.border}`,
                  background: active ? COLORS.orange + '15' : COLORS.white,
                  color: active ? COLORS.orange : COLORS.charcoal,
                  fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
                }}
              >
                {active ? '✓ ' : ''}{a}
              </button>
            );
          })}
        </div>

        {/* ── Section: Photos ────────────────────────────────────────── */}
        <SectionHeading>Photos</SectionHeading>
        <div
          style={{
            border: `2px dashed ${COLORS.border}`, borderRadius: 16,
            padding: '36px 24px', textAlign: 'center',
            marginBottom: 8, cursor: 'pointer', background: COLORS.pearl,
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>📸</p>
          <p style={{ fontWeight: 600, color: COLORS.charcoal, marginBottom: 4 }}>Upload property photos</p>
          <p style={{ color: COLORS.muted, fontSize: 13 }}>PNG, JPG up to 10 MB each · Minimum 5 photos recommended</p>
          <button
            type="button"
            style={{ marginTop: 12, background: COLORS.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontSize: 14 }}
          >
            Choose files
          </button>
        </div>

        <button type="submit" style={primaryBtnStyle}>
          Submit listing for review →
        </button>
      </form>
    </div>
  );
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h3
      style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, color: COLORS.charcoal,
        margin: '28px 0 16px',
        borderBottom: `2px solid ${COLORS.orange}`,
        paddingBottom: 8,
      }}
    >
      {children}
    </h3>
  );
}

function SuccessScreen({ onReset }) {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🏡</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: COLORS.charcoal, marginBottom: 12 }}>
        Listing submitted!
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
        Thank you for listing with LalaBnB. Our team will review your property within 24 hours and get in touch via WhatsApp.
      </p>
      <div style={{ background: COLORS.pearl, borderRadius: 16, padding: 24, marginBottom: 28, border: `1px solid ${COLORS.border}` }}>
        <p style={{ color: COLORS.tuscanDark, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>📋 What happens next?</p>
        {[
          'Our team reviews your listing (1–2 business days)',
          'We may contact you for additional photos or details',
          'Once approved, your property goes live on LalaBnB',
          'Guests book and pay via M-Pesa — funds land in your account',
        ].map((step, i) => (
          <p key={i} style={{ color: COLORS.muted, fontSize: 13, margin: '6px 0' }}>
            {i + 1}. {step}
          </p>
        ))}
      </div>
      <button onClick={onReset} style={{ ...primaryBtnStyle, width: 'auto', padding: '12px 28px' }}>
        Submit another listing
      </button>
    </div>
  );
}
