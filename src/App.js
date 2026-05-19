// ─── App.js ───────────────────────────────────────────────────────────────────
// Root component. Renders the correct page based on AppContext.page.

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import Navbar      from './components/Navbar';
import Footer      from './components/Footer';

import HomePage    from './pages/HomePage';
import SearchPage  from './pages/SearchPage';
import DetailPage  from './pages/DetailPage';
import PaymentPage from './pages/PaymentPage';   // ← new
import ListPage    from './pages/ListPage';
import ContactPage from './pages/ContactPage';
import AdminPage   from './pages/AdminPage';

function Shell() {
  const { page } = useApp();

  // Admin and Payment pages get their own full-screen layout
  if (page === 'admin')   return <AdminPage />;
  if (page === 'payment') return (
    <>
      <Navbar />
      <PaymentPage />
    </>
  );

  return (
    <div style={{ fontFamily:"'Helvetica Neue', Arial, sans-serif",
      background:'#F8F6F0', minHeight:'100vh', color:'#2C1F0E' }}>
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
