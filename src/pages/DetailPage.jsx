// ─── DetailPage.jsx ───────────────────────────────────────────────────────────
// Property detail view. All pricing is derived from checkIn/checkOut dates
// and the guest count — there is no manual "nights" state anywhere in this file.

import React, { useState } from 'react';
import { useApp }      from '../context/AppContext';
import Badge           from '../components/Badge';
import StarRating      from '../components/StarRating';
import AmenityIcon     from '../components/AmenityIcon';
import BookingCard     from '../components/BookingCard';
import { useBookedDates } from '../hooks/useBookedDates';

const C = {
  tuscanDark: '#5C4425', tuscan: '#8B6F47', tuscanLight: '#A68B5B',
  pearl:      '#F8F6F0', pearlDark: '#EDE9E0', pearlDeep: '#DDD6C8',
  orange:     '#FF5E3A', charcoal:  '#2C1F0E', muted:     '#7A6A56',
  white:      '#FFFFFF', green:     '#2E7D32', star:      '#F59E0B',
  border:     '#DDD6C8', whatsapp:  '#25D366',
};

const fmt      = n => `KES ${Number(n).toLocaleString()}`;
const fmtShort = d => d.toLocaleDateString('en-KE', { day:'numeric', month:'short' });

const calcNights = (ci, co) =>
  ci && co ? Math.max(1, Math.round((co - ci) / 86_400_000)) : 0;

const SEED_REVIEWS = [
  { user:'Sarah K.',  rating:5, text:'Absolutely magical! The views were breathtaking and the host was incredibly responsive.', date:'March 2025' },
  { user:'James O.',  rating:5, text:'Perfect getaway — exactly as described. Clean, beautiful, and great location.',            date:'February 2025' },
  { user:'Aisha M.',  rating:4, text:'Wonderful experience. Would love to come back for longer next time!',                      date:'January 2025' },
];

export default function DetailPage() {
  const { selectedListing: listing, user, setPage, navigate,
          searchDates, searchGuests } = useApp();

  // ── Image carousel ────────────────────────────────────────────────────────
  const [imgIdx, setImgIdx] = useState(0);

  // ── Dates & guests — pre-filled from homepage search ─────────────────────
  // If the user already selected dates/guests on the homepage search bar,
  // those values arrive via context and are used as initial state here.
  // The user can still adjust them inside the booking card.
  const [checkIn,  setCheckIn]  = useState(searchDates?.checkIn  || null);
  const [checkOut, setCheckOut] = useState(searchDates?.checkOut || null);
  const [guests,   setGuests]   = useState(
    searchGuests || { adults: 1, children: 0, infants: 0 }
  );
  const { blockedDates } = useBookedDates(listing?.id);


  // ── Booking state — handled by PaymentPage now ───────────────────────────

  // ── Reviews ───────────────────────────────────────────────────────────────
  const [reviews,     setReviews]     = useState(SEED_REVIEWS);
  const [reviewText,  setReviewText]  = useState('');
  const [reviewRating,setReviewRating]= useState(5);

  // ── Derived values ────────────────────────────────────────────────────────
  const nights     = calcNights(checkIn, checkOut);
  const subtotal   = (listing?.price || 0) * Math.max(nights, 1);
  // serviceFee is only used internally for bookingDetails — NOT shown to guests
  const serviceFee = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + serviceFee;
  // Guest-facing total — no service fee shown
  const guestTotal = subtotal;
  const totalGuests = (guests.adults || 1) + (guests.children || 0);

  const handleDatesChange = ({ checkIn:ci, checkOut:co }) => {
    setCheckIn(ci); setCheckOut(co);
  };

  if (!listing) {
    return (
      <div style={{ textAlign:'center', padding:'80px 24px' }}>
        <p style={{ fontSize:40, marginBottom:12 }}>🏡</p>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.charcoal, marginBottom:20 }}>
          No property selected
        </p>
        <button
          onClick={() => setPage('search')}
          style={{ background:C.orange, color:C.white, border:'none', borderRadius:12,
            padding:'12px 28px', fontSize:15, fontWeight:700, cursor:'pointer' }}
        >
          Browse listings
        </button>
      </div>
    );
  }

  const submitReview = () => {
    if (!reviewText.trim()) return;
    setReviews([
      { user: user?.name || 'Guest', rating:reviewRating, text:reviewText, date:'2025' },
      ...reviews,
    ]);
    setReviewText('');
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px 140px' }}>

      {/* Back */}
      <button
        onClick={() => setPage('search')}
        style={{ background:'none', border:'none', cursor:'pointer',
          color:C.muted, fontSize:14, marginBottom:20,
          display:'flex', alignItems:'center', gap:6 }}
      >
        ← Back to results
      </button>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10,
          alignItems:'center', marginBottom:8 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif",
            fontSize:'clamp(22px,4vw,36px)', color:C.charcoal,
            margin:0, lineHeight:1.2 }}>
            {listing.title}
          </h1>
          {listing.verified && <Badge text="LalaVerified" />}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
          <StarRating rating={listing.rating} reviews={listing.reviews} size={15} />
          <span style={{ color:C.muted, fontSize:14 }}>📍 {listing.location}</span>
          <span style={{ color:C.muted, fontSize:14 }}>
            👥 Up to {listing.guests} guests · 🛏 {listing.beds} beds · 🚿 {listing.baths} baths
          </span>
        </div>
      </div>

      {/* ── Image gallery ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:32 }}>
        {/* Main image */}
        <div style={{ borderRadius:20, overflow:'hidden',
          paddingTop:'min(55%,500px)', position:'relative', marginBottom:8 }}>
          <img
            src={listing.images[imgIdx]}
            alt={listing.title}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          />
          {imgIdx > 0 && (
            <ArrowBtn side="left" onClick={() => setImgIdx(i => i - 1)}>‹</ArrowBtn>
          )}
          {imgIdx < listing.images.length - 1 && (
            <ArrowBtn side="right" onClick={() => setImgIdx(i => i + 1)}>›</ArrowBtn>
          )}
        </div>
        {/* Thumbnails */}
        <div style={{ display:'flex', gap:8 }}>
          {listing.images.map((src, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              style={{ flex:1, paddingTop:'15%', position:'relative',
                borderRadius:10, overflow:'hidden',
                border:`2px solid ${i===imgIdx?C.orange:'transparent'}`,
                background:'none', cursor:'pointer', minWidth:0 }}
            >
              <img src={src} alt=""
                style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                  objectFit:'cover', opacity:i===imgIdx?1:0.65 }}/>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main two-column layout ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:40, flexWrap:'wrap' }}>

        {/* ── Left: info ──────────────────────────────────────────────────── */}
        <div style={{ flex:'1 1 480px', minWidth:0 }}>

          {/* Description */}
          <Section title="About this property">
            <p style={{ color:C.charcoal, lineHeight:1.8, fontSize:15 }}>
              {listing.description}
            </p>
          </Section>

          {/* Amenities */}
          <Section title="What's included">
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {listing.amenities.map(a => <AmenityIcon key={a} name={a} />)}
            </div>
          </Section>

          {/* Location */}
          <Section title="Location">
            <div style={{ borderRadius:16, height:220, background:C.pearlDark,
              display:'flex', alignItems:'center', justifyContent:'center',
              border:`1px solid ${C.pearlDeep}` }}>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:28 }}>📍</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15,
                  color:C.charcoal, marginBottom:4 }}>{listing.location}</p>
                <a
                  href={`https://maps.google.com/?q=${listing.lat},${listing.lng}`}
                  target="_blank" rel="noreferrer"
                  style={{ color:C.orange, fontSize:13, fontWeight:600, textDecoration:'none' }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          </Section>

          {/* Reviews */}
          <Section title="Guest reviews">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
              <span style={{ fontSize:38, fontWeight:700, color:C.charcoal,
                fontFamily:"'Playfair Display',serif" }}>
                {listing.rating}
              </span>
              <div>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color:s<=Math.round(listing.rating)?C.star:C.pearlDeep, fontSize:20 }}>★</span>
                  ))}
                </div>
                <p style={{ color:C.muted, fontSize:13, margin:'2px 0 0' }}>
                  Based on {listing.reviews} reviews
                </p>
              </div>
            </div>

            {reviews.map((r, i) => (
              <div key={i} style={{ padding:'18px 0',
                borderBottom:`1px solid ${C.pearlDeep}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={r.user} />
                    <div>
                      <p style={{ fontWeight:600, fontSize:14, margin:0, color:C.charcoal }}>{r.user}</p>
                      <p style={{ color:C.muted, fontSize:12, margin:0 }}>{r.date}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} size={13} />
                </div>
                <p style={{ color:C.charcoal, fontSize:14, lineHeight:1.7, margin:0 }}>{r.text}</p>
              </div>
            ))}

            {user && (
              <div style={{ marginTop:22 }}>
                <p style={{ fontWeight:600, color:C.charcoal, marginBottom:10 }}>
                  Leave a review
                </p>
                <div style={{ display:'flex', gap:4, marginBottom:10 }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReviewRating(s)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        fontSize:24, color:s<=reviewRating?C.star:C.pearlDeep }}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                  style={{ width:'100%', padding:'12px 14px', borderRadius:10,
                    border:`1.5px solid ${C.pearlDeep}`, fontSize:14,
                    color:C.charcoal, background:C.pearlDark,
                    resize:'vertical', outline:'none',
                    boxSizing:'border-box', marginBottom:10 }}
                />
                <button
                  onClick={submitReview}
                  style={{ background:C.tuscanDark, color:C.white, border:'none',
                    borderRadius:10, padding:'10px 24px', fontSize:14,
                    fontWeight:700, cursor:'pointer' }}
                >
                  Submit review
                </button>
              </div>
            )}
          </Section>
        </div>

        {/* ── Right: sticky booking card (desktop) ────────────────────────── */}
        <div style={{ width:340, flexShrink:0 }}>
          <div style={{ position:'sticky', top:84, background:C.white,
            borderRadius:20, border:`1px solid ${C.pearlDeep}`,
            padding:28, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
            <BookingCard
              listing={listing}
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onDatesChange={handleDatesChange}
              guests={guests}
              onGuestsChange={setGuests}
              user={user}
              onBookNow={() => {
                navigate('payment', {
                  bookingDetails: {
                    listing,
                    checkIn,
                    checkOut,
                    nights,
                    guests,
                    subtotal,
                    serviceFee,
                    grandTotal,
                    guestTotal,
                  },
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0,
        background:C.white, borderTop:`1px solid ${C.pearlDeep}`,
        padding:'14px 20px', display:'flex',
        alignItems:'center', justifyContent:'space-between',
        zIndex:500, boxShadow:'0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div>
          <span style={{ fontWeight:700, fontSize:18, color:C.charcoal }}>
            {fmt(listing.price)}
          </span>
          <span style={{ color:C.muted, fontSize:13 }}> / night</span>
          {nights > 0 && (
            <p style={{ color:C.tuscan, fontSize:13, fontWeight:600, margin:'2px 0 0' }}>
              {nights} night{nights!==1?'s':''} · {fmt(grandTotal)}
            </p>
          )}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a
            href={`https://wa.me/${listing.hostPhone}?text=Hi, I'm interested in "${listing.title}" on LalaKenya`}
            target="_blank" rel="noreferrer"
            style={{ background:C.whatsapp, color:C.white, borderRadius:12,
              padding:'12px 16px', fontWeight:700, fontSize:14,
              textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}
          >
            💬 WhatsApp
          </a>
          <button
            onClick={() => {
              if (!user)                 { alert('Please log in to book.'); return; }
              if (!checkIn || !checkOut) { alert('Please select your dates first.'); return; }
              navigate('payment', {
                bookingDetails: {
                  listing,
                  checkIn,
                  checkOut,
                  nights,
                  guests,
                  subtotal,
                  serviceFee,   // kept for admin/backend only
                  grandTotal,   // grandTotal includes fee — used for actual charge
                  guestTotal,   // what guest sees — no service fee
                },
              });
            }}
            style={{ background:C.orange, color:C.white,
              border:'none', borderRadius:12, padding:'12px 22px',
              fontWeight:700, fontSize:14, cursor:'pointer' }}
          >
            Book now →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section style={{ marginBottom:36 }}>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22,
        color:C.charcoal, marginBottom:16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Avatar({ name }) {
  return (
    <div style={{ width:38, height:38, borderRadius:'50%',
      background:'#FF5E3A30', color:'#FF5E3A',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:700, fontSize:15, flexShrink:0 }}>
      {name[0]}
    </div>
  );
}

function ArrowBtn({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ position:'absolute', [side]:16, top:'50%',
        transform:'translateY(-50%)',
        background:'rgba(255,255,255,0.92)', border:'none',
        width:40, height:40, borderRadius:'50%',
        cursor:'pointer', fontSize:20, color:C.charcoal,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}
    >
      {children}
    </button>
  );
}
