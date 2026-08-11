import React from 'react';
import { useLoading } from './LoadingContext';

export const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">Processing...</span>
      </div>
    </div>
  );
};
