import React from 'react';
import { Activity, Radio, ShieldCheck, MapPin } from 'lucide-react';

interface HeartbeatIndicatorProps {
  role?: 'Manager' | 'Receptionist' | 'Admin';
  branch?: string;
  isDarkMode?: boolean;
  compact?: boolean;
  className?: string;
}

export const HeartbeatIndicator: React.FC<HeartbeatIndicatorProps> = ({
  role = 'Manager',
  branch,
  isDarkMode = false,
  compact = false,
  className = ''
}) => {
  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold ${
          isDarkMode 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        } ${className}`}
        title="Real-time heartbeat: Live & connected"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
        </span>
        <span className="text-[10px] tracking-wider uppercase font-bold">Live Pulse</span>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-2xl border p-3.5 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-emerald-950/30 to-emerald-950/10 border-emerald-900/40 text-emerald-300 shadow-sm' 
          : 'bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 border-emerald-200/80 text-emerald-900 shadow-xs'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Heartbeat
            </span>
          </div>
        </div>
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest ${
          isDarkMode 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        }`}>
          LIVE
        </span>
      </div>

      <p className={`text-[10px] leading-relaxed font-medium mb-3 ${
        isDarkMode ? 'text-zinc-400' : 'text-emerald-950/70'
      }`}>
        {role === 'Manager' 
          ? 'System is live, connected, and actively monitoring branch operations.' 
          : `Active branch synchronization & real-time monitoring enabled.`}
      </p>

      {/* Branch Monitoring Statuses */}
      <div className={`pt-2.5 border-t space-y-1.5 ${
        isDarkMode ? 'border-emerald-900/30' : 'border-emerald-200/60'
      }`}>
        {role === 'Manager' ? (
          <>
            <div className="flex items-center justify-between text-[10px]">
              <span className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Nabslodge Ayigya
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Syncing
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Nabslodge Annex
              </span>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Syncing
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {branch || 'Current'} Branch
            </span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Connected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
