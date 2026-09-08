import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, limit, total, onPageChange, onLimitChange }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-1 py-4 sm:flex-row" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
        <span>
          Showing <strong style={{ color: 'var(--ink)' }}>{from}-{to}</strong> of{' '}
          <strong style={{ color: 'var(--ink)' }}>{total}</strong>
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-lg border px-2 py-1 text-sm outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
