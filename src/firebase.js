// 1. ALL Imports must be at the top
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. Your specific configuration
const firebaseConfig = {
  apiKey: "AIzaSyCq_ru9z7QLUHqbnPYSLo1E7ednrooa8fE",
  authDomain: "lalakenya.firebaseapp.com",
  projectId: "lalakenya",
  storageBucket: "lalakenya.firebasestorage.app",
  messagingSenderId: "784207211756",
  appId: "1:784207211756:web:0d166d8178f1f42818c9c9",
  measurementId: "G-7DX26Z5CDS"
};

// 3. Initialize the App
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const analytics = getAnalytics(app);

// 4. EXPORT the tools for LalaBnB_5.jsx to use
export const auth = getAuth(app);
export const db = getFirestore(app);
