import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

export default function CandidateModal({ open, onClose, onSaved, jobPostingId, jobTitle }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ full_name: '', email: '', phone: '', notes: '' });
      setError('');
    }
  }, [open]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/recruitment/candidates_create.php', { job_posting_id: jobPostingId, ...form });
      toast.success('Candidate added.');
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add this candidate.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add Candidate — ${jobTitle}`} maxWidth="26rem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Full name</label>
          <input
            required
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--ink)' }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
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
            {saving ? 'Adding…' : 'Add candidate'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
