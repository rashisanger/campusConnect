import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import { getOrganizerDashboard } from '../services/dashboardService';
import { formatLocalDateTime } from '../utils/eventDate';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default function OrganizerDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOrganizerDashboard()
      .then((data) => { if (active) setDashboard(data); })
      .catch(() => { if (active) setError('Could not load the organizer dashboard. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <main className="mx-auto max-w-6xl px-5 py-12"><LoadingSpinner label="Loading organizer dashboard…" /></main>;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Organizer tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        </div>
        <Link to="/organizer/events" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Manage events</Link>
      </div>
      {error ? <div className="mt-6"><ErrorState message={error} /></div> : dashboard && (
        <>
          <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Organizer statistics">
            <StatCard label="Total events" value={dashboard.totalEvents} />
            <StatCard label="Upcoming events" value={dashboard.upcomingEvents} />
            <StatCard label="Total registrations" value={dashboard.totalRegistrations} />
            <StatCard label="Total attendance" value={dashboard.totalAttendance} />
            <StatCard label="Attendance rate" value={`${dashboard.attendanceRate}%`} />
            <StatCard label="Average rating" value={dashboard.averageRating === null ? 'No ratings yet' : dashboard.averageRating} />
          </section>
          <section className="mt-9">
            <h2 className="text-xl font-bold text-slate-950">Event performance</h2>
            {dashboard.events.length === 0 ? (
              <div className="mt-4"><EmptyState title="No events to report">Your event statistics will appear here.</EmptyState></div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Event</th><th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Registrations</th><th className="px-5 py-3">Capacity</th>
                      <th className="px-5 py-3">Attended</th><th className="px-5 py-3">Attendance rate</th><th className="px-5 py-3">Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboard.events.map((event) => (
                      <tr key={event._id}>
                        <td className="px-5 py-4 font-semibold text-slate-900">{event.title}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatLocalDateTime(event.startAt, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="px-5 py-4">{event.registeredCount}</td>
                        <td className="px-5 py-4">{event.capacity}</td>
                        <td className="px-5 py-4">{event.attended}</td>
                        <td className="px-5 py-4">{event.attendanceRate}%</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <Link className="mr-3 font-semibold text-indigo-700 hover:underline" to={`/organizer/events/${event._id}/attendees`}>Attendees</Link>
                          <Link className="font-semibold text-indigo-700 hover:underline" to={`/organizer/events/${event._id}/check-in`}>Check-in</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
