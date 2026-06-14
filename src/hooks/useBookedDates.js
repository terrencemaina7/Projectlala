import { useState, useEffect, useCallback } from 'react';

export const toKey = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
};

export const expandRange = (checkIn, checkOut) => {
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

const storageKey  = (id) => `booked_${id}`;
const bookingsKey = (id) => `bookings_${id}`;

const loadRanges = (listingId) => {
  try {
    // Load owner blocks
    const ownerBlocks = JSON.parse(
      localStorage.getItem(storageKey(listingId)) || '[]'
    );
    // Load guest bookings and convert to same shape
    const guestBookings = JSON.parse(
      localStorage.getItem(bookingsKey(listingId)) || '[]'
    ).map(b => ({ ...b, source: b.source || 'booking' }));

    // Merge — owner blocks first, then guest bookings
    return [...ownerBlocks, ...guestBookings];
  } catch {
    return [];
  }
};

const saveOwnerBlocks = (listingId, ranges) => {
  // Only persist owner_block entries to the owner storage key
  const ownerOnly = ranges.filter(r => r.source === 'owner_block');
  localStorage.setItem(storageKey(listingId), JSON.stringify(ownerOnly));
};

export function useBookedDates(listingId) {
  const [ranges,  setRanges]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    setRanges(loadRanges(listingId));
    setLoading(false);
  }, [listingId]);

  // All blocked date strings — what the calendar greys out
  const blockedDates = ranges.flatMap(r => {
    try { return expandRange(r.checkIn, r.checkOut); }
    catch { return []; }
  });

  // Add a range (owner block or booking)
  const addRange = useCallback(async ({
    checkIn, checkOut,
    source   = 'owner_block',
    note     = '',
    userId   = null,
    totalKES = null,
    method   = null,
  }) => {
    const id = `range_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const entry = {
      id,
      listingId: String(listingId),
      checkIn:   checkIn instanceof Date ? checkIn.toISOString() : checkIn,
      checkOut:  checkOut instanceof Date ? checkOut.toISOString() : checkOut,
      source,
      note,
      userId,
      totalKES,
      method,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...loadRanges(listingId)];
    saveOwnerBlocks(listingId, updated);
    setRanges(updated);
    return id;
  }, [listingId]);

  // Remove an owner block (guests cannot remove bookings)
  const removeRange = useCallback(async (id) => {
    const updated = loadRanges(listingId).filter(r => r.id !== id);
    saveOwnerBlocks(listingId, updated);
    setRanges(updated);
  }, [listingId]);

  // Shorthand used by PaymentPage to write a confirmed guest booking
  const bookDates = useCallback(async ({
    checkIn, checkOut, userId, totalKES, paymentMethod,
  }) => {
    const newDates = expandRange(checkIn, checkOut);
    // Optimistic UI
    setRanges(prev => {
      const entry = {
        id:        'bk_' + Date.now(),
        listingId: String(listingId),
        checkIn:   checkIn instanceof Date ? checkIn.toISOString() : checkIn,
        checkOut:  checkOut instanceof Date ? checkOut.toISOString() : checkOut,
        source:    'booking',
        userId:    userId || 'guest',
        totalKES,
        method:    paymentMethod,
        createdAt: new Date().toISOString(),
      };
      return [entry, ...prev];
    });
    // Persist to guest bookings key
    const key    = bookingsKey(listingId);
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const booking = {
      id:           'bk_' + Date.now(),
      listingId:    String(listingId),
      userId:       userId || 'guest',
      checkIn:      checkIn instanceof Date ? checkIn.toISOString() : checkIn,
      checkOut:     checkOut instanceof Date ? checkOut.toISOString() : checkOut,
      nights:       Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000),
      totalKES,
      paymentMethod,
      status:       'confirmed',
      source:       'booking',
      createdAt:    new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([booking, ...stored]));
    return booking;
  }, [listingId]);

  return { blockedDates, ranges, loading, addRange, removeRange, bookDates };
}