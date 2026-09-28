import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config();

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'walitellem@gmail.com', 'password123');
    console.log("Logged in");
    
    const collectionsToCheck = ['rooms', 'bookings', 'users', 'staff', 'ActivityCatalog'];
    for (const col of collectionsToCheck) {
        try {
            const snap = await getDocs(collection(db, col));
            console.log(`Collection ${col}: ${snap.size} documents`);
        } catch(e) {
            console.error(`Error fetching ${col}:`, e.code, e.message);
        }
    }
  } catch(e) {
      console.error("Login failed", e);
  }
  process.exit(0);
}
run();
