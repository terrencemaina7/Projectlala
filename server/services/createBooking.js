import { db } from "../firebaseAdmin.js";

export const createBooking = async ({
  userId,
  listingId,
  amount,
  paymentMethod,
  status,
  phone,
}) => {
  const booking = {
    userId,
    listingId,
    amount,
    paymentMethod, // "mpesa" | "flutterwave"
    status,        // "paid" | "pending"
    phone,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection("bookings").add(booking);

  return docRef.id;
};