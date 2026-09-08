export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-display text-base font-semibold" style={{ color: 'var(--ink)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: 'var(--ink-soft)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
