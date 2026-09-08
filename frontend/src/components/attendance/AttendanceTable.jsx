import { Trash2, CalendarX2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import { SkeletonTableRow } from '../common/Skeleton';
import { departmentColor } from '../../utils/departmentColors';
import { formatDate } from '../../utils/formatters';

const STATUS_STYLE = {
  present: { bg: 'var(--success-soft)', text: 'var(--success)', label: 'Present' },
  late: { bg: 'var(--warning-soft)', text: 'var(--warning)', label: 'Late' },
  half_day: { bg: 'var(--accent-soft)', text: 'var(--accent)', label: 'Half Day' },
  absent: { bg: 'var(--danger-soft)', text: 'var(--danger)', label: 'Absent' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.present;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

export default function AttendanceTable({ records, loading, canManage, onDelete }) {
  if (!loading && records.length === 0) {
    return <EmptyState icon={CalendarX2} title="No attendance records" description="Try a different date or filter, or mark attendance for this day." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Check In</th>
            <th className="px-4 py-3 font-medium">Check Out</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={canManage ? 7 : 6} />)
            : records.map((r) => (
                <tr key={r.id} className="border-b transition hover:bg-black/[0.015]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.full_name} imageFilename={r.profile_image} color={departmentColor(r.department_id)} size={32} />
                      <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{r.full_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }}>{r.department_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(r.date)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--ink-soft)' }}>{r.check_in || '—'}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--ink-soft)' }}>{r.check_out || '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(r)}
                        aria-label="Delete"
                        className="rounded-lg p-1.5 transition hover:bg-black/5"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
