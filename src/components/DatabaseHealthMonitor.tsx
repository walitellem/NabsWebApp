import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../firebase';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function DatabaseHealthMonitor() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      title={isOnline ? 'Real-time database sync active' : 'Offline: operating on local storage cache'}
    >
      {isOnline ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">DB: Connected</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-medium text-amber-500">DB: Offline Cache</span>
        </>
      )}
    </div>
  );
}
