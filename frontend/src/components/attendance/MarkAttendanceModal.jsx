import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import api from '../../api/axios';
import { departmentColor } from '../../utils/departmentColors';
import { getErrorMessage } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'var(--success)' },
  { value: 'late', label: 'Late', color: 'var(--warning)' },
  { value: 'half_day', label: 'Half Day', color: 'var(--accent)' },
  { value: 'absent', label: 'Absent', color: 'var(--danger)' },
];

export default function MarkAttendanceModal({ open, onClose, onSaved, date }) {
  const [employees, setEmployees] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    api
      .get('/api/employees/get.php', { params: { status: 'active', limit: 50, sort: 'name_asc' } })
      .then((res) => {
        const emps = res.data.data.employees;
        setEmployees(emps);
        const initial = {};
        emps.forEach((e) => { initial[e.id] = 'present'; });
        setStatusMap(initial);
      })
      .catch((err) => setError(getErrorMessage(err, 'Could not load employees.')))
      .finally(() => setLoading(false));
  }, [open]);

  function setStatus(empId, status) {
    setStatusMap((m) => ({ ...m, [empId]: status }));
  }

  function markAll(status) {
    const next = {};
    employees.forEach((e) => { next[e.id] = status; });
    setStatusMap(next);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const records = employees.map((e) => ({ employee_id: e.id, status: statusMap[e.id] || 'present' }));
      await api.post('/api/attendance/mark.php', { date, records });
      toast.success('Attendance saved.');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save attendance.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Mark Attendance — ${date}`} maxWidth="34rem">
      {error && (
        <p className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="text-xs self-center" style={{ color: 'var(--ink-faint)' }}>Mark all as:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => markAll(opt.value)}
            className="rounded-full border px-2.5 py-1 text-xs font-medium transition hover:bg-black/5"
            style={{ borderColor: 'var(--border)', color: opt.color }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="max-h-96 space-y-1.5 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Loading employees…</p>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: 'var(--border)' }}>
              <Avatar name={emp.full_name} imageFilename={emp.profile_image} color={departmentColor(emp.department_id)} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>{emp.full_name}</p>
                <p className="truncate text-xs" style={{ color: 'var(--ink-soft)' }}>{emp.department_name || 'Unassigned'}</p>
              </div>
              <div className="flex flex-none gap-1">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(emp.id, opt.value)}
                    title={opt.label}
                    className="h-6 w-6 rounded-full border-2 transition"
                    style={{
                      borderColor: opt.color,
                      background: statusMap[emp.id] === opt.value ? opt.color : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-black/5" style={{ color: 'var(--ink)' }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? 'Saving…' : `Save Attendance (${employees.length})`}
        </button>
      </div>
    </Modal>
  );
}
