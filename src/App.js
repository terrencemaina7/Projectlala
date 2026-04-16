// ─── App.js ───────────────────────────────────────────────────────────────────
// Root component. Wraps the whole app in AppProvider (global state), then
// renders Navbar → active page → Footer based on context.page value.

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import Navbar  from './components/Navbar';
import Footer  from './components/Footer';

// Pages
import HomePage    from './pages/HomePage';
import SearchPage  from './pages/SearchPage';
import DetailPage  from './pages/DetailPage';
import ListPage    from './pages/ListPage';
import ContactPage from './pages/ContactPage';
import AdminPage   from './pages/AdminPage';


// ── Inner shell (needs access to context) ────────────────────────────────────
function Shell() {
  const { page } = useApp();

  // Admin page has its own full-screen shell — no shared Navbar or Footer
  if (page === 'admin') return <AdminPage />;

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        background: '#FFFFFF',
        minHeight: '100vh',
        color: '#1A1A1A',
      }}
    >
      {/* Sticky top navigation — always visible on public pages */}
      <Navbar />

      {/* Page router — swap components based on page state */}
      {page === 'home'    && <HomePage    />}
      {page === 'search'  && <SearchPage  />}
      {page === 'detail'  && <DetailPage  />}
      {page === 'list'    && <ListPage    />}
      {page === 'contact' && <ContactPage />}

      {/* Footer hidden on detail page (mobile sticky bar takes that space) */}
      {page !== 'detail' && <Footer />}
    </div>
  );
}

// ── App root — provides global context then renders Shell ─────────────────────
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
