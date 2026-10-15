import { useEffect, useState } from 'react';

export default function SearchBar({ value, onSearch }) {
  const [search, setSearch] = useState(value || '');

  useEffect(() => setSearch(value || ''), [value]);

  function submit(event) {
    event.preventDefault();
    onSearch(search.trim());
  }

  return (
    <form className="flex gap-2" onSubmit={submit} role="search">
      <input
        aria-label="Search events"
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        placeholder="Search events, topics, or tags"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <button className="rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700" type="submit">Search</button>
    </form>
  );
}
