export default function FilterPanel({ categories, venues, filters, onChange }) {
  function set(name, value) {
    onChange({ ...filters, [name]: value, page: '1' });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="space-y-1 text-xs font-semibold text-slate-600">
        <span>Category</span>
        <select value={filters.category || ''} onChange={(event) => set('category', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">
        <span>Venue</span>
        <select value={filters.venue || ''} onChange={(event) => set('venue', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal">
          <option value="">All venues</option>
          {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">
        <span>From</span>
        <input type="date" value={filters.dateFrom || ''} onChange={(event) => set('dateFrom', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" />
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">
        <span>To</span>
        <input type="date" value={filters.dateTo || ''} onChange={(event) => set('dateTo', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" />
      </label>
      <label className="space-y-1 text-xs font-semibold text-slate-600">
        <span>Sort by</span>
        <select value={filters.sort || 'date_asc'} onChange={(event) => set('sort', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal">
          <option value="date_asc">Soonest first</option>
          <option value="date_desc">Latest first</option>
          <option value="newest">Recently added</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2 lg:col-span-5">
        <input type="checkbox" checked={filters.upcoming === 'true'} onChange={(event) => set('upcoming', event.target.checked ? 'true' : '')} />
        Upcoming only
      </label>
    </div>
  );
}
