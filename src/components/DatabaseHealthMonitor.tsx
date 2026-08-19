import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function DatabaseHealthMonitor() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastPing, setLastPing] = useState<Date | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus('disconnected');
      return;
    }

    const pingDatabase = async () => {
      try {
        // Perform a lightweight read to verify connection
        await getDoc(doc(db, '_system_health_', 'ping'));
        setStatus('connected');
        setLastPing(new Date());
      } catch (error) {
        console.error("Database health ping failed:", error);
        setStatus('error');
      }
    };

    // Initial ping
    pingDatabase();

    // Ping every 30 seconds
    const interval = setInterval(pingDatabase, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 py-2">
        <XCircle className="w-4 h-4 text-zinc-400" />
        <span>Database: Local Mode</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 py-2 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200 cursor-help" 
      title={lastPing ? `Last connected: ${lastPing.toLocaleTimeString()}` : 'Connecting...'}
    >
      {status === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      {status === 'disconnected' && <XCircle className="w-4 h-4 text-zinc-400" />}
      {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
      <span className="font-medium">
        DB: {status === 'connected' ? 'Connected' : status === 'error' ? 'Connection Error' : 'Disconnected'}
      </span>
    </div>
  );
}
