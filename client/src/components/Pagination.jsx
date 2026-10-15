export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Event pages">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >Previous</button>
      <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >Next</button>
    </nav>
  );
}
