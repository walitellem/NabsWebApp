import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  isDarkMode?: boolean;
  itemName?: string;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  isDarkMode = true,
  itemName = 'records',
  className = ''
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startRecord = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div
      className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors ${
        isDarkMode
          ? 'border-zinc-850/60 bg-zinc-900/40 text-zinc-400'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      } ${className}`}
    >
      {/* Left: Row summary & page size selector */}
      <div className="flex items-center gap-3">
        <span>
          Showing{' '}
          <strong className={isDarkMode ? 'text-zinc-200' : 'text-slate-900'}>
            {startRecord}
          </strong>{' '}
          to{' '}
          <strong className={isDarkMode ? 'text-zinc-200' : 'text-slate-900'}>
            {endRecord}
          </strong>{' '}
          of{' '}
          <strong className={isDarkMode ? 'text-zinc-200' : 'text-slate-900'}>
            {totalItems}
          </strong>{' '}
          {itemName}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[11px]">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium focus:outline-none border cursor-pointer ${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            safeCurrentPage <= 1
              ? 'opacity-40 cursor-not-allowed'
              : isDarkMode
              ? 'hover:bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer'
              : 'hover:bg-slate-200 border-slate-300 text-slate-800 cursor-pointer'
          }`}
        >
          First
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
          disabled={safeCurrentPage <= 1}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
            safeCurrentPage <= 1
              ? 'opacity-40 cursor-not-allowed'
              : isDarkMode
              ? 'hover:bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer'
              : 'hover:bg-slate-200 border-slate-300 text-slate-800 cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        <span className="px-2 font-mono text-xs">
          Page{' '}
          <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            {safeCurrentPage}
          </strong>{' '}
          of <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeCurrentPage + 1, totalPages))}
          disabled={safeCurrentPage >= totalPages}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
            safeCurrentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed'
              : isDarkMode
              ? 'hover:bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer'
              : 'hover:bg-slate-200 border-slate-300 text-slate-800 cursor-pointer'
          }`}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            safeCurrentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed'
              : isDarkMode
              ? 'hover:bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer'
              : 'hover:bg-slate-200 border-slate-300 text-slate-800 cursor-pointer'
          }`}
        >
          Last
        </button>
      </div>
    </div>
  );
};
