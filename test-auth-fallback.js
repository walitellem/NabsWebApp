import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

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
  const email = 'walitellem@gmail.com';
  const password = 'password123';
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log("Auth sign-in successful!");
  } catch (e) {
    console.error("Auth sign-in failed:", e.code);
  }
  
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
        console.log("Firestore stored password:", snap.docs[0].data().password);
    } else {
        console.log("No user found in firestore");
    }
  } catch (e) {
    console.error("Firestore error:", e.message);
  }
  process.exit(0);
}
run();
