// ─── src/payment/mpesa.js ─────────────────────────────────────────────────────
// M-Pesa Daraja API — STK Push (Lipa Na M-Pesa Online)
//
// This module calls YOUR Express/Node backend which holds the Daraja secrets.
// Never call the Daraja API directly from the browser (exposes consumer key).
//
// Backend endpoint required:  POST /api/payments/mpesa/stkpush
// Backend endpoint required:  POST /api/payments/mpesa/status   (poll for result)
//
// Daraja docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4242';

/**
 * Trigger an STK Push prompt on the guest's phone.
 *
 * @param {object} params
 * @param {string} params.phone       - Guest phone in 254XXXXXXXXX format
 * @param {number} params.amount      - Amount in KES (must be a whole number)
 * @param {string} params.listingId   - Firestore listing document ID
 * @param {string} params.listingName - Human-readable property name (shown on phone)
 * @param {string} params.userId      - Firestore user UID (stored on booking record)
 * @returns {Promise<{ checkoutRequestId: string }>}
 */
export async function initiateMpesaPayment({ phone, amount, listingId, listingName, userId }) {
  // Normalise phone: strip leading 0 or + and ensure 254 prefix
  const normalised = phone
    .replace(/\s+/g, '')
    .replace(/^\+/, '')
    .replace(/^0/, '254');

  const res = await fetch(`${API_BASE}/mpesa/pay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone:       normalised,
      amount:      Math.round(amount),  // Daraja requires integer
      listingId,
      listingName,
      userId,
      // AccountReference shown to customer on M-Pesa prompt
      accountRef:  `LalaBnB-${listingId}`,
      description: `Booking: ${listingName}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'M-Pesa request failed. Please try again.');
  }

  return res.json(); // { checkoutRequestId, responseCode, customerMessage }
}

/**
 * Poll your backend to check whether the STK Push completed.
 * Call this every ~3 seconds after initiating, up to ~30 seconds.
 *
 * @param {string} checkoutRequestId - Returned by initiateMpesaPayment
 * @returns {Promise<{ status: 'pending' | 'success' | 'failed', message: string }>}
 */
export async function checkMpesaStatus(checkoutRequestId) {
  const res = await fetch(`${API_BASE}/mpesa/pay/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkoutRequestId }),
  });

  if (!res.ok) throw new Error('Status check failed');
  return res.json();
}

// ─── Express backend template (save as server/routes/mpesa.js) ────────────────
//
// const express  = require('express');
// const router   = express.Router();
// const axios    = require('axios');
//
// // Get OAuth token from Daraja
// async function getDarajaToken() {
//   const creds = Buffer.from(
//     `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
//   ).toString('base64');
//   const { data } = await axios.get(
//     'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
//     { headers: { Authorization: `Basic ${creds}` } }
//   );
//   return data.access_token;
// }
//
// router.post('/stkpush', async (req, res) => {
//   const token     = await getDarajaToken();
//   const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
//   const password  = Buffer.from(
//     process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
//   ).toString('base64');
//
//   const { data } = await axios.post(
//     'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
//     {
//       BusinessShortCode: process.env.MPESA_SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: 'CustomerPayBillOnline',
//       Amount: req.body.amount,
//       PartyA: req.body.phone,
//       PartyB: process.env.MPESA_SHORTCODE,
//       PhoneNumber: req.body.phone,
//       CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa/callback`,
//       AccountReference: req.body.accountRef,
//       TransactionDesc: req.body.description,
//     },
//     { headers: { Authorization: `Bearer ${token}` } }
//   );
//   res.json({ checkoutRequestId: data.CheckoutRequestID, ...data });
// });
//
// module.exports = router;
