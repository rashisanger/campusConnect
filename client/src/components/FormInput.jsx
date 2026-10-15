export default function FormInput({ label, id, className = '', ...props }) {
  return (
    <label className={`block space-y-2 text-sm font-medium text-slate-700 ${className}`} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        {...props}
      />
    </label>
  );
}
