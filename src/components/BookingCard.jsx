// ─── BookingCard.jsx ──────────────────────────────────────────────────────────
// Booking widget on the Property Detail page.
// Supports two payment methods via tabs:
//   • M-Pesa STK Push  (src/payment/mpesa.js)
//   • Debit / Credit card  (src/payment/card.js)

import React, { useState } from 'react';
import { COLORS, formatKES, primaryBtnStyle } from '../styles/theme';
import { initiateMpesaPayment, checkMpesaStatus } from '../payment/mpesa';
import { CardPaymentForm } from '../payment/card';

export default function BookingCard({
  listing, nights, setNights,
  total, serviceFee, grandTotal,
  user, bookingDone, setBookingDone,
}) {
  const [payMethod,    setPayMethod]    = useState('mpesa');
  const [mpesaPhone,   setMpesaPhone]   = useState('');
  const [mpesaStep,    setMpesaStep]    = useState('idle');
  const [mpesaMsg,     setMpesaMsg]     = useState('');
  const [showCardForm, setShowCardForm] = useState(false);

  const handleMpesa = async () => {
    if (!user) { alert('Please log in to book this property.'); return; }
    if (!mpesaPhone.trim()) { alert('Enter your M-Pesa phone number.'); return; }
    setMpesaStep('pending');
    setMpesaMsg('Sending STK Push to your phone...');
    try {
      const { checkoutRequestId } = await initiateMpesaPayment({
        phone: mpesaPhone, amount: grandTotal,
        listingId: String(listing.id), listingName: listing.title,
        userId: user.uid || user.email,
      });
      setMpesaStep('polling');
      setMpesaMsg('Check your phone and enter your M-Pesa PIN...');
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const result = await checkMpesaStatus(checkoutRequestId);
          if (result.status === 'success') {
            clearInterval(poll); setMpesaStep('success'); setBookingDone(true);
          } else if (result.status === 'failed' || attempts >= 10) {
            clearInterval(poll); setMpesaStep('error');
            setMpesaMsg(result.message || 'Payment was not completed. Please try again.');
          }
        } catch { if (attempts >= 10) { clearInterval(poll); setMpesaStep('error'); } }
      }, 3000);
    } catch (e) { setMpesaStep('error'); setMpesaMsg(e.message); }
  };

  const handleCardSuccess = () => { setShowCardForm(false); setBookingDone(true); };

  if (bookingDone) return <ConfirmedBanner listing={listing} method={payMethod} />;

  if (showCardForm) {
    return (
      <CardPaymentForm
        amount={grandTotal}
        listingId={String(listing.id)}
        userId={user?.uid || user?.email || 'guest'}
        onSuccess={handleCardSuccess}
        onCancel={() => setShowCardForm(false)}
      />
    );
  }

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: COLORS.charcoal }}>
          {formatKES(listing.price)}
        </span>
        <span style={{ color: COLORS.muted, fontSize: 14 }}> / night</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={miniLabel}>Number of nights</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StepperBtn onClick={() => setNights(Math.max(1, nights - 1))}>-</StepperBtn>
          <span style={{ fontSize: 18, fontWeight: 600, color: COLORS.charcoal, minWidth: 32, textAlign: 'center' }}>{nights}</span>
          <StepperBtn onClick={() => setNights(nights + 1)}>+</StepperBtn>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14, marginBottom: 18 }}>
        {[[`${formatKES(listing.price)} x ${nights} nights`, formatKES(total)], ['Service fee (10%)', formatKES(serviceFee)]].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: COLORS.muted, fontSize: 14 }}>{label}</span>
            <span style={{ color: COLORS.charcoal, fontSize: 14 }}>{val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.border}`, paddingTop: 10, marginTop: 4 }}>
          <span style={{ fontWeight: 700, color: COLORS.charcoal }}>Total</span>
          <span style={{ fontWeight: 700, color: COLORS.charcoal, fontSize: 17 }}>{formatKES(grandTotal)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', background: COLORS.pearl, borderRadius: 12, padding: 4, marginBottom: 14 }}>
        {[{ id: 'mpesa', label: 'M-Pesa' }, { id: 'card', label: 'Card' }].map(tab => (
          <button key={tab.id} onClick={() => { setPayMethod(tab.id); setMpesaStep('idle'); }}
            style={{
              flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: payMethod === tab.id ? COLORS.white : 'transparent',
              color: payMethod === tab.id ? COLORS.orange : COLORS.muted,
              boxShadow: payMethod === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>{tab.id === 'mpesa' ? '📱 ' : '💳 '}{tab.label}</button>
        ))}
      </div>

      {payMethod === 'mpesa' && (
        <div>
          {mpesaStep === 'idle' && (
            <>
              <label style={miniLabel}>M-Pesa phone number</label>
              <input placeholder="0712 345 678" value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.charcoal, background: COLORS.pearl, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
                inputMode="tel" />
              <button onClick={handleMpesa} style={{ ...primaryBtnStyle, marginBottom: 8 }}>
                Pay {formatKES(grandTotal)} via M-Pesa
              </button>
            </>
          )}
          {(mpesaStep === 'pending' || mpesaStep === 'polling') && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
              <p style={{ color: COLORS.charcoal, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{mpesaStep === 'pending' ? 'Sending to your phone...' : 'Waiting for payment...'}</p>
              <p style={{ color: COLORS.muted, fontSize: 13 }}>{mpesaMsg}</p>
            </div>
          )}
          {mpesaStep === 'error' && (
            <div>
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', marginBottom: 12, textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: 0 }}>Payment failed: {mpesaMsg}</p>
              </div>
              <button onClick={() => setMpesaStep('idle')} style={{ ...primaryBtnStyle }}>Try again</button>
            </div>
          )}
        </div>
      )}

      {payMethod === 'card' && (
        <div>
          <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
            Pay securely with your Visa, Mastercard, or Amex debit/credit card.
          </p>
          <button onClick={() => { if (!user) { alert('Please log in to book.'); return; } setShowCardForm(true); }} style={primaryBtnStyle}>
            Pay {formatKES(grandTotal)} by card
          </button>
        </div>
      )}

      <a href={`https://wa.me/${listing.hostPhone}?text=Hi, I'm interested in "${listing.title}" on LalaBnB`}
        target="_blank" rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 12, padding: '11px', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginTop: 10 }}>
        💬 Contact host via WhatsApp
      </a>
      <p style={{ color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
        Hosted by {listing.host} · M-Pesa and card accepted
      </p>
    </>
  );
}

function ConfirmedBanner({ listing, method }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.charcoal, marginBottom: 6 }}>Booking confirmed!</p>
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
        <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 14, margin: 0 }}>Payment received via {method === 'mpesa' ? 'M-Pesa' : 'card'}</p>
        <p style={{ color: '#15803d', fontSize: 12, margin: '4px 0 0' }}>A confirmation has been sent to your account</p>
      </div>
      <a href={`https://wa.me/${listing.hostPhone}?text=Hi ${listing.host}, I've just booked "${listing.title}" on LalaBnB!`}
        target="_blank" rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 12, padding: '11px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
        💬 Message your host
      </a>
    </div>
  );
}

function StepperBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: 'pointer', fontSize: 18, color: COLORS.charcoal }}>
      {children}
    </button>
  );
}

const miniLabel = { display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 };
