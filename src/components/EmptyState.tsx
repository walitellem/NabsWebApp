import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isDarkMode?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  isDarkMode = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border transition-colors ${
        isDarkMode
          ? 'bg-zinc-900/40 border-zinc-800/60'
          : 'bg-slate-50 border-slate-200/60'
      }`}
    >
      {icon && (
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-2xl mb-4 transition-colors ${
            isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-500 shadow-xs'
          }`}
        >
          {icon}
        </div>
      )}
      
      <h4
        className={`text-sm font-bold tracking-tight mb-1.5 ${
          isDarkMode ? 'text-zinc-100' : 'text-slate-800'
        }`}
      >
        {title}
      </h4>
      
      <p
        className={`text-xs max-w-sm leading-relaxed mb-5 ${
          isDarkMode ? 'text-zinc-400' : 'text-slate-500'
        }`}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md hover:shadow-blue-500/10 active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
