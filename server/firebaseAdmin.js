import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Load service account safely
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Initialize Firebase Admin FIRST
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore instance
export const db = admin.firestore();