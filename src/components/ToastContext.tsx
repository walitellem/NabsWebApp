/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';
import { generateKey } from '../utils/keyGenerator';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    description?: string,
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    description?: string,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, description, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast, idx) => (
          <ToastItem key={generateKey(toast.id, idx, 'toast')} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: string;
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, message, description, type, duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/20 dark:border-emerald-500/30',
    info: 'border-blue-500/20 dark:border-blue-500/30',
    warning: 'border-amber-500/20 dark:border-amber-500/30',
    error: 'border-red-500/20 dark:border-red-500/30',
  };

  const bgColors = {
    success: 'bg-white dark:bg-zinc-900',
    info: 'bg-white dark:bg-zinc-900',
    warning: 'bg-white dark:bg-zinc-900',
    error: 'bg-white dark:bg-zinc-900',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`pointer-events-auto border rounded-2xl shadow-xl flex gap-3 p-4 relative overflow-hidden backdrop-blur-md transition-colors ${bgColors[type]} ${borderColors[type]}`}
    >
      <div className="flex gap-3 items-start w-full pr-6">
        {icons[type]}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-950 dark:text-zinc-50 leading-tight">
            {message}
          </h4>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-sans leading-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="absolute top-3.5 right-3.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Countdown progress line */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-1 ${
          type === 'success'
            ? 'bg-emerald-500'
            : type === 'info'
            ? 'bg-blue-500'
            : type === 'warning'
            ? 'bg-amber-500'
            : 'bg-red-500'
        }`}
      />
    </motion.div>
  );
}
