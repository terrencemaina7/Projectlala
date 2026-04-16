import express from "express";
import axios from "axios";
import moment from "moment";
import { createBooking } from "../services/createBooking.js";

const router = express.Router();

// GET ACCESS TOKEN
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return res.data.access_token;
};

// STK PUSH ROUTE
router.post("/pay", async (req, res) => {
  try {
    let { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: "Missing phone or amount" });
    }

    phone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone;

    amount = Number(amount);

    const token = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE +
      process.env.MPESA_PASSKEY +
      timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "LalaBnB",
      TransactionDesc: "Booking Payment",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("MPESA RESPONSE:", response.data);

    return res.json(response.data);

  } catch (err) {
    console.error("MPESA ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message,
    });
  }
});

//CALLBACK ROUTE to handle M-Pesa responses
router.post("/callback", async (req, res) => {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return res.json({ received: true });
    }

    const metadata = callback?.CallbackMetadata?.Item || [];

    const amount = metadata.find(x => x.Name === "Amount")?.Value;
    const phone = metadata.find(x => x.Name === "PhoneNumber")?.Value;

    const success = callback?.ResultCode === 0;
    const { listingId, userId } = req.body;

    if (success) {
      await createBooking({
        userId: phone,
        listingId: "mpesa-booking",
        amount,
        paymentMethod: "mpesa",
        status: "paid",
        phone,
        tx_ref: callback?.CheckoutRequestID,
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;