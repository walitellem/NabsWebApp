import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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

async function run() {
  try {
    const cred2 = await signInWithEmailAndPassword(auth, 'walitellem@gmail.com', 'nabslodge451');
    console.log("Success login as walitellem@gmail.com!");
  } catch (err) {
    console.error("Login as wali failed:", err.code);
  }
  process.exit(0);
}
run();
