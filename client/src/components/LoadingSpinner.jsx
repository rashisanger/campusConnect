export default function LoadingSpinner({ label = 'Loading your account…' }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-medium text-slate-600" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      {label}
    </div>
  );
}
