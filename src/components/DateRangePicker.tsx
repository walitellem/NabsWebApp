import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  onClear,
  isDarkMode,
}) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Start Date */}
          <div className="flex-1 relative">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none ${
              isDarkMode ? 'text-zinc-500' : 'text-slate-400'
            }`}>
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChangeStart(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 border transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300'
              }`}
              placeholder="From Stay Date"
            />
            <span className={`absolute right-3 top-[-7px] px-1 text-[9px] font-mono uppercase font-bold tracking-wider ${
              isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
            }`}>
              From Date
            </span>
          </div>

          {/* Separator */}
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider text-center ${
            isDarkMode ? 'text-zinc-600' : 'text-slate-400'
          }`}>
            to
          </span>

          {/* End Date */}
          <div className="flex-1 relative">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none ${
              isDarkMode ? 'text-zinc-500' : 'text-slate-400'
            }`}>
              <Calendar className="w-4 h-4" />
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChangeEnd(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 border transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300'
              }`}
              placeholder="To Stay Date"
            />
            <span className={`absolute right-3 top-[-7px] px-1 text-[9px] font-mono uppercase font-bold tracking-wider ${
              isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
            }`}>
              To Date
            </span>
          </div>
        </div>

        {/* Clear Button / Reset Status */}
        <div className="flex items-center shrink-0">
          {(startDate || endDate) ? (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          ) : (
            <div className={`text-[11px] font-mono italic text-center sm:text-right px-2 ${
              isDarkMode ? 'text-zinc-550' : 'text-slate-400'
            }`}>
              Filtering Stay Duration
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
