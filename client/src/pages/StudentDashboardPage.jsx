import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import { getStudentDashboard } from '../services/dashboardService';

const statDetails = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'attended', label: 'Attended' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'total', label: 'Total registrations' }
];

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getStudentDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch(() => { if (active) setError('Could not load your dashboard. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Student dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Your campus activity</h1>
        </div>
        <Link to="/student/events" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">My events</Link>
      </div>

      {error && <div className="mt-6"><ErrorState message={error} /></div>}
      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Registration totals">
        {statDetails.map((stat) => (
          <article key={stat.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            {loading ? <div className="mt-3 h-8 w-12 animate-pulse rounded bg-slate-200" /> : (
              <p className="mt-2 text-3xl font-bold text-slate-950">{dashboard?.counts?.[stat.key] ?? '—'}</p>
            )}
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Coming up</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Your next events</h2>
          </div>
          <Link to="/student/events?tab=upcoming" className="text-sm font-semibold text-indigo-700">View all</Link>
        </div>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <EventSkeleton key={index} />)}
          </div>
        ) : !error && dashboard?.nextEvents?.length === 0 ? (
          <EmptyState title="Nothing scheduled yet">Events you register for will appear here.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard?.nextEvents?.map((registration) => (
              <EventCard key={registration._id} event={registration.event} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
