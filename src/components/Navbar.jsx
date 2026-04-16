// ─── Navbar.jsx ───────────────────────────────────────────────────────────────
// Sticky top navigation.  Uses the Lala Kenya logo (public/assets/logo.jpeg)
// at top-left.  Firebase email/password authentication with isAdmin claim check.

import React, { useState, useEffect } from 'react';
import { COLORS, inputStyle, primaryBtnStyle } from '../styles/theme';
import { useApp } from '../context/AppContext';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Navbar() {
  const { page, setPage, user, setUser } = useApp();
  const [authModal, setAuthModal] = useState(null);
  const [form,      setForm]      = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loading,   setLoading]   = useState(false);

  // ── Persist Firebase session across page refreshes ────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult(true);
        setUser({
          name:    firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email:   firebaseUser.email,
          uid:     firebaseUser.uid,
          isAdmin: token.claims.isAdmin === true,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, [setUser]);

  // ── Login / Signup ────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      let cred;
      if (authModal === 'signup') {
        cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      } else {
        cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      const token = await cred.user.getIdTokenResult(true);
      setUser({
        name:    form.name || cred.user.email.split('@')[0],
        email:   cred.user.email,
        uid:     cred.user.uid,
        isAdmin: token.claims.isAdmin === true,
      });
      setAuthModal(null);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      const msgs = {
        'auth/user-not-found':       'No account found with that email.',
        'auth/wrong-password':       'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
        'auth/invalid-credential':   'Email or password is incorrect.',
      };
      setAuthError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
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
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <nav style={{
        position:       'sticky',
        top:            0,
        zIndex:         1000,
        background:     COLORS.tuscanDark,
        borderBottom:   `1px solid ${COLORS.tuscanMid}`,
        padding:        '0 28px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        height:         68,
        boxShadow:      '0 2px 16px rgba(61,43,16,0.25)',
      }}>

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => setPage('home')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 0,
            padding: 0, flexShrink: 0,
          }}
        >
          <img
            src="/assets/logo.jpeg"
            alt="Lala Kenya — Hospitality & Nature's Goodness"
            style={{
              height:       52,
              width:        'auto',
              objectFit:    'contain',
              borderRadius: 8,
              display:      'block',
            }}
          />
        </button>

        {/* ── Nav links ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              style={{
                background:   page === item.page ? 'rgba(255,255,255,0.12)' : 'none',
                border:       'none',
                cursor:       'pointer',
                padding:      '8px 16px',
                borderRadius: 20,
                fontSize:     14,
                fontWeight:   page === item.page ? 600 : 400,
                color:        page === item.page ? COLORS.orange : 'rgba(255,255,255,0.82)',
                transition:   'all 0.2s',
                whiteSpace:   'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}

          {/* ── Auth section ───────────────────────────────────────────── */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
              {user.isAdmin && (
                <button
                  onClick={() => setPage('admin')}
                  style={{
                    background:   page === 'admin' ? COLORS.orange : 'rgba(255,94,58,0.2)',
                    border:       `1px solid rgba(255,94,58,0.4)`,
                    cursor:       'pointer',
                    padding:      '6px 14px',
                    borderRadius: 20,
                    fontSize:     13,
                    color:        page === 'admin' ? '#fff' : COLORS.orange,
                    fontWeight:   600,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                    whiteSpace:   'nowrap',
                  }}
                >
                  ⚙️ Admin
                </button>
              )}
              {/* Avatar */}
              <div style={{
                width:          36,
                height:         36,
                borderRadius:   '50%',
                background:     COLORS.orange,
                color:          '#fff',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontWeight:     700,
                fontSize:       15,
                flexShrink:     0,
              }}>
                {user.name[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background:   'rgba(255,255,255,0.1)',
                  border:       '1px solid rgba(255,255,255,0.2)',
                  cursor:       'pointer',
                  padding:      '6px 14px',
                  borderRadius: 20,
                  fontSize:     13,
                  color:        'rgba(255,255,255,0.8)',
                  whiteSpace:   'nowrap',
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <button
                onClick={() => { setAuthModal('login'); setAuthError(''); }}
                style={{
                  background:   'rgba(255,255,255,0.1)',
                  border:       '1px solid rgba(255,255,255,0.25)',
                  cursor:       'pointer',
                  padding:      '8px 18px',
                  borderRadius: 20,
                  fontSize:     14,
                  color:        'rgba(255,255,255,0.9)',
                  whiteSpace:   'nowrap',
                }}
              >
                Log in
              </button>
              <button
                onClick={() => { setAuthModal('signup'); setAuthError(''); }}
                style={{
                  background:   COLORS.orange,
                  border:       'none',
                  cursor:       'pointer',
                  padding:      '8px 18px',
                  borderRadius: 20,
                  fontSize:     14,
                  color:        '#fff',
                  fontWeight:   600,
                  whiteSpace:   'nowrap',
                }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Auth modal ───────────────────────────────────────────────────── */}
      {authModal && (
        <div
          onClick={() => setAuthModal(null)}
          style={{
            position:        'fixed',
            inset:           0,
            background:      'rgba(61,43,16,0.6)',
            zIndex:          9999,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:   COLORS.white,
              borderRadius: 24,
              padding:      40,
              width:        '100%',
              maxWidth:     440,
              boxShadow:    '0 24px 80px rgba(61,43,16,0.3)',
            }}
          >
            {/* Modal logo */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src="/assets/logo.jpeg"
                alt="Lala Kenya"
                style={{ height: 56, width: 'auto', objectFit: 'contain' }}
              />
            </div>

            <h2 style={{
              fontFamily:    "'Playfair Display', serif",
              fontSize:      24,
              color:         COLORS.tuscanDark,
              marginBottom:  6,
              textAlign:     'center',
            }}>
              {authModal === 'login' ? 'Welcome back' : 'Join Lala Kenya'}
            </h2>
            <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
              {authModal === 'login'
                ? 'Log in to book your perfect getaway'
                : 'Create an account to start exploring Kenya'}
            </p>

            {/* Error */}
            {authError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>⚠️ {authError}</p>
              </div>
            )}

            <form onSubmit={handleAuth}>
              {authModal === 'signup' && (
                <input
                  required
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              )}
              <input
                required
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
              <input
                required
                type="password"
                placeholder="Password (min. 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle, marginBottom: 20 }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryBtnStyle,
                  background: COLORS.tuscanDark,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading
                  ? 'Please wait...'
                  : authModal === 'login' ? 'Log in' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: COLORS.muted, marginTop: 16 }}>
              {authModal === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setAuthModal(authModal === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                style={{ background: 'none', border: 'none', color: COLORS.orange, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                {authModal === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
