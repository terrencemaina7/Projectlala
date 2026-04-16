// ─── ContactPage ─────────────────────────────────────────────────────────────
// Contact page with a message form and social / direct contact links.

import React, { useState } from 'react';
import { COLORS, inputStyle, primaryBtnStyle, labelStyle } from '../styles/theme';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    // TODO: POST to /api/contact or EmailJS / SendGrid
    console.log('Contact form submitted:', form);
    setSent(true);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>

        {/* ── Left: contact info ───────────────────────────────────── */}
        <div style={{ flex: '1 1 280px' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 40, color: COLORS.charcoal,
              marginBottom: 12, lineHeight: 1.1,
            }}
          >
            Get in touch
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            Have a question, partnership inquiry, or need help with your booking? We're here — reach us on any channel.
          </p>

          {/* Contact methods */}
          {CONTACT_ITEMS.map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24, marginTop: 2 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 2px' }}>
                  {item.label}
                </p>
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: COLORS.tuscanDark, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
                  >
                    {item.val}
                  </a>
                ) : (
                  <p style={{ color: COLORS.charcoal, fontSize: 15, margin: 0 }}>{item.val}</p>
                )}
              </div>
            </div>
          ))}

          {/* Social links */}
          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Follow us
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 20,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.charcoal, fontSize: 13,
                    textDecoration: 'none', background: COLORS.white,
                  }}
                >
                  <span>{s.icon}</span>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: message form ───────────────────────────────────── */}
        <div
          style={{
            flex: '1 1 360px',
            background: COLORS.pearl,
            borderRadius: 24, padding: 36,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {sent ? (
            <SuccessMessage onReset={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }} />
          ) : (
            <>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: COLORS.charcoal, marginBottom: 24 }}>
                Send us a message
              </h3>
              <label style={labelStyle}>Your name</label>
              <input
                placeholder="Wanjiku Kamau"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                placeholder="wanjiku@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
              <label style={labelStyle}>Message</label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <button onClick={handleSend} style={primaryBtnStyle}>
                Send message →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Data & local helpers ──────────────────────────────────────────────────────

const CONTACT_ITEMS = [
  { icon: '📧', label: 'Email',    val: 'lalakenyaprm@gmail.com',   link: 'mailto:lalakenyaprm@gmail.com' },
  { icon: '💬', label: 'WhatsApp', val: '+254 113 600 8455',       link: 'https://wa.me/254113608455' },
  { icon: '📍', label: 'Based in', val: 'Nairobi, Kenya',         link: null },
];

const SOCIAL_LINKS = [
  { icon: '📸', name: 'Instagram', url: 'https://instagram.com' },
  { icon: '🐦', name: 'X / Twitter', url: 'https://twitter.com' },
  { icon: '💬', name: 'WhatsApp',  url: 'https://wa.me/254700000000' },
];

function SuccessMessage({ onReset }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <p style={{ fontSize: 52, marginBottom: 16 }}>✉️</p>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: COLORS.charcoal, marginBottom: 8 }}>
        Message sent!
      </h3>
      <p style={{ color: COLORS.muted, lineHeight: 1.6, marginBottom: 24 }}>
        We'll get back to you within 24 hours via email or WhatsApp.
      </p>
      <button onClick={onReset} style={{ ...primaryBtnStyle, width: 'auto', padding: '10px 24px' }}>
        Send another message
      </button>
    </div>
  );
}
