import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/formatters';

export default function LeaveRequestModal({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      employee_id: isEmployee ? String(user.employee_id || '') : '',
      leave_type: 'annual',
      start_date: '',
      end_date: '',
      reason: '',
    });
    setError('');
    // Employees submit only for themselves, so there's no need to load
    // (or expose) the full employee directory to them.
    if (!isEmployee) {
      api.get('/api/employees/get.php', { params: { status: 'active', limit: 50, sort: 'name_asc' } })
        .then((res) => setEmployees(res.data.data.employees));
    }
  }, [open, isEmployee, user?.employee_id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isEmployee && !form.employee_id) {
      setError('Your account is not linked to an employee record yet. Ask an Admin/HR to link it.');
      return;
    }
    if (!form.employee_id || !form.start_date || !form.end_date) {
      setError('Employee, start date and end date are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/leaves/create.php', form);
      toast.success('Leave request submitted.');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit leave request.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Leave Request" maxWidth="28rem">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEmployee && (
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Employee</label>
            <select
              required
              value={form.employee_id}
              onChange={(e) => update('employee_id', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Leave type</label>
          <select
            value={form.leave_type}
            onChange={(e) => update('leave_type', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Start date</label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>End date</label>
            <input
              type="date"
              required
              value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            rows={2}
            placeholder="Optional"
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>

        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-black/5" style={{ color: 'var(--ink)' }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
