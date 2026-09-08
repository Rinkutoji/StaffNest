import { Check, X, Trash2, ClipboardX } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import { SkeletonTableRow } from '../common/Skeleton';
import { departmentColor } from '../../utils/departmentColors';
import { formatDate } from '../../utils/formatters';

const LEAVE_TYPE_LABEL = { annual: 'Annual', sick: 'Sick', unpaid: 'Unpaid', other: 'Other' };

const STATUS_STYLE = {
  pending: { bg: 'var(--warning-soft)', text: 'var(--warning)', label: 'Pending' },
  approved: { bg: 'var(--success-soft)', text: 'var(--success)', label: 'Approved' },
  rejected: { bg: 'var(--danger-soft)', text: 'var(--danger)', label: 'Rejected' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

export default function LeaveTable({ records, loading, canManage, canDelete, onApprove, onReject, onDelete }) {
  if (!loading && records.length === 0) {
    return <EmptyState icon={ClipboardX} title="No leave requests" description="Try a different filter, or submit a new leave request." />;
  }

  const showActionsColumn = canManage || canDelete;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Days</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {showActionsColumn && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={showActionsColumn ? 7 : 6} />)
            : records.map((r) => (
                <tr key={r.id} className="border-b transition hover:bg-black/[0.015]" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.full_name} imageFilename={r.profile_image} color={departmentColor(r.department_id)} size={32} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{r.full_name}</p>
                        <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{r.department_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }}>{LEAVE_TYPE_LABEL[r.leave_type]}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</td>
                  <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--ink)' }}>{r.days}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }} title={r.reason || ''}>{r.reason || '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  {showActionsColumn && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && r.status === 'pending' && (
                          <>
                            <button onClick={() => onApprove(r)} title="Approve" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--success)' }}>
                              <Check size={16} />
                            </button>
                            <button onClick={() => onReject(r)} title="Reject" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--danger)' }}>
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => onDelete(r)} title="Delete" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--ink-faint)' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}