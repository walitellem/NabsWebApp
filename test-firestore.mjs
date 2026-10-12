import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Connecting to project:", config.projectId);
    const q = query(collection(db, 'users'), limit(1));
    const snap = await getDocs(q);
    console.log("SUCCESS! Found users:", snap.size);
  } catch (err) {
    console.error("FIRESTORE ERROR:", err.code || err.message);
  }
}
run();
