import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function UnauthorizedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#e6eaf0] dark:bg-[#0d1527] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white dark:neu-raised-lg border border-zinc-200 dark:border-transparent shadow-xl">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">403 Forbidden</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Access Denied: Your current network IP address does not match the authorized IP address for your assigned branch. Please contact your manager to resolve this.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
