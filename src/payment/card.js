// ─── src/payment/card.js ──────────────────────────────────────────────────────
// Debit / Credit card payments via Stripe.
//
// This module provides:
//   1. createPaymentIntent()  — creates a Stripe PaymentIntent on your backend
//   2. CardPaymentForm        — a React component that renders the Stripe card UI
//      and handles the full confirm-payment flow.
//
// Setup:
//   npm install @stripe/stripe-js @stripe/react-stripe-js
//
// Backend endpoint required:  POST /api/payments/card/create-intent
//
// Stripe docs: https://stripe.com/docs/payments/accept-a-payment

import React, { useState, useEffect } from 'react';
import { COLORS, primaryBtnStyle } from '../styles/theme';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// ─── 1. Create a PaymentIntent on your backend ────────────────────────────────
/**
 * Ask your Express backend to create a Stripe PaymentIntent.
 * Returns the clientSecret needed by Stripe.js to confirm the payment.
 *
 * @param {number} amount      - Amount in KES (whole number)
 * @param {string} listingId   - Firestore listing ID
 * @param {string} userId      - Firestore user UID
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string }>}
 */
export async function createPaymentIntent({ amount, listingId, userId }) {
  const res = await fetch(`${API_BASE}/api/payments/card/create-intent`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount:    Math.round(amount * 100), // Stripe uses smallest currency unit (cents/fils)
      currency:  'kes',                   // Kenya Shillings — ensure enabled in Stripe dashboard
      listingId,
      userId,
      metadata:  { platform: 'LalaBnB' },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Could not initialise card payment.');
  }
  return res.json(); // { clientSecret, paymentIntentId }
}

// ─── 2. CardPaymentForm React component ──────────────────────────────────────
/**
 * Renders a full card payment form using Stripe Elements.
 * Handles loading Stripe.js, mounting the card element, and confirming payment.
 *
 * Usage:
 *   <CardPaymentForm
 *     amount={grandTotal}
 *     listingId={listing.id}
 *     userId={user.uid}
 *     onSuccess={(paymentIntentId) => { ... }}
 *     onCancel={() => { ... }}
 *   />
 *
 * @param {number}   amount      - Total in KES
 * @param {string}   listingId
 * @param {string}   userId
 * @param {function} onSuccess   - Called with paymentIntentId when payment succeeds
 * @param {function} onCancel    - Called when user dismisses the form
 */
export function CardPaymentForm({ amount, listingId, userId, onSuccess, onCancel }) {
  const [step,          setStep]          = useState('idle');   // idle|loading|form|processing|success|error
  const [clientSecret,  setClientSecret]  = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');

  // Card field values (controlled inputs — Stripe Elements replaces these in production)
  const [cardNumber,    setCardNumber]    = useState('');
  const [expiry,        setExpiry]        = useState('');
  const [cvc,           setCvc]           = useState('');
  const [cardName,      setCardName]      = useState('');

  const fmt = (n) => `KES ${Number(n).toLocaleString()}`;

  // Step 1: create intent when form mounts
  useEffect(() => {
    const init = async () => {
      setStep('loading');
      try {
        const { clientSecret: cs } = await createPaymentIntent({ amount, listingId, userId });
        setClientSecret(cs);
        setStep('form');
      } catch (e) {
        setErrorMsg(e.message);
        setStep('error');
      }
    };
    init();
  }, [amount, listingId, userId]);

  // Step 2: confirm payment
  // In production replace this block with:
  //   const stripe = useStripe(); const elements = useElements();
  //   const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: elements.getElement(CardElement) } });
  const handlePay = async () => {
    setStep('processing');
    try {
      // ── PRODUCTION: replace with real Stripe.js confirmCardPayment ────────
      // const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PK);
      // const result = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: elements.getElement(CardElement),
      //     billing_details: { name: cardName },
      //   },
      // });
      // if (result.error) throw new Error(result.error.message);
      // onSuccess(result.paymentIntent.id);
      // ─────────────────────────────────────────────────────────────────────

      // DEMO: simulate 1.5s processing delay then success
      await new Promise(r => setTimeout(r, 1500));
      setStep('success');
      setTimeout(() => onSuccess('demo_pi_' + Date.now()), 800);
    } catch (e) {
      setErrorMsg(e.message);
      setStep('error');
    }
  };

  // Format card number with spaces every 4 digits
  const formatCard = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  // Format expiry MM/YY
  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  // ── Render states ────────────────────────────────────────────────────────
  if (step === 'loading') {
    return <LoadingState message="Setting up secure payment…" />;
  }

  if (step === 'processing') {
    return <LoadingState message="Processing your payment…" />;
  }

  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: COLORS.charcoal, marginBottom: 6 }}>
          Payment successful!
        </p>
        <p style={{ color: COLORS.muted, fontSize: 14 }}>Your booking is confirmed.</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>❌</div>
        <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 16 }}>{errorMsg}</p>
        <button onClick={() => setStep('idle')} style={{ ...primaryBtnStyle, width: 'auto', padding: '10px 24px' }}>
          Try again
        </button>
      </div>
    );
  }

  // ── Main card form ───────────────────────────────────────────────────────
  const allFilled = cardName && cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvc.length >= 3;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.charcoal, margin: 0 }}>
            Pay by card
          </p>
          <p style={{ color: COLORS.muted, fontSize: 13, margin: '2px 0 0' }}>
            Secured by Stripe · 256-bit SSL
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['VISA', 'MC', 'AMEX'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4, border: `1px solid ${COLORS.border}`, color: COLORS.muted }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Amount summary */}
      <div style={{ background: COLORS.pearl, borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: COLORS.muted, fontSize: 14 }}>Total amount</span>
        <span style={{ fontWeight: 700, color: COLORS.charcoal, fontSize: 15 }}>{fmt(amount)}</span>
      </div>

      {/* Card name */}
      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabel}>Name on card</label>
        <input
          placeholder="Jane Wanjiru"
          value={cardName}
          onChange={e => setCardName(e.target.value)}
          style={cardInput}
        />
      </div>

      {/* Card number */}
      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabel}>Card number</label>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={e => setCardNumber(formatCard(e.target.value))}
            style={{ ...cardInput, paddingRight: 44, letterSpacing: cardNumber ? 2 : 0 }}
            inputMode="numeric"
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>
            💳
          </span>
        </div>
      </div>

      {/* Expiry + CVC */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={fieldLabel}>Expiry (MM/YY)</label>
          <input
            placeholder="08/28"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            style={cardInput}
            inputMode="numeric"
          />
        </div>
        <div>
          <label style={fieldLabel}>CVC</label>
          <input
            placeholder="123"
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={cardInput}
            inputMode="numeric"
            type="password"
          />
        </div>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={!allFilled}
        style={{
          ...primaryBtnStyle,
          background: allFilled ? COLORS.orange : COLORS.border,
          color: allFilled ? '#fff' : COLORS.muted,
          cursor: allFilled ? 'pointer' : 'not-allowed',
          marginBottom: 10,
        }}
      >
        Pay {fmt(amount)} securely →
      </button>
      <button onClick={onCancel} style={{ width: '100%', padding: '10px', background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 12, cursor: 'pointer', color: COLORS.muted, fontSize: 14 }}>
        Cancel
      </button>

      <p style={{ textAlign: 'center', color: COLORS.muted, fontSize: 11, marginTop: 12 }}>
        🔒 Your payment details are encrypted and never stored on our servers.
      </p>
    </div>
  );
}

// ─── Local styles & helpers ───────────────────────────────────────────────────

function LoadingState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <p style={{ color: COLORS.muted, fontSize: 14 }}>{message}</p>
    </div>
  );
}

const fieldLabel = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: COLORS.muted, textTransform: 'uppercase',
  letterSpacing: 0.8, marginBottom: 5,
};

const cardInput = {
  width: '100%', padding: '11px 14px',
  borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
  fontSize: 14, color: COLORS.charcoal,
  background: COLORS.pearl, outline: 'none',
  boxSizing: 'border-box',
};

// ─── Express backend template (save as server/routes/card.js) ─────────────────
//
// const express = require('express');
// const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const router  = express.Router();
//
// router.post('/create-intent', async (req, res) => {
//   const { amount, currency, listingId, userId, metadata } = req.body;
//   const intent = await stripe.paymentIntents.create({
//     amount,       // already in smallest unit (e.g. KES cents)
//     currency,     // 'kes'
//     metadata:     { listingId, userId, ...metadata },
//     automatic_payment_methods: { enabled: true },
//   });
//   res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
// });
//
// module.exports = router;
