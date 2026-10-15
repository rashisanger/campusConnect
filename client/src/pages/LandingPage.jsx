import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import { getCategories } from '../services/catalogService';
import { getEvents } from '../services/eventService';

export default function LandingPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getEvents({ upcoming: 'true', limit: 6, sort: 'date_asc' }),
      getCategories()
    ])
      .then(([eventResult, categoryResult]) => {
        setEvents(eventResult.events);
        setCategories(categoryResult);
      })
      .catch(() => setError('Could not load campus events right now. Please try again later.'))
      .finally(() => {
        setLoading(false);
        setCategoriesLoading(false);
      });
  }, []);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-28">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
            Your campus, connected
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Find your next campus experience.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Discover college events, save your place, and show up ready to take part.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              Join CampusConnect
            </Link>
            <Link to="/events" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Browse events
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-100">Make campus count</p>
          <p className="mt-4 text-2xl font-semibold leading-snug">
            One place for the events and experiences happening around you.
          </p>
          <p className="mt-6 text-sm leading-6 text-indigo-100">
            Sign in or create a student account to get started.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Explore</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Upcoming events</h2>
          </div>
          <Link to="/events" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View all</Link>
        </div>
        {error && <ErrorState message={error} />}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <EventSkeleton key={index} />)}
          </div>
        ) : !error && events.length === 0 ? (
          <EmptyState title="No upcoming events yet">Check back later when new campus events are published.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => <EventCard key={event._id} event={event} />)}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Explore by category</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/events?category=${category._id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
            >{category.name}</Link>
          ))}
          {categoriesLoading && <p className="text-sm text-slate-500">Loading categories…</p>}
          {!categoriesLoading && categories.length === 0 && <p className="text-sm text-slate-500">Categories will appear here when they are available.</p>}
        </div>
      </section>
    </main>
  );
}
