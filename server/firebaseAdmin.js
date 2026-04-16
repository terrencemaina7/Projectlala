import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// IMPORTANT: you'll use a service account key (next step)
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();