import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = '32rem' }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Rendered via a portal straight into <body>. This is deliberate: if the
  // modal were rendered inline, any ancestor using a CSS `transform` (e.g.
  // our .animate-fade-rise page-load animation) would create a new
  // "containing block" for this modal's `position: fixed` overlay, making
  // it position itself relative to that ancestor instead of the real
  // viewport - which is exactly what pushed the form down/off-screen.
  // Escaping to `document.body` via a portal sidesteps that entirely.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: 'rgba(15, 19, 32, 0.5)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-modal-in my-auto w-full rounded-2xl shadow-2xl"
        style={{ background: 'var(--surface)', maxWidth }}
      >
        <div
          className="flex items-center justify-between rounded-t-2xl border-b px-6 py-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 transition hover:bg-black/5"
            style={{ color: 'var(--ink-soft)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
