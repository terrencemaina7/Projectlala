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
    let { phone, amount, listingId, userId } = req.body;

    if (!phone || !amount || !listingId || !userId) {
      return res.status(400).json({ error: "Missing required fields (phone, amount, listingId, userId)" });
    }

    // Normalize phone formatting
    phone = phone.startsWith("0") ? "254" + phone.slice(1) : phone;
    amount = Math.round(Number(amount)); // Safaricom expects an integer (no decimals)

    const token = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE +
      process.env.MPESA_PASSKEY +
      timestamp
    ).toString("base64");

    // Dynamic Callback URL safely binding tracking metadata into query params
    const callbackUrl = `${process.env.MPESA_CALLBACK_URL}?userId=${userId}&listingId=${listingId}`;

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl, // Passing the metadata embedded here
      AccountReference: `LalaBnB-${listingId.substring(0, 5)}`, // Must stay short per Daraja specs
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

// CALLBACK ROUTE (Handles asynchronous responses from Safaricom)
router.post("/callback", async (req, res) => {
  // 1. Acknowledge receipt to Safaricom immediately to avoid timeouts/retries
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    // Safaricom can send raw string streams depending on server parsing midllewares
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const callback = body?.Body?.stkCallback;

    if (!callback) return;

    // 2. Safely extract metadata fields from Safaricom's array structures
    const metadata = callback?.CallbackMetadata?.Item || [];
    const amount = metadata.find(x => x.Name === "Amount")?.Value;
    const phone = metadata.find(x => x.Name === "PhoneNumber")?.Value;
    const mpesaReceiptNumber = metadata.find(x => x.Name === "MpesaReceiptNumber")?.Value;

    const success = callback?.ResultCode === 0;

    // 3. Extract your tracking fields out of the incoming URL query structure
    const { listingId, userId } = req.query; 

    console.log(`Callback Event Status Success: ${success} | User: ${userId} | Listing: ${listingId}`);

    if (success && userId && listingId) {
      // Execute booking creation with accurate reference models
      await createBooking({
        userId: userId,       // Correctly mapped back to guest UID
        listingId: listingId, // Correctly mapped back to property listing document ID
        amount,
        paymentMethod: "mpesa",
        status: "paid",
        phone,
        tx_ref: mpesaReceiptNumber || callback?.CheckoutRequestID, // True M-Pesa receipt code
      });
    } else {
      console.warn(`Payment failed or missing query tracking metadata. ResultCode: ${callback?.ResultCode}`);
    }

  } catch (err) {
    console.error("Callback asynchronous processing error:", err);
  }
});

export default router;
