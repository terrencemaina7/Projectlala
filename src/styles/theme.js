// ─── LalaBnB Design Tokens ────────────────────────────────────────────────────
// Color hierarchy (updated):
//   PRIMARY   → Tuscan  (warm earthy brown — dominant backgrounds, nav, headers)
//   SECONDARY → Pearl White  (light warm surfaces, cards, page backgrounds)
//   TERTIARY  → Sunset Orange  (CTAs, accents, active states, buttons)

export const COLORS = {
  // ── Primary: Tuscan ────────────────────────────────────────────────────────
  tuscan:        '#8B6F47',   // mid-tone brand brown
  tuscanDark:    '#5C4425',   // navbar, footer, deep surfaces
  tuscanDeep:    '#3D2B10',   // text on light backgrounds
  tuscanMid:     '#7A5C35',   // hover states
  tuscanLight:   '#A68B5B',   // borders, dividers
  tuscanPale:    '#C9A97A',   // subtle tints

  // ── Secondary: Pearl White ─────────────────────────────────────────────────
  pearl:         '#F8F6F0',   // main page background
  pearlDark:     '#EDE9E0',   // card backgrounds, input fills
  pearlDeep:     '#DDD6C8',   // borders on light backgrounds
  white:         '#FFFFFF',   // pure white surfaces

  // ── Tertiary: Sunset Orange ────────────────────────────────────────────────
  orange:        '#FF5E3A',   // primary CTA buttons, active tabs
  orangeLight:   '#FF7A5C',   // hover
  orangeDark:    '#E04A28',   // pressed
  orangePale:    '#FFF0EC',   // very light tint backgrounds

  // ── Neutrals ───────────────────────────────────────────────────────────────
  charcoal:      '#2C1F0E',   // primary text (warm dark)
  muted:         '#7A6A56',   // secondary text
  mutedLight:    '#A89880',   // placeholder text
  border:        '#DDD6C8',   // default borders

  // ── Semantic ───────────────────────────────────────────────────────────────
  green:         '#2E7D32',
  star:          '#F59E0B',
  red:           '#DC2626',
};

// ─── Shared reusable inline style objects ────────────────────────────────────

export const inputStyle = {
  width:          '100%',
  padding:        '12px 16px',
  borderRadius:   12,
  border:         `1.5px solid ${COLORS.pearlDeep}`,
  fontSize:       14,
  color:          COLORS.charcoal,
  background:     COLORS.pearlDark,
  marginBottom:   12,
  boxSizing:      'border-box',
  outline:        'none',
};

export const primaryBtnStyle = {
  width:          '100%',
  padding:        '14px',
  background:     COLORS.orange,
  color:          '#fff',
  border:         'none',
  borderRadius:   12,
  fontSize:       15,
  fontWeight:     700,
  cursor:         'pointer',
  letterSpacing:  0.3,
};

export const labelStyle = {
  display:        'block',
  fontSize:       12,
  fontWeight:     700,
  color:          COLORS.muted,
  textTransform:  'uppercase',
  letterSpacing:  0.8,
  marginBottom:   6,
};

// ─── Utility ─────────────────────────────────────────────────────────────────
export const formatKES = (n) => `KES ${Number(n).toLocaleString()}`;
