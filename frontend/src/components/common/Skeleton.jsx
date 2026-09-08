export function SkeletonLine({ width = '100%', height = 14 }) {
  return <div className="skeleton rounded-md" style={{ width, height }} />;
}

export function SkeletonCircle({ size = 40 }) {
  return <div className="skeleton flex-none rounded-full" style={{ width: size, height: size }} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <SkeletonLine width="40%" height={12} />
      <div className="mt-3">
        <SkeletonLine width="60%" height={28} />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <SkeletonLine width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}
