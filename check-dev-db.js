import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc } from "firebase/firestore";
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
  const email = 'walitellem@gmail.com';
  const password = 'password123';
  
  console.log("Checking project:", config.projectId);
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log("Auth sign-in successful! UID:", cred.user.uid);
  } catch (e) {
    console.error("Auth sign-in failed:", e.code, e.message);
    if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
        console.log("Attempting to create the user in the dev DB...");
        try {
            const newCred = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Created user successfully! UID:", newCred.user.uid);
            
            await setDoc(doc(db, 'users', newCred.user.uid), {
                email: email,
                password: password,
                role: 'Receptionist',
                branch: 'Annex',
                name: 'Wali',
                status: 'Active',
                createdAt: new Date().toISOString()
            });
            console.log("Created user document in Firestore.");
        } catch (createErr) {
            console.error("Failed to create user:", createErr.message);
        }
    }
  }
  
  process.exit(0);
}
run();
