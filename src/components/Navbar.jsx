// ─── Navbar.jsx ───────────────────────────────────────────────────────────────
// Sticky navigation. Firebase auth wired in.
// Logged-in users see a "Host Dashboard" link to manage their listing calendars.

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LISTINGS } from '../data/listings';

// ── Uncomment when firebase.js is configured ──────────────────────────────────
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
// } from 'firebase/auth';
// import { auth } from '../firebase';

const C = {
  tuscanDark:  '#5C4425',
  tuscan:      '#8B6F47',
  pearl:       '#F8F6F0',
  pearlDark:   '#EDE9E0',
  pearlDeep:   '#DDD6C8',
  orange:      '#FF5E3A',
  charcoal:    '#2C1F0E',
  muted:       '#7A6A56',
  white:       '#FFFFFF',
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  border: `1.5px solid ${C.pearlDeep}`, fontSize: 14,
  color: C.charcoal, background: C.pearlDark,
  marginBottom: 12, boxSizing: 'border-box', outline: 'none',
};

export default function Navbar() {
  const { page, setPage, user, setUser } = useApp();

  // User is a host if they have at least one listing OR are an admin
  // In production: match listing.hostUid === user.uid from Firestore
  // For demo: matches by name or email, or grants access to admins
  const isHost = user && (
    user.isAdmin ||
    LISTINGS.some(l =>
      l.host === user.name ||
      l.hostEmail === user.email ||
      l.hostPhone?.includes(user.phone || '__no_match__')
    )
  );
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const [form,      setForm]      = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loading,   setLoading]   = useState(false);

  // ── Firebase session persistence (uncomment when firebase.js is ready) ────
  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (firebaseUser) {
  //       const token = await firebaseUser.getIdTokenResult(true);
  //       setUser({
  //         name:    firebaseUser.displayName || firebaseUser.email.split('@')[0],
  //         email:   firebaseUser.email,
  //         uid:     firebaseUser.uid,
  //         isAdmin: token.claims.isAdmin === true,
  //       });
  //     } else {
  //       setUser(null);
  //     }
  //   });
  //   return () => unsub();
  // }, [setUser]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      // ── Firebase auth (uncomment when ready) ─────────────────────────────
      // let cred;
      // if (authModal === 'signup') {
      //   cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // } else {
      //   cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      // }
      // const token = await cred.user.getIdTokenResult(true);
      // setUser({ name: form.name || cred.user.email.split('@')[0],
      //   email: cred.user.email, uid: cred.user.uid,
      //   isAdmin: token.claims.isAdmin === true });

      // ── Demo auth (remove when Firebase is live) ──────────────────────────
      setUser({
        name:    form.name || form.email.split('@')[0],
        email:   form.email,
        uid:     'demo_' + Date.now(),
        isAdmin: form.email.includes('admin'),
      });

      setAuthModal(null);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      const msgs = {
        'auth/user-not-found':       'No account found with that email.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/invalid-credential':   'Email or password is incorrect.',
      };
      setAuthError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // await signOut(auth);   // uncomment when Firebase is live
    setUser(null);
    setPage('home');
  };

  const NAV_LINKS = [
    { label: 'Explore',       page: 'search'  },
    { label: 'List Property', page: 'list'    },
    { label: 'Contact',       page: 'contact' },
  ];

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <nav style={{
        position:       'sticky',
        top:            0,
        zIndex:         1000,
        background:     C.tuscanDark,
        borderBottom:   `1px solid rgba(255,255,255,0.1)`,
        padding:        '0 24px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        height:         64,
        boxShadow:      '0 2px 16px rgba(61,43,16,0.25)',
      }}>

        {/* Logo */}
        <button
          onClick={() => setPage('home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}
        >
          <img
            src="/assets/logo.jpeg"
            alt="Lala Kenya"
            style={{ height: 48, width: 'auto', objectFit: 'contain',
              borderRadius: 6, display: 'block' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* Fallback text logo if image not found */}
          <span style={{ fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 700, color: C.orange, letterSpacing: -0.5 }}
            onError={() => {}}>
            Lala<span style={{ color: '#C9A97A' }}>BnB</span>
          </span>
        </button>

        {/* Nav links + auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {NAV_LINKS.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              style={{
                background:   page === item.page ? 'rgba(255,255,255,0.12)' : 'none',
                border:       'none',
                cursor:       'pointer',
                padding:      '8px 14px',
                borderRadius: 20,
                fontSize:     14,
                fontWeight:   page === item.page ? 600 : 400,
                color:        page === item.page ? C.orange : 'rgba(255,255,255,0.82)',
                transition:   'all 0.2s',
                whiteSpace:   'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>

              {/* Host Dashboard — only hosts (users with listings) and admins */}
              {isHost && (
                <button
                  onClick={() => setPage('host')}
                  style={{
                    background:   page === 'host'
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(255,255,255,0.08)',
                    border:       '1px solid rgba(255,255,255,0.2)',
                    cursor:       'pointer',
                    padding:      '6px 14px',
                    borderRadius: 20,
                    fontSize:     13,
                    color:        page === 'host' ? C.orange : 'rgba(255,255,255,0.82)',
                    fontWeight:   page === 'host' ? 700 : 500,
                    whiteSpace:   'nowrap',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                  }}
                >
                  🏠 Host
                </button>
              )}

              {/* Admin Dashboard — admins only, sits next to Host button */}
              {user.isAdmin && (
                <button
                  onClick={() => setPage('admin')}
                  style={{
                    background:   page === 'admin' ? C.orange : 'rgba(255,94,58,0.2)',
                    border:       '1px solid rgba(255,94,58,0.4)',
                    cursor:       'pointer',
                    padding:      '6px 14px',
                    borderRadius: 20,
                    fontSize:     13,
                    color:        page === 'admin' ? C.white : C.orange,
                    fontWeight:   600,
                    whiteSpace:   'nowrap',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                  }}
                >
                  ⚙️ Admin
                </button>
              )}
              
              {/* Avatar */}
              <div style={{ width: 34, height: 34, borderRadius: '50%',
                background: C.orange, color: C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {user.name[0].toUpperCase()}
              </div>

              {/* Log out */}
              <button
                onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', padding: '6px 14px',
                  borderRadius: 20, fontSize: 13,
                  color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <button
                onClick={() => { setAuthModal('login'); setAuthError(''); }}
                style={{ background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer', padding: '8px 16px',
                  borderRadius: 20, fontSize: 14,
                  color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap' }}
              >
                Log in
              </button>
              <button
                onClick={() => { setAuthModal('signup'); setAuthError(''); }}
                style={{ background: C.orange, border: 'none',
                  cursor: 'pointer', padding: '8px 18px',
                  borderRadius: 20, fontSize: 14,
                  color: C.white, fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Auth modal ───────────────────────────────────────────────── */}
      {authModal && (
        <div
          onClick={() => setAuthModal(null)}
          style={{ position: 'fixed', inset: 0,
            background: 'rgba(61,43,16,0.6)',
            zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 24,
              padding: 40, width: '100%', maxWidth: 440,
              boxShadow: '0 24px 80px rgba(61,43,16,0.3)' }}
          >
            {/* Modal logo */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src="/assets/logo.jpeg" alt="Lala Kenya"
                style={{ height: 52, width: 'auto', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif",
              fontSize: 24, color: C.tuscanDark, marginBottom: 6, textAlign: 'center' }}>
              {authModal === 'login' ? 'Welcome back' : 'Join Lala Kenya'}
            </h2>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
              {authModal === 'login'
                ? 'Log in to book or manage your property'
                : 'Create an account to start exploring Kenya'}
            </p>

            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>⚠️ {authError}</p>
              </div>
            )}

            <form onSubmit={handleAuth}>
              {authModal === 'signup' && (
                <input required placeholder="Full name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle} />
              )}
              <input required type="email" placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle} />
              <input required type="password" placeholder="Password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle, marginBottom: 20 }} />
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px',
                  background: loading ? C.pearlDeep : C.tuscanDark,
                  color: loading ? C.muted : C.white,
                  border: 'none', borderRadius: 12, fontSize: 15,
                  fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading
                  ? 'Please wait…'
                  : authModal === 'login' ? 'Log in' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, marginTop: 16 }}>
              {authModal === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setAuthModal(authModal === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                style={{ background: 'none', border: 'none',
                  color: C.orange, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                {authModal === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
