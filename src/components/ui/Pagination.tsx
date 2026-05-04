'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  pageSize:   number;
  label?:     string;
  onChange:   (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, label = 'record', onChange }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const noun = total === 1 ? label : `${label}s`;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 px-4 py-3">
      <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
        Showing{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
        {' '}{noun}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-slate-400 dark:text-slate-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                page === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
