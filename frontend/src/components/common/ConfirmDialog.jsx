import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="26rem">
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {description}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-black/5"
          style={{ color: 'var(--ink)' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          style={{ background: 'var(--danger)' }}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
