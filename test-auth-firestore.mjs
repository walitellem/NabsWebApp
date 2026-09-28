import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
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
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    console.log("Attempting login to project:", config.projectId);
    const userCred = await signInWithEmailAndPassword(auth, "sualahtellem@gmail.com", "password123").catch(async () => {
      return await signInWithEmailAndPassword(auth, "walitellem@gmail.com", "password123");
    });
    console.log("Logged in user UID:", userCred.user.uid, "Email:", userCred.user.email);
    
    // Test write
    const testDocRef = doc(db, "auditLogs", `test_write_${Date.now()}`);
    await setDoc(testDocRef, { test: true, timestamp: new Date().toISOString() });
    console.log("SUCCESSFULLY WRITTEN TO FIRESTORE!");
    
    // Clean up test write
    await deleteDoc(testDocRef);
    console.log("SUCCESSFULLY DELETED TEST DOC FROM FIRESTORE!");
  } catch (err) {
    console.error("AUTH/FIRESTORE ERROR:", err.code || err.message, err);
  }
  process.exit(0);
}

run();
