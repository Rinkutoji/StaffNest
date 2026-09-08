import { useState } from 'react';
import { Pencil, CheckCircle2, Trash2, Wallet } from 'lucide-react';
import Avatar from '../common/Avatar';
import EmptyState from '../common/EmptyState';
import { SkeletonTableRow } from '../common/Skeleton';
import { departmentColor } from '../../utils/departmentColors';
import { formatCurrency } from '../../utils/formatters';

export default function PayrollTable({ records, loading, canManage, canDelete, onSaveAdjustment, onMarkPaid, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');

  if (!loading && records.length === 0) {
    return <EmptyState icon={Wallet} title="No payroll records for this month" description="Click 'Generate Payroll' above to create records for all active employees." />;
  }

  function startEdit(r) {
    setEditingId(r.id);
    setBonus(r.bonus);
    setDeductions(r.deductions);
  }

  function saveEdit(r) {
    onSaveAdjustment(r, bonus, deductions);
    setEditingId(null);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--ink-faint)' }}>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Base</th>
            <th className="px-4 py-3 font-medium">Bonus</th>
            <th className="px-4 py-3 font-medium">Deductions</th>
            <th className="px-4 py-3 font-medium">Net</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={canManage ? 7 : 6} />)
            : records.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className="border-b transition hover:bg-black/[0.015]" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.full_name} imageFilename={r.profile_image} color={departmentColor(r.id)} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{r.full_name}</p>
                          <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{r.department_name || 'Unassigned'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--ink-soft)' }}>{formatCurrency(r.base_salary)}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {isEditing ? (
                        <input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} className="w-20 rounded border px-1.5 py-1 text-sm" style={{ borderColor: 'var(--border)' }} />
                      ) : (
                        <span style={{ color: 'var(--success)' }}>+{formatCurrency(r.bonus)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {isEditing ? (
                        <input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} className="w-20 rounded border px-1.5 py-1 text-sm" style={{ borderColor: 'var(--border)' }} />
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>-{formatCurrency(r.deductions)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: 'var(--ink)' }}>{formatCurrency(r.net_salary)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: r.status === 'paid' ? 'var(--success-soft)' : 'var(--warning-soft)',
                          color: r.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.status === 'paid' ? 'var(--success)' : 'var(--warning)' }} />
                        {r.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {r.status !== 'paid' && (
                            isEditing ? (
                              <button onClick={() => saveEdit(r)} className="rounded-lg px-2 py-1 text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>
                                Save
                              </button>
                            ) : (
                              <>
                                <button onClick={() => startEdit(r)} title="Edit bonus/deductions" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--ink-soft)' }}>
                                  <Pencil size={16} />
                                </button>
                                <button onClick={() => onMarkPaid(r)} title="Mark as paid" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--success)' }}>
                                  <CheckCircle2 size={16} />
                                </button>
                                {canDelete && (
                                  <button onClick={() => onDelete(r)} title="Delete" className="rounded-lg p-1.5 transition hover:bg-black/5" style={{ color: 'var(--danger)' }}>
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </>
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}