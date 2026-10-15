export default function Modal({ open, title, children, confirmLabel = 'Confirm', onConfirm, onClose, busy = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="text-lg font-bold text-slate-900">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
