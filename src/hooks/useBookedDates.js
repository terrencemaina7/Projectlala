// ─── src/hooks/useBookedDates.js ──────────────────────────────────────────────
// Loads and writes booked date ranges for a single listing.
// Used by DetailPage (to block dates) and BookingCard (to write on confirm).
//
// Firestore structure:
//   bookings/{bookingId} → {
//     listingId, userId, checkIn, checkOut,
//     nights, totalKES, paymentMethod, status, createdAt
//   }
//
// To derive blocked dates we read all 'confirmed' bookings for a listingId
// and expand the date ranges into individual 'YYYY-MM-DD' strings.

import { useState, useEffect } from 'react';

// ── Uncomment when firebase.js is configured ─────────────────────────────────
// import { db } from '../firebase';
// import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const toKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Expand a checkIn → checkOut range into an array of 'YYYY-MM-DD' keys
const expandRange = (checkIn, checkOut) => {
  const dates  = [];
  const cursor = new Date(checkIn);
  cursor.setHours(0,0,0,0);
  const end = new Date(checkOut);
  end.setHours(0,0,0,0);
  while (cursor < end) {
    dates.push(toKey(new Date(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

/**
 * @param   {string|number} listingId
 * @returns {object} { blockedDates: string[], bookDates, loading }
 *
 * blockedDates  — array of 'YYYY-MM-DD' strings already booked
 * bookDates     — async fn(checkIn, checkOut, userId, totalKES, paymentMethod)
 *                 writes the booking and updates blockedDates locally
 * loading       — true while fetching from Firestore
 */
export function useBookedDates(listingId) {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }

    // ── Firestore live listener (uncomment when ready) ────────────────────
    // const q = query(
    //   collection(db, 'bookings'),
    //   where('listingId', '==', String(listingId)),
    //   where('status',    '==', 'confirmed'),
    // );
    // const unsub = onSnapshot(q, (snap) => {
    //   const allDates = [];
    //   snap.docs.forEach(doc => {
    //     const { checkIn, checkOut } = doc.data();
    //     allDates.push(...expandRange(new Date(checkIn), new Date(checkOut)));
    //   });
    //   setBlockedDates([...new Set(allDates)]);
    //   setLoading(false);
    // });
    // return () => unsub();

    // ── localStorage fallback (works immediately, no backend needed) ──────
    const stored = JSON.parse(localStorage.getItem(`bookings_${listingId}`) || '[]');
    const allDates = [];
    stored.forEach(b => {
      try {
        allDates.push(...expandRange(new Date(b.checkIn), new Date(b.checkOut)));
      } catch { /* ignore malformed */ }
    });
    setBlockedDates([...new Set(allDates)]);
    setLoading(false);
  }, [listingId]);

  /**
   * Write a confirmed booking.
   * Optimistically updates blockedDates immediately (no flicker).
   */
  const bookDates = async ({ checkIn, checkOut, userId, totalKES, paymentMethod }) => {
    const newDates = expandRange(checkIn, checkOut);

    // Optimistic UI update
    setBlockedDates(prev => [...new Set([...prev, ...newDates])]);

    // ── Firestore write (uncomment when ready) ────────────────────────────
    // await addDoc(collection(db, 'bookings'), {
    //   listingId:     String(listingId),
    //   userId,
    //   checkIn:       checkIn.toISOString(),
    //   checkOut:      checkOut.toISOString(),
    //   nights:        Math.round((checkOut - checkIn) / 86400000),
    //   totalKES,
    //   paymentMethod,
    //   status:        'confirmed',
    //   createdAt:     serverTimestamp(),
    // });

    // ── localStorage write ────────────────────────────────────────────────
    const key     = `bookings_${listingId}`;
    const stored  = JSON.parse(localStorage.getItem(key) || '[]');
    const booking = {
      id:            'bk_' + Date.now(),
      listingId:     String(listingId),
      userId:        userId || 'guest',
      checkIn:       checkIn.toISOString(),
      checkOut:      checkOut.toISOString(),
      nights:        Math.round((checkOut - checkIn) / 86400000),
      totalKES,
      paymentMethod,
      status:        'confirmed',
      createdAt:     new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([booking, ...stored]));
    return booking;
  };

  return { blockedDates, bookDates, loading };
}
