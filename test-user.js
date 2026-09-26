import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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
    const q = query(collection(db, 'users'), where('email', '==', 'sualahtellem@gmail.com'));
    const snap = await getDocs(q);
    console.log("Found users for sualahtellem@gmail.com:", snap.size);
    snap.forEach(doc => {
      console.log("Data:", doc.data());
    });
  } catch (err) {
    console.error("ERROR:", err.code || err.message);
  }
}
run();
