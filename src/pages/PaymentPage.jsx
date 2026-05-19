// ─── PaymentPage.jsx ──────────────────────────────────────────────────────────
// Built on your existing shell — keeps your exact structure:
//   const [method, setMethod] = useState("")
//   {method === "mpesa" && <MpesaBox />}
//   {method === "flutterwave" && <FlutterwaveBox />}
// Both boxes are now fully built out with real UI + payment logic.

import { useState } from "react";
import { useApp } from "../context/AppContext";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  tuscanDark:  "#5C4425",
  tuscan:      "#8B6F47",
  pearl:       "#F8F6F0",
  pearlDark:   "#EDE9E0",
  pearlDeep:   "#DDD6C8",
  orange:      "#FF5E3A",
  charcoal:    "#2C1F0E",
  muted:       "#7A6A56",
  white:       "#FFFFFF",
  green:       "#16a34a",
  red:         "#ef4444",
  whatsapp:    "#25D366",
};

const fmt      = (n) => `KES ${Number(n).toLocaleString()}`;
const fmtShort = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

const formatCardNumber = (v) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const fieldLabel = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: C.muted, textTransform: "uppercase",
  letterSpacing: 0.8, marginBottom: 6,
};

const fieldInput = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1.5px solid ${C.pearlDeep}`, fontSize: 14,
  color: C.charcoal, background: C.pearlDark,
  outline: "none", boxSizing: "border-box",
};

const bigBtn = (disabled) => ({
  width: "100%", padding: "14px",
  background: disabled ? C.pearlDeep : C.orange,
  color: disabled ? C.muted : C.white,
  border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  letterSpacing: 0.3, transition: "background 0.15s",
});

// ── Loading spinner screen ────────────────────────────────────────────────────
function StatusScreen({ icon, title, body, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <p style={{ fontWeight: 700, fontSize: 16, color: C.charcoal, marginBottom: 8 }}>{title}</p>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: sub ? 6 : 0 }}>{body}</p>
      {sub && <p style={{ color: C.muted, fontSize: 12 }}>{sub}</p>}
    </div>
  );
}

// ── Booking summary card (right column) ───────────────────────────────────────
function BookingSummary({ booking }) {
  const { listing, checkIn, checkOut, nights, guests, subtotal, serviceFee, guestTotal, grandTotal } = booking;
  const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
  return (
    <div style={{ background: C.pearl, borderRadius: 20, border: `1px solid ${C.pearlDeep}`, overflow: "hidden" }}>
      {listing.images?.[0] && (
        <div style={{ paddingTop: "52%", position: "relative" }}>
          <img src={listing.images[0]} alt={listing.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ padding: "18px" }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px" }}>
          {listing.title}
        </p>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 14px" }}>📍 {listing.location}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[["Check-in", fmtShort(checkIn)], ["Check-out", fmtShort(checkOut)],
            ["Nights", `${nights} night${nights !== 1 ? "s" : ""}`],
            ["Guests", `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`]
          ].map(([l, v]) => (
            <div key={l} style={{ background: C.white, borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.pearlDeep}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>{l}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Price breakdown — guests see service fee */}
        <div style={{ borderTop: `1px solid ${C.pearlDeep}`, paddingTop: 12 }}>
          {[
            [`${fmt(listing.price)} × ${nights} night${nights !== 1 ? "s" : ""}`, fmt(subtotal)],
            ["Service fee (10%)", fmt(serviceFee)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>{l}</span>
              <span style={{ color: C.charcoal, fontSize: 13 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.pearlDeep}`, paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.charcoal }}>Total</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, color: C.tuscanDark }}>
              {fmt(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation screen ───────────────────────────────────────────────────────
function ConfirmationScreen({ booking, method }) {
  const { setPage } = useApp();
  const { listing, checkIn, checkOut, nights, guests, grandTotal } = booking;
  const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
  const methodLabel = method === "mpesa" ? "M-Pesa" : "Flutterwave card payment";

  return (
    <div style={{ textAlign: "center", maxWidth: 500, margin: "0 auto", padding: "20px 0" }}>
      <div style={{
        width: 88, height: 88, borderRadius: "50%",
        background: "#f0fdf4", border: "3px solid #86efac",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, margin: "0 auto 20px",
      }}>✅</div>

      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: C.charcoal, marginBottom: 6 }}>
        Booking Confirmed!
      </h2>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
        Payment of <strong style={{ color: C.charcoal }}>{fmt(grandTotal)}</strong> received via{" "}
        <strong>{methodLabel}</strong>. Your host has been notified.
      </p>

      <div style={{ background: C.pearl, borderRadius: 20, border: `1px solid ${C.pearlDeep}`, padding: "20px", textAlign: "left", marginBottom: 20 }}>
        {listing.images?.[0] && (
          <div style={{ borderRadius: 12, overflow: "hidden", paddingTop: "42%", position: "relative", marginBottom: 14 }}>
            <img src={listing.images[0]} alt={listing.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: C.charcoal, margin: "0 0 4px" }}>
          {listing.title}
        </p>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 14px" }}>📍 {listing.location}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["Check-in", fmtShort(checkIn)], ["Check-out", fmtShort(checkOut)],
            ["Nights", `${nights} night${nights !== 1 ? "s" : ""}`],
            ["Guests", `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}`]
          ].map(([l, v]) => (
            <div key={l} style={{ background: C.white, borderRadius: 8, padding: "8px 10px", border: `1px solid ${C.pearlDeep}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>{l}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <a
        href={`https://wa.me/${listing.hostPhone}?text=Hi ${listing.host}! I've just booked "${listing.title}" on LalaKenya 🏡 Check-in: ${fmtShort(checkIn)}, Check-out: ${fmtShort(checkOut)}`}
        target="_blank" rel="noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.whatsapp, color: C.white, borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 10 }}
      >
        💬 Message your host on WhatsApp
      </a>
      <button onClick={() => setPage("home")} style={{ ...bigBtn(false), background: "none", color: C.muted, border: `1px solid ${C.pearlDeep}` }}>
        ← Back to home
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MpesaBox — full M-Pesa STK Push form
// ─────────────────────────────────────────────────────────────────────────────
function MpesaBox({ grandTotal, user, onSuccess }) {
  const [phone, setPhone] = useState(user?.phone || "");
  const [step,  setStep]  = useState("idle"); // idle | sending | waiting | error
  const [error, setError] = useState("");

  const handlePay = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned) { setError("Please enter your M-Pesa phone number."); return; }
    setError("");
    setStep("sending");

    try {
      // ── Uncomment when your backend /api/payments/mpesa/stkpush is ready ──
      // const res = await fetch("/api/payments/mpesa/stkpush", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     phone: cleaned.replace(/^0/, "254").replace(/^\+/, ""),
      //     amount: Math.round(grandTotal),
      //     userId: user?.uid,
      //   }),
      // });
      // const { checkoutRequestId } = await res.json();
      // setStep("waiting");
      // let tries = 0;
      // const poll = setInterval(async () => {
      //   tries++;
      //   const r = await fetch("/api/payments/mpesa/status", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ checkoutRequestId }),
      //   }).then(x => x.json());
      //   if (r.status === "success") { clearInterval(poll); onSuccess("mpesa"); }
      //   else if (r.status === "failed" || tries >= 10) {
      //     clearInterval(poll); setStep("error");
      //     setError(r.message || "Payment cancelled or timed out. Please try again.");
      //   }
      // }, 3000);

      // ── Demo simulation — remove when backend is live ──────────────────────
      await new Promise(r => setTimeout(r, 1800));
      setStep("waiting");
      await new Promise(r => setTimeout(r, 2500));
      onSuccess("mpesa");

    } catch (e) {
      setStep("error");
      setError(e.message || "Something went wrong. Please try again.");
    }
  };

  if (step === "sending") return (
    <StatusScreen icon="📤" title="Sending request…"
      body="We're sending an M-Pesa prompt to your phone." />
  );

  if (step === "waiting") return (
    <StatusScreen icon="📱" title="Check your phone"
      body="An M-Pesa PIN prompt has been sent. Enter your PIN to complete payment."
      sub="Do not close this page." />
  );

  if (step === "error") return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
      <p style={{ color: C.red, fontWeight: 600, marginBottom: 16 }}>{error}</p>
      <button onClick={() => { setStep("idle"); setError(""); }} style={bigBtn(false)}>Try again</button>
    </div>
  );

  return (
    <div>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Enter your Safaricom number. You'll receive an STK Push prompt — enter your M-Pesa PIN to pay{" "}
        <strong style={{ color: C.charcoal }}>{fmt(grandTotal)}</strong>.
      </p>

      <label style={fieldLabel}>M-Pesa phone number</label>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <span style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 13, color: C.muted, pointerEvents: "none",
        }}>🇰🇪 +254</span>
        <input
          placeholder="712 345 678"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
          inputMode="tel"
          style={{ ...fieldInput, paddingLeft: 88, borderColor: error ? C.red : C.pearlDeep }}
        />
      </div>
      {error && <p style={{ color: C.red, fontSize: 12, margin: "0 0 12px" }}>⚠️ {error}</p>}

      <div style={{ display: "flex", gap: 8, margin: "14px 0 20px" }}>
        {["Safaricom", "M-Pesa"].map(n => (
          <span key={n} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#E6F7E6", color: C.green, fontWeight: 600, border: "1px solid #86efac" }}>
            ✓ {n}
          </span>
        ))}
      </div>

      <button onClick={handlePay} style={bigBtn(false)}>
        Pay {fmt(grandTotal)} via M-Pesa 📱
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FlutterwaveBox — card payment form (Flutterwave-ready)
// ─────────────────────────────────────────────────────────────────────────────
function FlutterwaveBox({ grandTotal, user, listing, onSuccess }) {
  const [form, setForm] = useState({ name: user?.name || "", number: "", expiry: "", cvc: "" });
  const [step, setStep] = useState("idle"); // idle | processing | error
  const [error, setError] = useState("");

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const allFilled =
    form.name.trim() &&
    form.number.replace(/\s/g, "").length === 16 &&
    form.expiry.length === 5 &&
    form.cvc.length >= 3;

  const handlePay = async () => {
    if (!allFilled) return;
    setStep("processing"); setError("");
    try {
      // ── Option A: Flutterwave Inline popup (easiest — uncomment when ready) ─
      // Add <script src="https://checkout.flutterwave.com/v3.js"></script>
      // to your public/index.html first, then:
      //
      // window.FlutterwaveCheckout({
      //   public_key: process.env.REACT_APP_FLW_PUBLIC_KEY,
      //   tx_ref:     "lala_" + Date.now(),
      //   amount:     grandTotal,
      //   currency:   "KES",
      //   payment_options: "card",
      //   customer: { email: user?.email, name: form.name },
      //   customizations: { title: "LalaKenya", description: listing?.title, logo: "/assets/logo.jpeg" },
      //   callback: res => {
      //     if (res.status === "successful") onSuccess("flutterwave");
      //     else { setStep("error"); setError("Payment was not completed. Please try again."); }
      //   },
      //   onclose: () => setStep("idle"),
      // });
      // return; // Flutterwave handles the rest

      // ── Option B: Backend API (uncomment when your server is ready) ─────────
      // const res = await fetch("/api/payments/card/flutterwave", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     amount:      grandTotal,
      //     currency:    "KES",
      //     card_number: form.number.replace(/\s/g, ""),
      //     cvv:         form.cvc,
      //     expiry_month: form.expiry.split("/")[0],
      //     expiry_year:  "20" + form.expiry.split("/")[1],
      //     fullname:    form.name,
      //     email:       user?.email,
      //     tx_ref:      "lala_" + Date.now(),
      //   }),
      // });
      // const data = await res.json();
      // if (data.status === "success") onSuccess("flutterwave");
      // else throw new Error(data.message);

      // ── Demo simulation — remove when Flutterwave is live ──────────────────
      await new Promise(r => setTimeout(r, 2200));
      onSuccess("flutterwave");

    } catch (e) {
      setStep("idle");
      setError(e.message || "Payment failed. Please check your card details.");
    }
  };

  if (step === "processing") return (
    <StatusScreen icon="💳" title="Processing payment…"
      body="Please wait while we securely process your card."
      sub="Do not close or refresh this page." />
  );

  return (
    <div>
      {/* Security badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #86efac" }}>
        <span style={{ fontSize: 20 }}>🔒</span>
        <div>
          <p style={{ fontSize: 12, color: C.green, fontWeight: 600, margin: 0 }}>Secured by Flutterwave</p>
          <p style={{ fontSize: 11, color: "#15803d", margin: 0 }}>256-bit SSL · PCI DSS compliant</p>
        </div>
      </div>

      {/* Accepted cards */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {["VISA", "Mastercard", "Amex", "Verve"].map(b => (
          <span key={b} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.pearlDeep}`, color: C.muted }}>{b}</span>
        ))}
      </div>

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabel}>Name on card</label>
        <input placeholder="Jane Wanjiru" value={form.name}
          onChange={e => f("name", e.target.value)} style={fieldInput} />
      </div>

      {/* Card number */}
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabel}>Card number</label>
        <div style={{ position: "relative" }}>
          <input
            placeholder="1234 5678 9012 3456"
            value={form.number}
            onChange={e => f("number", formatCardNumber(e.target.value))}
            inputMode="numeric"
            style={{ ...fieldInput, paddingRight: 44, letterSpacing: form.number ? 2 : 0 }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>💳</span>
        </div>
      </div>

      {/* Expiry + CVC */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div>
          <label style={fieldLabel}>Expiry (MM / YY)</label>
          <input placeholder="08 / 28" value={form.expiry} inputMode="numeric"
            onChange={e => f("expiry", formatExpiry(e.target.value))} style={fieldInput} />
        </div>
        <div>
          <label style={fieldLabel}>CVC / CVV</label>
          <input placeholder="•••" value={form.cvc} type="password" inputMode="numeric"
            onChange={e => f("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))} style={fieldInput} />
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
          <p style={{ color: C.red, fontSize: 13, margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      <button onClick={handlePay} disabled={!allFilled} style={bigBtn(!allFilled)}>
        Pay {fmt(grandTotal)} securely 🔒
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentPage — your original shell, now fully wired
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { bookingDetails, user, setPage } = useApp();

  // ── Your original state — kept exactly as you had it ─────────────────────
  const [method, setMethod] = useState("");

  // New: track confirmation
  const [confirmed, setConfirmed] = useState(false);
  const [paidWith,  setPaidWith]  = useState("");

  // ── Guard: no booking in progress ─────────────────────────────────────────
  if (!bookingDetails) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🏡</p>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: C.charcoal, marginBottom: 20 }}>
          No booking in progress
        </p>
        <button onClick={() => setPage("home")} style={bigBtn(false)}>Browse properties</button>
      </div>
    );
  }

  // ── Guard: must be logged in ───────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", maxWidth: 400, margin: "0 auto" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🔐</p>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: C.charcoal, marginBottom: 20 }}>
          Please log in to continue
        </p>
        <button onClick={() => setPage("detail")} style={bigBtn(false)}>← Back to property</button>
      </div>
    );
  }

  // ── Show confirmation screen after payment ────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <ConfirmationScreen booking={bookingDetails} method={paidWith} />
      </div>
    );
  }

  const { listing, grandTotal, guestTotal, subtotal, serviceFee } = bookingDetails;
  // grandTotal includes service fee — shown to guests and charged to payment processor
  const displayTotal = grandTotal || subtotal;

  const handleSuccess = (paymentMethod) => {
    setPaidWith(paymentMethod);
    setConfirmed(true);
  };

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.pearl, minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Back */}
        <button onClick={() => setPage("detail")} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, fontSize: 14, marginBottom: 28,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Back to property
        </button>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: C.charcoal, margin: "0 0 6px" }}>
            Choose Payment Method
          </h2>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            You're booking <strong>{listing.title}</strong> · Total: <strong style={{ color: C.tuscanDark }}>{fmt(displayTotal)}</strong>
          </p>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── LEFT: your original structure ────────────────────────── */}
          <div style={{ flex: "1 1 380px", minWidth: 0 }}>
            <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.pearlDeep}`, padding: 28, boxShadow: "0 4px 20px rgba(61,43,16,0.08)" }}>

              {/* ── Your original buttons ──────────────────────────────── */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <button
                  onClick={() => setMethod("mpesa")}
                  style={{
                    flex: 1, padding: "14px 10px", borderRadius: 14, cursor: "pointer",
                    border: `2px solid ${method === "mpesa" ? C.orange : C.pearlDeep}`,
                    background: method === "mpesa" ? C.orange + "12" : C.white,
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ fontSize: 26 }}>🇰🇪</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: method === "mpesa" ? C.orange : C.charcoal }}>
                    Pay with M-Pesa
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>Safaricom STK Push</span>
                </button>

                <button
                  onClick={() => setMethod("flutterwave")}
                  style={{
                    flex: 1, padding: "14px 10px", borderRadius: 14, cursor: "pointer",
                    border: `2px solid ${method === "flutterwave" ? C.orange : C.pearlDeep}`,
                    background: method === "flutterwave" ? C.orange + "12" : C.white,
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ fontSize: 26 }}>🌍</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: method === "flutterwave" ? C.orange : C.charcoal }}>
                    Pay with Card / Flutterwave
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>Visa · Mastercard · Amex</span>
                </button>
              </div>

              <hr style={{ border: "none", borderTop: `1px solid ${C.pearlDeep}`, marginBottom: 24 }} />

              {/* ── Your original conditional boxes ───────────────────── */}
              {!method && (
                <p style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "16px 0" }}>
                  Select a payment method above to continue
                </p>
              )}

              {method === "mpesa" && (
                <MpesaBox grandTotal={displayTotal} user={user} onSuccess={handleSuccess} />
              )}

              {method === "flutterwave" && (
                <FlutterwaveBox grandTotal={displayTotal} user={user} listing={listing} onSuccess={handleSuccess} />
              )}

              {method && (
                <p style={{ color: C.muted, fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
                  By completing this booking you agree to LalaKenya's{" "}
                  <span style={{ color: C.tuscan, cursor: "pointer" }}>Terms of Service</span>
                  {" "}and{" "}
                  <span style={{ color: C.tuscan, cursor: "pointer" }}>Cancellation Policy</span>.
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT: booking summary ─────────────────────────────────── */}
          <div style={{ width: 320, flexShrink: 0 }}>
            <BookingSummary booking={bookingDetails} />
            <a
              href={`https://wa.me/${listing.hostPhone}?text=Hi ${listing.host}, I'm completing my booking for "${listing.title}" on LalaKenya!`}
              target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.whatsapp, color: C.white, borderRadius: 12, padding: "12px", fontWeight: 600, fontSize: 14, textDecoration: "none", marginTop: 14 }}
            >
              💬 Message host before paying
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
