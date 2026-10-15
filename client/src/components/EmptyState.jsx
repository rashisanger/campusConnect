export default function EmptyState({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{children}</p>
    </div>
  );
}
