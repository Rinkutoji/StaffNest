const VARIANTS = {
  active: { bg: 'var(--success-soft)', text: 'var(--success)', label: 'Active' },
  inactive: { bg: 'var(--warning-soft)', text: 'var(--warning)', label: 'Inactive' },
  admin: { bg: 'var(--accent-soft)', text: 'var(--accent)', label: 'Admin' },
  hr: { bg: 'var(--success-soft)', text: 'var(--success)', label: 'HR' },
  employee: { bg: '#eef0f4', text: 'var(--ink-soft)', label: 'Employee' },
};

export default function Badge({ status, children }) {
  const variant = VARIANTS[status] || { bg: '#eef0f4', text: 'var(--ink-soft)', label: status };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: variant.bg, color: variant.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: variant.text }} />
      {children || variant.label}
    </span>
  );
}
