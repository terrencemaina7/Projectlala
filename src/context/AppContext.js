// ─── AppContext ───────────────────────────────────────────────────────────────
// Provides global app state (current page, selected listing, search query,
// and authenticated user) without prop-drilling through every component.
// Wrap <App /> with <AppProvider> so all children can consume the context.

import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useAnalytics } from '../hooks/useAnalytics'; // Uncomment after Firebase is configured

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [page, setPage] = useState('home');
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchQuery, setSearchQuery] = useState({});
  const [user, setUser] = useState(null);

  // Scroll to top whenever the user navigates to a new page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const navigate = (targetPage, extras = {}) => {
    if (extras.listing) setSelectedListing(extras.listing);
    if (extras.query) setSearchQuery(extras.query);
    setPage(targetPage);
  };

  return (
    <AppContext.Provider
      value={{
        page,
        setPage,
        navigate,
        selectedListing,
        setSelectedListing,
        searchQuery,
        setSearchQuery,
        user,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/** Custom hook — use this in any component instead of importing AppContext directly */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
