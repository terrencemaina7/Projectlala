import { useState } from "react";

export default function PaymentPage() {
  const [method, setMethod] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h2>Choose Payment Method</h2>

      <button onClick={() => setMethod("mpesa")}>
        Pay with M-Pesa 🇰🇪
      </button>

      <button onClick={() => setMethod("flutterwave")}>
        Pay with Card / Flutterwave 🌍
      </button>

      <hr />

      {method === "mpesa" && <MpesaBox />}
      {method === "flutterwave" && <FlutterwaveBox />}
    </div>
  );
}

function MpesaBox() {
  return <p>M-Pesa payment form goes here</p>;
}

function FlutterwaveBox() {
  return <p>Flutterwave checkout goes here</p>;
}