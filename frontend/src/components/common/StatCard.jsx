export default function StatCard({ icon: Icon, label, value, trend, accent = 'var(--accent)', accentSoft = 'var(--accent-soft)' }) {
  return (
    <div
      className="animate-fade-rise rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          {label}
        </p>
        <div
          className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
          style={{ background: accentSoft, color: accent }}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="font-display mt-2 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
        {value}
      </p>
      {trend && (
        <p className="mt-1 text-xs" style={{ color: 'var(--ink-soft)' }}>
          {trend}
        </p>
      )}
    </div>
  );
}
