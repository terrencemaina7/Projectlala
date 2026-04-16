# 🏡 LalaBnB — Kenya's Airbnb-Style Booking Platform

A fully functional, mobile-optimised property booking web app built for the Kenyan market.
Features M-Pesa payments, WhatsApp host contact, Google Maps integration hooks, and an
earthy Tuscan / Sunset Orange design theme.

---

## 🚀 Quick Start (VS Code)

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher (`node -v` to check)
- npm v8+ (comes with Node)

### 1. Install dependencies
Open this folder in VS Code, then open the **integrated terminal** (`Ctrl + `` ` ``):

```bash
npm install
```

### 2. Start the development server
```bash
npm start
```

Your browser will automatically open **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
lalabnb/
├── public/
│   └── index.html              # HTML shell + Playfair Display font
│
├── src/
│   ├── index.js                # React DOM entry point
│   ├── App.js                  # Root component + page router
│   │
│   ├── context/
│   │   └── AppContext.js       # Global state (page, user, search, listing)
│   │
│   ├── data/
│   │   └── listings.js         # Seed data — 6 Kenyan properties
│   │
│   ├── styles/
│   │   └── theme.js            # Colors, shared inline styles, formatKES()
│   │
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.jsx          # Sticky nav + auth modal (login / signup)
│   │   ├── Footer.jsx          # Site-wide footer with link columns
│   │   ├── ListingCard.jsx     # Property card with image carousel
│   │   ├── BookingCard.jsx     # Night selector + M-Pesa booking widget
│   │   ├── FilterPanel.jsx     # Sidebar filters (region, price, amenities)
│   │   ├── StarRating.jsx      # ★ rating display
│   │   ├── Badge.jsx           # LalaVerified pill badge
│   │   └── AmenityIcon.jsx     # Amenity chip with emoji icon
│   │
│   └── pages/                  # One file per route
│       ├── HomePage.jsx        # Hero, collections, featured listings, CTA
│       ├── SearchPage.jsx      # Filters, sort, map toggle, listings grid
│       ├── DetailPage.jsx      # Gallery, amenities, map, reviews, booking
│       ├── ListPage.jsx        # Host property submission form
│       └── ContactPage.jsx     # Contact form + social links
│
└── package.json
```

---

## 🗺️ Pages

| Page | URL state | Description |
|---|---|---|
| Home | `home` | Hero search, collections, featured listings |
| Search | `search` | Filter & browse all properties |
| Property Detail | `detail` | Full listing view with booking |
| List Property | `list` | Host submission form |
| Contact | `contact` | Message form + social links |

> Navigation is managed via React Context (`AppContext`) — no React Router needed.
> To add URL-based routing, install `react-router-dom` and replace the page state switches.

---

## 🔌 Integrations (connect to go live)

### M-Pesa (Safaricom Daraja API)
In `src/components/BookingCard.jsx`, replace the `handleBook` simulation with:
```js
// STK Push — triggers M-Pesa prompt on guest's phone
const res = await fetch('/api/mpesa/stkpush', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: user.phone, amount: grandTotal, listing: listing.id }),
});
```
Backend route: `POST /api/mpesa/stkpush` using the [Daraja Node SDK](https://github.com/safaricom/mpesa-daraja-node-sdk).

### Google Maps
In `src/pages/DetailPage.jsx` and `src/pages/SearchPage.jsx`, replace the placeholder
`<div>` blocks with:
```jsx
<iframe
  title="map"
  width="100%"
  height="250"
  style={{ borderRadius: 16, border: 0 }}
  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${listing.lat},${listing.lng}`}
/>
```

### WhatsApp
Already wired! Every "Contact Host" button uses a `wa.me` deep link:
```
https://wa.me/{hostPhone}?text=Hi, I'm interested in "{listing.title}" on LalaBnB
```
Replace `hostPhone` values in `src/data/listings.js` with real host numbers.

### Firebase / Firestore (database)
Replace the static `LISTINGS` array in `src/data/listings.js`:
```js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';          // your firebase config

export async function fetchListings() {
  const snap = await getDocs(collection(db, 'listings'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

### Authentication
The login/signup modal in `src/components/Navbar.jsx` currently simulates auth.
Replace with Firebase Auth:
```js
import { signInWithEmailAndPassword } from 'firebase/auth';
await signInWithEmailAndPassword(auth, form.email, form.password);
```

---

## 🎨 Design System

All design tokens live in `src/styles/theme.js`:

| Token | Value | Usage |
|---|---|---|
| `COLORS.orange` | `#FF5E3A` | Primary CTA, accents |
| `COLORS.pearl` | `#F8F6F0` | Backgrounds, cards |
| `COLORS.tuscanDark` | `#6B5235` | Headers, host CTA section |
| `COLORS.charcoal` | `#1A1A1A` | Body text |
| `COLORS.muted` | `#6B6B6B` | Secondary text |
| Font | Playfair Display | Headings & logo |

---

## 🛠️ VS Code Extensions (recommended)

- **ES7+ React/Redux/React-Native snippets** — `rafce` shortcut for new components
- **Prettier** — auto-format on save
- **ESLint** — catch errors early
- **Auto Rename Tag** — sync JSX open/close tags

---

## 📦 Build for production

```bash
npm run build
```
Outputs a minified bundle to `build/`. Deploy to **Vercel**, **Netlify**, or **Firebase Hosting**:
```bash
# Vercel (easiest)
npx vercel

# Firebase Hosting
firebase deploy
```

---

## 🇰🇪 Kenyan Market Notes

- All prices displayed in **KES (Kenyan Shillings)**
- M-Pesa is the primary payment method — integrate Safaricom Daraja STK Push
- WhatsApp is the preferred communication channel for Kenyan hosts & guests
- Seed listings cover: Diani Beach, Westlands Nairobi, Naivasha, Mombasa Bamburi, Maasai Mara, Lamu Old Town

---

*Built with ❤️ for Kenya · LalaBnB © 2025*
