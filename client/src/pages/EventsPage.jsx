import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import { getCategories, getVenues } from '../services/catalogService';
import { getEvents } from '../services/eventService';

function currentFilters(params) {
  return Object.fromEntries(params.entries());
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ events: [], page: 1, totalPages: 0, totalEvents: 0 });
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const paramsKey = searchParams.toString();

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(new URLSearchParams(paramsKey).entries());
    setLoading(true);
    setError('');

    Promise.all([
      getEvents({ ...params, page: params.page || '1', limit: 9 }),
      getCategories(),
      getVenues()
    ])
      .then(([eventsResult, categoryResult, venueResult]) => {
        if (!active) return;
        setResult(eventsResult);
        setCategories(categoryResult);
        setVenues(venueResult);
      })
      .catch(() => {
        if (active) setError('Could not load events. Please check your connection and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [paramsKey]);

  function changeFilters(nextFilters) {
    const next = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    setSearchParams(next);
  }

  function search(value) {
    const filters = currentFilters(searchParams);
    changeFilters({ ...filters, search: value, page: '1' });
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-indigo-700">Discover</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Campus events</h1>
        <p className="mt-2 text-slate-600">Search and filter events published by your campus community.</p>
      </div>
      <div className="mt-7 space-y-4">
        <SearchBar value={searchParams.get('search') || ''} onSearch={search} />
        <FilterPanel
          categories={categories}
          venues={venues}
          filters={currentFilters(searchParams)}
          onChange={changeFilters}
        />
      </div>
      <div className="mt-8">
        {error && <ErrorState message={error} />}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <EventSkeleton key={index} />)}
          </div>
        ) : !error && result.events.length === 0 ? (
          <EmptyState title="No events match these filters">Try a different search or clear one or more filters.</EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">{result.totalEvents} {result.totalEvents === 1 ? 'event' : 'events'} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.events.map((event) => <EventCard key={event._id} event={event} />)}
            </div>
            <div className="mt-8">
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onPageChange={(page) => changeFilters({ ...currentFilters(searchParams), page: String(page) })}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
