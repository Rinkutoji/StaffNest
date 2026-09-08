import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

export default function DepartmentFormModal({ open, onClose, onSaved, department }) {
  const isEdit = Boolean(department);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: department?.name || '', description: department?.description || '' });
      setError('');
    }
  }, [open, department]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Department name is required.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put('/api/departments/update.php', { id: department.id, ...form });
        toast.success('Department updated successfully.');
      } else {
        await api.post('/api/departments/create.php', form);
        toast.success('Department created successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this department.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Department' : 'Add Department'} maxWidth="28rem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. IT Department"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What does this department handle?"
            rows={3}
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add department'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
