
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getFunctions } from 'firebase/functions'; // Uncomment if used
// import { getMessaging } from 'firebase/messaging'; // Uncomment if used

// console.log(
//   "Firebase Init: Checking NEXT_PUBLIC_FIREBASE_API_KEY directly. Value:",
//   process.env.NEXT_PUBLIC_FIREBASE_API_KEY
// );
// console.log(
//   "Firebase Init: Checking NEXT_PUBLIC_FIREBASE_PROJECT_ID directly. Value:",
//   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
// );


// const requiredEnvVars = [
//   "NEXT_PUBLIC_FIREBASE_API_KEY",
//   "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
//   "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
//   "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
//   "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
//   "NEXT_PUBLIC_FIREBASE_APP_ID",
//   // "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", // Often optional
// ];

// let firebaseConfigIsValid = true;

// console.log("Firebase Config Check: Starting environment variable validation...");

// // Log all NEXT_PUBLIC_ variables available to the client-side bundle
// const availableNextPublicEnvs: Record<string, string | undefined> = {};
// for (const key in process.env) {
//   if (key.startsWith("NEXT_PUBLIC_")) {
//     availableNextPublicEnvs[key] = process.env[key];
//   }
// }
// console.log("Firebase Config Check: Available NEXT_PUBLIC_ environment variables:", availableNextPublicEnvs);


// requiredEnvVars.forEach(envVar => {
//   if (!process.env[envVar]) {
//     console.error(
//       `CRITICAL Firebase Configuration Error: Missing ${envVar} in your .env file.\n` +
//       `Please ensure this is correctly set up with values from your Firebase project console.\n` +
//       `The app will likely not function correctly until this is provided.`
//     );
//     firebaseConfigIsValid = false;
//   } else {
//     // console.log(`Firebase Config: ${envVar} is present.`); // Optional: for verbose checking
//   }
// });

// if (!firebaseConfigIsValid) {
//   console.error(
//     "CRITICAL: Firebase configuration is incomplete due to missing environment variables. " +
//     "Please check your .env file in the project root and ensure all NEXT_PUBLIC_FIREBASE_... variables are correctly set. " +
//     "Remember to RESTART your Next.js development server after making changes to the .env file."
//   );
// }

const firebaseConfig = {
  apiKey: "AIzaSyBCaKxpplIteFEbD9MxSh9x1mSpQtW9Rv0",
  authDomain: "lokalearn-460a1.firebaseapp.com",
  projectId: "lokalearn-460a1",
  storageBucket: "lokalearn-460a1.firebasestorage.app",
  messagingSenderId: "986508240944",
  appId: "1:986508240944:web:c19d2e1e64323f1de1e5f5",
  measurementId: "G-C8N852QZ7Z"
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
