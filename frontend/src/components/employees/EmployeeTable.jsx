import { Eye, Pencil, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { SkeletonTableRow, SkeletonCircle, SkeletonLine } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { departmentColor } from '../../utils/departmentColors';

export default function EmployeeTable({ employees, loading, canManage, canDelete, onView, onEdit, onDelete }) {
  if (!loading && employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No employees found"
        description="Try adjusting your search or filters, or add a new employee to get started."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Salary</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={canManage ? 6 : 5} />)
              : employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b transition hover:bg-black/[0.015]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.full_name} imageFilename={emp.profile_image} color={departmentColor(emp.department_id)} size={36} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{emp.full_name}</p>
                          <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
                        <span className="h-1.5 w-1.5 rounded-full flex-none" style={{ background: departmentColor(emp.department_id) }} />
                        {emp.department_name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--ink-soft)' }}>{emp.position || '—'}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--ink)' }}>{formatCurrency(emp.salary)}</td>
                    <td className="px-4 py-3">
                      <Badge status={emp.status} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton icon={Eye} label="View" onClick={() => onView(emp)} />
                          <ActionButton icon={Pencil} label="Edit" onClick={() => onEdit(emp)} />
                          {canDelete && <ActionButton icon={Trash2} label="Delete" onClick={() => onDelete(emp)} danger />}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <SkeletonCircle size={40} />
                <div className="flex-1 space-y-2">
                  <SkeletonLine width="50%" />
                  <SkeletonLine width="30%" height={10} />
                </div>
              </div>
            ))
          : employees.map((emp) => (
              <div
                key={emp.id}
                className="rounded-xl border p-3.5"
                style={{ borderColor: 'var(--border)', borderLeft: `3px solid ${departmentColor(emp.department_id)}` }}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={emp.full_name} imageFilename={emp.profile_image} color={departmentColor(emp.department_id)} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{emp.full_name}</p>
                      <Badge status={emp.status} />
                    </div>
                    <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{emp.position || 'No position'} · {emp.department_name || 'Unassigned'}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-sm font-medium" style={{ color: 'var(--ink)' }}>{formatCurrency(emp.salary)}</span>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <ActionButton icon={Eye} label="View" onClick={() => onView(emp)} />
                          <ActionButton icon={Pencil} label="Edit" onClick={() => onEdit(emp)} />
                          {canDelete && <ActionButton icon={Trash2} label="Delete" onClick={() => onDelete(emp)} danger />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 transition hover:bg-black/5"
      style={{ color: danger ? 'var(--danger)' : 'var(--ink-soft)' }}
    >
      <Icon size={16} />
    </button>
  );
}