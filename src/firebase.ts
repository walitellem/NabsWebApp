import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, deleteDoc, setDoc, updateDoc, addDoc, DocumentReference, DocumentData, CollectionReference, SetOptions, runTransaction, doc, disableNetwork } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_API_KEY' && 
  firebaseConfig.apiKey !== '' && 
  firebaseConfig.apiKey !== 'undefined';

if (!isFirebaseConfigured) {
  console.info("Firebase environment variables not set. Application operating in local mode.");
} else {
  console.info("Firebase environment variables detected. Initializing with Project ID:", firebaseConfig.projectId);
}
console.debug("Firebase Auth Domain:", firebaseConfig.authDomain);

const activeConfig = isFirebaseConfigured ? firebaseConfig : {
  apiKey: "AIzaSyDemoLocalModePlaceholderKey12345678",
  authDomain: "nabslodge-demo.firebaseapp.com",
  projectId: "nabslodge-demo",
  storageBucket: "nabslodge-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890abcdef"
};

console.log("DEBUG: Initializing Firebase with config keys presence:", {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId
});

let app;
let dbInstance;

try {
  app = initializeApp(activeConfig);
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  console.log('Database Initialized Successfully');
} catch (error) {
  console.error('Firebase Initialization Failed:', error);
  throw error; // Re-throw to be caught by caller
}

export { app };
export const db = dbInstance;
export const auth = getAuth(app);

// Disable network sync if not configured to prevent background connection attempts
if (!isFirebaseConfigured) {
  // disableNetwork(db).catch(() => {});
}

export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export const handleFirestoreError = (err: any, op: OperationType, path: string) => {
  console.error(`Firestore error in ${op} at ${path}:`, err);
};

export const safeFirestoreOp = async <T>(
  op: () => Promise<T>,
  fallback: T,
  timeoutMs?: number // Deprecated, Firestore SDK handles its own connection states
): Promise<T> => {
  try {
    return await op();
  } catch (error) {
    console.error("Firestore operation failed:", error);
    return fallback;
  }
};

export const safeDeleteDoc = async (docRef: DocumentReference): Promise<void> => {
  try {
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore deleteDoc error:", error);
  }
};

const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = removeUndefined(obj[key]);
    }
  }
  return cleaned;
};

export const safeSetDoc = async (docRef: DocumentReference, data: DocumentData, options?: SetOptions): Promise<void> => {
  try {
    await setDoc(docRef, removeUndefined(data), options as any);
  } catch (error) {
    console.error("Firestore setDoc error:", error);
  }
};

export const safeUpdateDoc = async (docRef: DocumentReference, data: DocumentData): Promise<void> => {
  try {
    await updateDoc(docRef, removeUndefined(data));
  } catch (error) {
    console.error("Firestore updateDoc error:", error);
  }
};

export const safeAddDoc = async (collectionRef: CollectionReference, data: DocumentData): Promise<string> => {
  try {
    const docRef = await addDoc(collectionRef, removeUndefined(data));
    return docRef.id;
  } catch (error) {
    console.error("Firestore addDoc error:", error);
    return "";
  }
};

export const safeRunTransaction = async <T>(
  updateFn: (transaction: any) => Promise<T>
): Promise<T | null> => {
  try {
    return await runTransaction(db, updateFn);
  } catch (error) {
    console.error("Firestore transaction error:", error);
    return null;
  }
};
