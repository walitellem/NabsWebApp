import React, { useEffect, useState } from 'react';
import { app, auth, db } from '../firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

export function AuthDiagnosticView({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    
    const runDiagnostics = async () => {
      try {
        addLog('--- STARTING FIREBASE DIAGNOSTICS ---');
        
        // Check 1: Environment Variables
        addLog('1. Checking Environment Variables...');
        const keys = [
          'VITE_FIREBASE_API_KEY',
          'VITE_FIREBASE_AUTH_DOMAIN',
          'VITE_FIREBASE_PROJECT_ID',
          'VITE_FIREBASE_STORAGE_BUCKET',
          'VITE_FIREBASE_MESSAGING_SENDER_ID',
          'VITE_FIREBASE_APP_ID'
        ];
        
        let missingKeys = 0;
        keys.forEach(key => {
          const val = import.meta.env[key];
          if (!val) {
            addLog(`❌ Missing: ${key}`);
            missingKeys++;
          } else {
            addLog(`✅ Present: ${key} (${val.substring(0, 5)}...)`);
          }
        });

        if (missingKeys > 0) {
          addLog(`❌ FAILED: ${missingKeys} environment variables are missing. Firebase will not work.`);
          return;
        }

        // Check 2: App Initialization
        addLog('\n2. Checking Firebase App State...');
        if (!app) {
          addLog('❌ FAILED: Firebase App instance is null.');
          return;
        }
        addLog(`✅ Firebase App initialized. Name: ${app.name}`);

        // Check 3: Current User Session
        addLog('\n3. Checking Current Auth Session...');
        if (!auth) {
          addLog('❌ FAILED: Firebase Auth module is null.');
        } else {
          const currentUser = auth.currentUser;
          if (currentUser) {
            addLog(`✅ Active session found: UID: ${currentUser.uid}, Email: ${currentUser.email}`);
          } else {
            addLog(`⚠️ No active session (User is signed out).`);
          }
        }

        // Check 4: Network Connectivity / Public Firestore Read
        addLog('\n4. Checking Firestore Network Connectivity...');
        try {
          if (!db) {
             addLog('❌ FAILED: Firestore instance is null.');
          } else {
             const testQuery = query(collection(db, 'users'), limit(1));
             addLog('Executing test query against "users" collection...');
             
             // Wrap in a Promise.race to prevent infinite hanging
             const fetchPromise = getDocs(testQuery);
             const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error('TIMEOUT_HANG')), 8000)
             );
             
             const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
             addLog(`✅ Firestore connection successful. Retrieved ${snap.size} documents.`);
          }
        } catch (fsErr: any) {
          addLog(`❌ Firestore Connection Failed: ${fsErr.message}`);
          addLog(`❌ Exact Error Code: ${fsErr.code || 'UNKNOWN_CODE'}`);
        }

        // Check 5: Explicit Authentication Test (with known creds)
        addLog('\n5. Performing explicit credential test (walitellem@gmail.com)...');
        try {
          const cred = await signInWithEmailAndPassword(auth, 'walitellem@gmail.com', 'password123');
          addLog(`✅ Auth Login Successful. UID: ${cred.user.uid}`);
        } catch (authErr: any) {
           addLog(`❌ Auth Login Failed: ${authErr.message}`);
           addLog(`❌ Exact Auth Error Code: ${authErr.code || 'UNKNOWN_CODE'}`);
        }

        addLog('\n--- DIAGNOSTICS COMPLETE ---');
      } catch (err: any) {
        addLog(`❌ CRITICAL FAILURE during diagnostics: ${err.message}`);
      } finally {
        if (mounted) setIsRunning(false);
      }
    };

    runDiagnostics();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 w-full max-w-3xl rounded-xl border border-zinc-700 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Connection Diagnostics</h2>
              <p className="text-xs text-zinc-400">Verifying transport layers and environment variables</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Log Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-black font-mono text-xs sm:text-sm text-green-400 space-y-1">
          {logs.map((log, i) => (
            <div key={`auth-log-${i}`} className={`
              ${log.includes('❌') ? 'text-red-400' : ''}
              ${log.includes('✅') ? 'text-emerald-400' : ''}
              ${log.includes('⚠️') ? 'text-amber-400' : ''}
              ${log.includes('---') ? 'text-zinc-500 font-bold mt-4' : ''}
            `}>
              {log}
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-zinc-500 mt-2">
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              Running tests...
            </div>
          )}
        </div>
        
        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end">
           <button
            onClick={() => {
               navigator.clipboard.writeText(logs.join('\n'));
               alert('Logs copied to clipboard');
            }}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
             Copy Logs
           </button>
        </div>
      </div>
    </div>
  );
}
