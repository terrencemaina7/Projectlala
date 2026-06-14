// ─── AppContext.js ────────────────────────────────────────────────────────────
// Global state. bookingDetails carries everything from DetailPage to PaymentPage.

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [page,           setPage]           = useState('home');
  const [selectedListing,setSelectedListing]= useState(null);
  const [searchQuery,    setSearchQuery]    = useState({});
  const [user,           setUser]           = useState(null);

  // ⬇️ ADDED THESE TWO STATES BACK IN ⬇️
  const [searchDates,    setSearchDates]    = useState({ startDate: null, endDate: null });
  const [searchGuests,   setSearchGuests]   = useState(1);

  // ── Booking details passed from DetailPage → PaymentPage ─────────────────
  // Shape: { listing, checkIn, checkOut, nights, guests, subtotal, serviceFee, grandTotal }
  const [bookingDetails, setBookingDetails] = useState(null);

  // Scroll to top on every page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const navigate = (targetPage, extras = {}) => {
    if (extras.listing)       setSelectedListing(extras.listing);
    if (extras.query)         setSearchQuery(extras.query);
    if (extras.bookingDetails)setBookingDetails(extras.bookingDetails);
    setPage(targetPage);
  };

  return (
    <AppContext.Provider value={{
      page, setPage, navigate,
      selectedListing, setSelectedListing,
      searchQuery,     setSearchQuery,
      user,            setUser,
      bookingDetails,  setBookingDetails,
      
      // ⬇️ EXPORTED THE VARIABLES AND SETTERS HERE ⬇️
      searchDates,     setSearchDates,
      searchGuests,    setSearchGuests,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
