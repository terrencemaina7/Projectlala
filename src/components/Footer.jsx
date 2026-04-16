// ─── Footer.jsx ───────────────────────────────────────────────────────────────
// Site-wide footer — deep Tuscan background matching the navbar.

import React from 'react';
import { COLORS } from '../styles/theme';
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { setPage } = useApp();

  return (
    <footer style={{ background: COLORS.tuscanDark, color: 'rgba(255,255,255,0.75)', padding: '52px 28px 32px' }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 36, marginBottom: 44,
      }}>
        {/* Brand */}
        <div>
          <img
            src="/assets/logo.jpeg"
            alt="Lala Kenya"
            style={{ height: 52, width: 'auto', objectFit: 'contain', borderRadius: 8, marginBottom: 14 }}
          />
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginTop: 0 }}>
            Kenya's favourite platform for unique stays. Book with M-Pesa or card, explore with joy.
          </p>
          <p style={{ fontSize: 12, color: COLORS.orange, marginTop: 10, fontWeight: 600 }}>
            Hospitality & Nature's Goodness
          </p>
        </div>

        <FooterCol title="Explore"
          items={['Diani Beach','Nairobi','Naivasha','Lamu','Maasai Mara']}
          onItemClick={() => setPage('search')} />

        <FooterCol title="Hosting"
          items={['List your property','Host resources','Community','Insurance']}
          onItemClick={() => setPage('list')} />

        <FooterCol title="Support"
          items={['Help centre','Safety info','Cancellation policy','Contact us']}
          onItemClick={() => setPage('contact')} />
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: 22,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          © 2025 Lala Kenya · Built for Kenya 🇰🇪 · M-Pesa payments powered by Safaricom Daraja API
        </p>
        <div style={{ display: 'flex', gap: 18 }}>
          {['Privacy', 'Terms', 'Sitemap'].map((link) => (
            <button key={link} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {link}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items, onItemClick }) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14, color: COLORS.tuscanPale }}>
        {title}
      </p>
      {items.map((item) => (
        <button key={item} onClick={onItemClick} style={{
          display: 'block', background: 'none', border: 'none',
          cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
          fontSize: 13, padding: '4px 0', textAlign: 'left',
          transition: 'color 0.15s',
        }}>
          {item}
        </button>
      ))}
    </div>
  );
}
