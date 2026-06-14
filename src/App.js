// ─── App.js ───────────────────────────────────────────────────────────────────
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import Navbar         from './components/Navbar';
import Footer         from './components/Footer';
import HomePage       from './pages/HomePage';
import SearchPage     from './pages/SearchPage';
import DetailPage     from './pages/DetailPage';
import PaymentPage    from './pages/PaymentPage';
import ListPage       from './pages/ListPage';
import ContactPage    from './pages/ContactPage';
import AdminPage      from './pages/AdminPage';
import HostDashboard  from './pages/HostDashboard';   // ← new

function Shell() {
  const { page } = useApp();

  // Full-screen pages with no shared Navbar / Footer
  if (page === 'admin') return <AdminPage />;

  // Pages with Navbar but no Footer
  if (page === 'payment' || page === 'host') {
    return (
      <>
        <Navbar />
        {page === 'payment' && <PaymentPage />}
        {page === 'host'    && <HostDashboard />}
      </>
    );
  }

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif",
      background: '#F8F6F0', minHeight: '100vh', color: '#2C1F0E' }}>
      <Navbar />
      {page === 'home'    && <HomePage    />}
      {page === 'search'  && <SearchPage  />}
      {page === 'detail'  && <DetailPage  />}
      {page === 'list'    && <ListPage    />}
      {page === 'contact' && <ContactPage />}
      {page !== 'detail'  && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
