import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, initializeFirestore, collection, onSnapshot, query, where } from "firebase/firestore";
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
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function run() {
  await signInWithEmailAndPassword(auth, 'walitellem@gmail.com', 'password123');
  
  const roomsQ = query(collection(db, 'rooms'));
  onSnapshot(roomsQ, (snapshot) => {
    console.log("Rooms snapshot size:", snapshot.size);
  }, (err) => {
    console.error("Rooms snapshot error:", err);
  });
  
  const bookingsQ = query(collection(db, 'bookings'));
  onSnapshot(bookingsQ, (snapshot) => {
    console.log("Bookings snapshot size:", snapshot.size);
  }, (err) => {
    console.error("Bookings snapshot error:", err);
  });
  
  const logsQ = query(collection(db, 'auditLogs'), where('branch', '==', 'Annex'));
  onSnapshot(logsQ, (snapshot) => {
    console.log("Logs snapshot size:", snapshot.size);
  }, (err) => {
    console.error("Logs snapshot error:", err);
  });

  setTimeout(() => process.exit(0), 10000);
}
run();
