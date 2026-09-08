import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

export default function JobPostingModal({ open, onClose, onSaved, departments, posting }) {
  const isEdit = Boolean(posting);
  const [form, setForm] = useState({ title: '', department_id: '', description: '', status: 'open' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        posting
          ? { title: posting.title, department_id: posting.department_id ?? '', description: posting.description || '', status: posting.status }
          : { title: '', department_id: '', description: '', status: 'open' }
      );
      setError('');
    }
  }, [open, posting]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Job title is required.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put('/api/recruitment/jobs_update.php', { id: posting.id, ...form });
        toast.success('Job posting updated.');
      } else {
        await api.post('/api/recruitment/jobs_create.php', form);
        toast.success('Job posting created.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this job posting.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Job Posting' : 'New Job Posting'} maxWidth="30rem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Job title</label>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Department</label>
          <select
            value={form.department_id}
            onChange={(e) => update('department_id', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            <option value="">Unassigned</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        {isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}

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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create posting'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
