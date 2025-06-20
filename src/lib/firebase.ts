import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully. Project ID:", app.options.projectId);
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== app.options.projectId) {
        console.warn(
            `POSSIBLE Firebase Project ID Mismatch: \n` +
            `.env NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n` +
            `Initialized app.options.projectId (from config object used): ${app.options.projectId}\n` +
            `Ensure these match the Firebase project you intend to use.`
        );
    }
  } catch (e: any) {
    console.error(
        "CRITICAL Error initializing Firebase app:", e.message, e, "\n" +
        "This usually means your firebaseConfig object in src/lib/firebase.ts has invalid values (e.g., incorrect format, typos from .env) " +
        "OR required fields are missing/undefined in the firebaseConfig object passed to initializeApp. " +
        "Please verify values from your Firebase project console (Project settings > General > Your apps > Web app > SDK setup and configuration) are correctly in your .env file " +
        "AND that they are being loaded into process.env."
    );
    // @ts-ignore
    app = null; // Indicate that app initialization failed
  }
} else {
  app = getApp();
  console.log("Existing Firebase app retrieved. Project ID:", app.options.projectId);
}

// Ensure app is initialized before trying to get services
// @ts-ignore
const auth = app ? getAuth(app) : null;
// @ts-ignore
const db = app ? getFirestore(app) : null;
if (db) {
    console.log("Firestore instance requested from Firebase app."); // Log Firestore instance creation
} else if (app) {
    console.error("Firestore instance could not be created from Firebase app, though app was initialized.");
} else {
    console.error("Firebase app was not initialized, so Firestore instance cannot be created.");
}
// @ts-ignore
const storage = app ? getStorage(app) : null;
// const functions = getFunctions(app); // Uncomment if you use Cloud Functions
// const messaging = getMessaging(app); // Uncomment if you use FCM

export { app, auth, db, storage /*, functions, messaging */ };
