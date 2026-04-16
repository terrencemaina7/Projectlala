// ─── DetailPage ───────────────────────────────────────────────────────────────
// Full property detail view: image gallery carousel, amenities, map placeholder,
// reviews system, desktop sticky booking card, and mobile sticky bottom bar.

import React, { useState } from 'react';
import { COLORS, formatKES, primaryBtnStyle } from '../styles/theme';
import { useApp } from '../context/AppContext';
import Badge from '../components/Badge';
import StarRating from '../components/StarRating';
import AmenityIcon from '../components/AmenityIcon';
import BookingCard from '../components/BookingCard';

const SEED_REVIEWS = [
  { user: 'Sarah K.', rating: 5, text: 'Absolutely magical! The views were breathtaking and the host was incredibly responsive.', date: 'March 2025' },
  { user: 'James O.', rating: 5, text: 'Perfect getaway — exactly as described. Clean, beautiful, and great location.', date: 'February 2025' },
  { user: 'Aisha M.', rating: 4, text: 'Wonderful experience. Would love to come back for longer next time!', date: 'January 2025' },
];

export default function DetailPage() {
  const { selectedListing: listing, user, setPage } = useApp();

  const [imgIdx, setImgIdx] = useState(0);
  const [nights, setNights] = useState(3);
  const [bookingDone, setBookingDone] = useState(false);
  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!listing) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🏡</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: COLORS.charcoal }}>
          No property selected
        </p>
        <button onClick={() => setPage('search')} style={{ ...primaryBtnStyle, width: 'auto', marginTop: 20, padding: '12px 28px' }}>
          Browse listings
        </button>
      </div>
    );
  }

  // Pricing
  const total = listing.price * nights;
  const serviceFee = Math.round(total * 0.1);
  const grandTotal = total + serviceFee;

  const handleBook = () => {
    if (!user) { alert('Please log in to book this property.'); return; }
    setBookingDone(true);
  };

  const submitReview = () => {
    if (!reviewText.trim()) return;
    setReviews([{ user: user?.name || 'Guest', rating: reviewRating, text: reviewText, date: 'April 2025' }, ...reviews]);
    setReviewText('');
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 120px' }}>

      {/* Back link */}
      <button
        onClick={() => setPage('search')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.muted, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        ← Back to results
      </button>

      {/* ── Title row ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(22px, 4vw, 36px)',
              color: COLORS.charcoal, margin: 0, lineHeight: 1.2,
            }}
          >
            {listing.title}
          </h1>
          {listing.verified && <Badge text="LalaVerified" />}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <StarRating rating={listing.rating} reviews={listing.reviews} size={15} />
          <span style={{ color: COLORS.muted, fontSize: 14 }}>📍 {listing.location}</span>
          <span style={{ color: COLORS.muted, fontSize: 14 }}>
            👥 Up to {listing.guests} guests · 🛏 {listing.beds} beds · 🚿 {listing.baths} baths
          </span>
        </div>
      </div>

      {/* ── Image gallery ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        {/* Main image */}
        <div style={{ borderRadius: 20, overflow: 'hidden', paddingTop: 'min(55%, 500px)', position: 'relative', marginBottom: 8 }}>
          <img
            src={listing.images[imgIdx]}
            alt={listing.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Prev / Next arrows */}
          {imgIdx > 0 && (
            <ArrowBtn side="left" onClick={() => setImgIdx(imgIdx - 1)}>‹</ArrowBtn>
          )}
          {imgIdx < listing.images.length - 1 && (
            <ArrowBtn side="right" onClick={() => setImgIdx(imgIdx + 1)}>›</ArrowBtn>
          )}
        </div>
        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: 8 }}>
          {listing.images.map((src, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              style={{
                flex: 1, paddingTop: '15%', position: 'relative',
                borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${i === imgIdx ? COLORS.orange : 'transparent'}`,
                background: 'none', cursor: 'pointer', minWidth: 0,
              }}
            >
              <img
                src={src}
                alt=""
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: i === imgIdx ? 1 : 0.7,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Main columns ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>

        {/* Left: description, amenities, map, reviews */}
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>

          {/* Description */}
          <Section title="About this property">
            <p style={{ color: COLORS.charcoal, lineHeight: 1.8, fontSize: 15 }}>{listing.description}</p>
          </Section>

          {/* Amenities */}
          <Section title="What's included">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {listing.amenities.map((a) => <AmenityIcon key={a} name={a} />)}
            </div>
          </Section>

          {/* Location */}
          <Section title="Location">
            <div
              style={{
                borderRadius: 16, height: 250,
                background: COLORS.pearl,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32 }}>📍</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: COLORS.charcoal }}>
                  {listing.location}
                </p>
                <p style={{ color: COLORS.muted, fontSize: 12 }}>
                  lat: {listing.lat.toFixed(4)}, lng: {listing.lng.toFixed(4)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${listing.lat},${listing.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: COLORS.orange, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </Section>

          {/* Reviews */}
          <Section title="Guest reviews">
            {/* Aggregate score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: COLORS.charcoal, fontFamily: "'Playfair Display', serif" }}>
                {listing.rating}
              </span>
              <div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} style={{ color: s <= Math.round(listing.rating) ? COLORS.star : COLORS.border, fontSize: 20 }}>★</span>
                  ))}
                </div>
                <p style={{ color: COLORS.muted, fontSize: 13, margin: '2px 0 0' }}>
                  Based on {listing.reviews} reviews
                </p>
              </div>
            </div>

            {/* Review list */}
            {reviews.map((r, i) => (
              <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.user} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: COLORS.charcoal }}>{r.user}</p>
                      <p style={{ color: COLORS.muted, fontSize: 12, margin: 0 }}>{r.date}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} size={13} />
                </div>
                <p style={{ color: COLORS.charcoal, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{r.text}</p>
              </div>
            ))}

            {/* Leave a review (logged-in users only) */}
            {user && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontWeight: 600, color: COLORS.charcoal, marginBottom: 10 }}>Leave a review</p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: s <= reviewRating ? COLORS.star : COLORS.border }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.charcoal, background: COLORS.pearl, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                />
                <button
                  onClick={submitReview}
                  style={{ ...primaryBtnStyle, width: 'auto', padding: '10px 24px' }}
                >
                  Submit review
                </button>
              </div>
            )}
          </Section>
        </div>

        {/* Right: sticky booking card (desktop) */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div
            style={{
              position: 'sticky', top: 84,
              background: COLORS.white, borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
              padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <BookingCard
              listing={listing}
              nights={nights}
              setNights={setNights}
              total={total}
              serviceFee={serviceFee}
              grandTotal={grandTotal}
              user={user}
              bookingDone={bookingDone}
              setBookingDone={setBookingDone}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ─────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 500, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 18, color: COLORS.charcoal }}>
            {formatKES(listing.price)}
          </span>
          <span style={{ color: COLORS.muted, fontSize: 13 }}> / night</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`https://wa.me/${listing.hostPhone}?text=Hi, I'm interested in "${listing.title}" on LalaBnB`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#25D366', color: '#fff',
              borderRadius: 12, padding: '12px 18px',
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            💬 WhatsApp
          </a>
          <button
            onClick={handleBook}
            style={{ ...primaryBtnStyle, width: 'auto', padding: '12px 24px', fontSize: 14 }}
          >
            {bookingDone ? '✓ Booked!' : 'Book now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Local helper components ───────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: COLORS.charcoal, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Avatar({ name }) {
  return (
    <div
      style={{
        width: 38, height: 38, borderRadius: '50%',
        background: COLORS.orange + '30', color: COLORS.orange,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 15,
      }}
    >
      {name[0]}
    </div>
  );
}

function ArrowBtn({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        [side]: 16,
        top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.9)',
        border: 'none', width: 40, height: 40,
        borderRadius: '50%', cursor: 'pointer', fontSize: 18,
      }}
    >
      {children}
    </button>
  );
}
