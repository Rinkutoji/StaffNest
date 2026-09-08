import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest employee' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'salary_high', label: 'Salary: High to Low' },
  { value: 'salary_low', label: 'Salary: Low to High' },
];

export default function EmployeeFilters({ filters, onChange, departments }) {
  const [showMore, setShowMore] = useState(false);

  function set(field, value) {
    onChange({ ...filters, [field]: value });
  }

  const activeExtra = filters.gender || filters.salary_min || filters.salary_max;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-faint)' }} />
          <input
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search by name, email or position…"
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>

        <select
          value={filters.department_id}
          onChange={(e) => set('department_id', e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-black/5"
          style={{
            borderColor: activeExtra ? 'var(--accent)' : 'var(--border)',
            color: activeExtra ? 'var(--accent)' : 'var(--ink)',
          }}
        >
          <SlidersHorizontal size={15} />
          More filters
        </button>
      </div>

      {showMore && (
        <div
          className="animate-fade-rise flex flex-wrap items-end gap-3 rounded-xl border p-3.5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-hover)' }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => set('gender', e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>Min salary</label>
            <input
              type="number"
              value={filters.salary_min}
              onChange={(e) => set('salary_min', e.target.value)}
              placeholder="$0"
              className="w-28 rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>Max salary</label>
            <input
              type="number"
              value={filters.salary_max}
              onChange={(e) => set('salary_max', e.target.value)}
              placeholder="No limit"
              className="w-28 rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            />
          </div>
          {activeExtra && (
            <button
              onClick={() => onChange({ ...filters, gender: '', salary_min: '', salary_max: '' })}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--danger)' }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
