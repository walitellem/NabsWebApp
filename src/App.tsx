/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured, safeFirestoreOp } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { initializeDb } from './data';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { User } from './types';
import { AnimatePresence, motion } from 'motion/react';
import LoginPortal from './components/LoginPortal';
import ManagerDashboard from './components/ManagerDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import WelcomeView from './components/WelcomeView';
import { UnauthorizedPage } from './components/UnauthorizedPage';
import { ToastProvider } from './components/ToastContext';
import { LoadingProvider } from './components/LoadingContext';
import { LoadingOverlay } from './components/LoadingOverlay';
import GettingStartedModal from './components/GettingStartedModal';

export default function App() {
  const [activeView, setActiveView] = useState<'welcome' | 'dashboard'>('welcome');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nabslodge_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nabslodge_dark_mode');
    return saved === 'true';
  });
  const [dbConnectionLost, setDbConnectionLost] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const errorStr = event.error ? String(event.error) : '';
      if (
        msg.toLowerCase().includes('indexed database') || 
        msg.toLowerCase().includes('indexeddb') || 
        msg.toLowerCase().includes('database server lost') ||
        errorStr.toLowerCase().includes('indexed database') ||
        errorStr.toLowerCase().includes('indexeddb') ||
        errorStr.toLowerCase().includes('database server lost')
      ) {
        console.warn("Caught IndexedDB / browser database connection loss:", event);
        setDbConnectionLost(true);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason || '');
      if (
        msg.toLowerCase().includes('indexed database') || 
        msg.toLowerCase().includes('indexeddb') || 
        msg.toLowerCase().includes('database server lost') ||
        (reason && String(reason).toLowerCase().includes('indexed database')) ||
        (reason && String(reason).toLowerCase().includes('indexeddb')) ||
        (reason && String(reason).toLowerCase().includes('database server lost'))
      ) {
        console.warn("Caught unhandled promise rejection of database connection loss:", event);
        setDbConnectionLost(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    // Initialize the local mock database state on mount
    initializeDb();

    if (!isFirebaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    let unsubscribeAuth = () => {};
    let unsubUserDoc: (() => void) | null = null;
    try {
      // Firebase Auth State Observer Wrapper: Pull custom user profile from Firestore using user.uid
      unsubscribeAuth = onAuthStateChanged(
        auth, 
        async (firebaseUser) => {
          if (unsubUserDoc) {
            unsubUserDoc();
            unsubUserDoc = null;
          }

          if (firebaseUser) {
            try {
              const uid = firebaseUser.uid;
              const cleanEmail = (firebaseUser.email || '').toLowerCase().trim();
              console.log("DEBUG: App.tsx: Auth state changed, firebaseUser.uid:", uid, "email:", cleanEmail);
              
              let docId = uid;

              // 1. First, quickly locate the correct document ID for the user
              try {
                const userDocSnap = await safeFirestoreOp(() => getDoc(doc(db, 'users', uid)), null, 10000);
                if (userDocSnap?.exists()) {
                  docId = userDocSnap.id;
                } else if (cleanEmail) {
                  // Fallback query by email if doc by UID was created manually under another ID
                  const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
                  const qSnap = await safeFirestoreOp(() => getDocs(q), null, 10000);
                  if (qSnap && !qSnap.empty) {
                    docId = qSnap.docs[0].id;
                  }
                }
              } catch (fsErr) {
                console.warn("Firestore user fetch error in App.tsx observer:", fsErr);
              }

              // 2. Establish a real-time snapshot listener on the user's Firestore document
              unsubUserDoc = onSnapshot(doc(db, 'users', docId), async (snapshot) => {
                try {
                  const docData = snapshot.exists() ? snapshot.data() : null;

                  // Also check local database users fallback
                  const { getUsers } = await import('./data');
                  const localUsers = getUsers();
                  const localMatch = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

                  const rawStatus = docData?.status || docData?.Status || localMatch?.status || 'Active';
                  const statusStr = String(rawStatus).trim().toLowerCase();
                  if (statusStr === 'inactive' || statusStr === 'disabled') {
                    await signOut(auth).catch(() => {});
                    setCurrentUser(null);
                    localStorage.removeItem('nabslodge_active_session');
                    setIsAuthReady(true);
                    return;
                  }

                  const rawRole = docData?.role || docData?.Role || localMatch?.role;
                  const roleStr = String(rawRole || '').trim().toLowerCase();
                  const localRoleStr = String(localMatch?.role || '').trim().toLowerCase();

                  const isManagerRole = 
                    roleStr === 'manager' || 
                    localRoleStr === 'manager' ||
                    cleanEmail.includes('manager') || 
                    cleanEmail === 'sualahtellem@gmail.com' ||
                    cleanEmail.startsWith('admin');

                  const finalRole: User['role'] = isManagerRole ? 'Manager' : 'Receptionist';

                  const userProfile: User = {
                    id: docId || localMatch?.id || uid,
                    email: firebaseUser.email || docData?.email || localMatch?.email || '',
                    name: docData?.name || docData?.Name || localMatch?.name || firebaseUser.displayName || (isManagerRole ? 'Manager' : 'Receptionist'),
                    role: finalRole,
                    branch: finalRole === 'Manager' ? undefined : (docData?.branch || docData?.Branch || localMatch?.branch || 'Annex'),
                    status: rawStatus,
                    createdAt: docData?.createdAt || localMatch?.createdAt || new Date().toISOString(),
                    lastShiftReset: docData?.lastShiftReset || localMatch?.lastShiftReset
                  };

                  setCurrentUser(userProfile);
                  localStorage.setItem('nabslodge_active_session', JSON.stringify(userProfile));
                  setIsAuthReady(true);
                } catch (snapErr) {
                  console.warn("Error processing user doc snapshot update:", snapErr);
                  setIsAuthReady(true);
                }
              }, (snapErr) => {
                console.warn("User document onSnapshot subscription error:", snapErr);
                setIsAuthReady(true);
              });

            } catch (err) {
              console.warn("Auth observer profile sync note:", err);
              setIsAuthReady(true);
            }
          } else {
            // User is logged out
            setCurrentUser(null);
            localStorage.removeItem('nabslodge_active_session');
            setIsAuthReady(true);
          }
        },
        (error) => {
          console.warn("Firebase Auth state observer caught error:", error);
          setIsAuthReady(true);
        }
      );
    } catch (err) {
      console.warn("Firebase Auth setup error:", err);
      setIsAuthReady(true);
    }
    
    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const seen = localStorage.getItem(`nabslodge_tutorial_seen_${currentUser.id}`);
      if (!seen) {
        setIsTutorialOpen(true);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem('nabslodge_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsForbidden(false);
    localStorage.setItem('nabslodge_active_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('welcome');
    localStorage.removeItem('nabslodge_active_session');
  };

  const handleForbidden = () => {
    setIsForbidden(true);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  if (dbConnectionLost) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-6 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl flex flex-col items-center text-center space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
            <AlertCircle className="w-8 h-8 animate-pulse" />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold">Local Database Connection Lost</h2>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
              Your browser's connection to the local database server (IndexedDB) was interrupted. This typically occurs when browser tabs remain inactive in the background or in secure preview iframes.
            </p>
          </div>

          <div className="w-full pt-2 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Application
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  if (window.indexedDB) {
                    const projId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nabslodge';
                    window.indexedDB.deleteDatabase(`firestore/[DEFAULT]/${projId}/main`);
                    window.indexedDB.deleteDatabase('firestore');
                  }
                } catch (e) {
                  console.error(e);
                }
                window.location.reload();
              }}
              className={`w-full py-2 px-4 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                isDarkMode 
                  ? 'border-slate-800 hover:bg-slate-800 text-zinc-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              Reset Cache & Force Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200 min-h-screen w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <LoadingProvider>
        <AnimatePresence mode="wait">
          {isForbidden ? (
            <motion.div
              key="unauthorized"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <UnauthorizedPage onBack={() => setIsForbidden(false)} />
            </motion.div>
          ) : !currentUser ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <LoginPortal 
                onLoginSuccess={handleLoginSuccess} 
                onForbidden={handleForbidden}
                isDarkMode={isDarkMode} 
                onToggleTheme={toggleTheme} 
              />
            </motion.div>
          ) : activeView === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <WelcomeView 
                currentUser={currentUser}
                onLogout={handleLogout}
                onGoToDashboard={() => setActiveView('dashboard')}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          ) : currentUser.role === 'Manager' ? (
            <motion.div
              key="manager"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <ManagerDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                isDarkMode={isDarkMode} 
                onToggleTheme={toggleTheme} 
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="receptionist"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <ReceptionistDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                isDarkMode={isDarkMode} 
                onToggleTheme={toggleTheme} 
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {currentUser && (
          <GettingStartedModal 
            isOpen={isTutorialOpen} 
            onClose={() => setIsTutorialOpen(false)} 
            currentUser={currentUser} 
            isDarkMode={isDarkMode} 
          />
        )}
      </LoadingProvider>
    </ToastProvider>
  );
}
