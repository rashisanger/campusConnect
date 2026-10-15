import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { checkInByRegistration, getEventRegistrations } from '../services/attendanceService';
import { formatLocalDateTime } from '../utils/eventDate';

function Count({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>;
}

export default function OrganizerAttendeesPage() {
  const { eventId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [result, setResult] = useState({ registrations: [], page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadRegistrations() {
    setError('');
    try {
      const params = new URLSearchParams(paramsKey);
      const data = await getEventRegistrations(eventId, {
        page: params.get('page') || 1,
        limit: 20,
        status: params.get('status') || undefined,
        attendance: params.get('attendance') || undefined,
        search: params.get('search') || undefined
      });
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the attendee list.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setLoading(true);
    loadRegistrations();
  }, [eventId, paramsKey]);

  function updateFilter(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  }

  async function confirmCheckIn() {
    if (!pending) return;
    setBusy(true);
    try {
      await checkInByRegistration(eventId, pending._id);
      toast.success(`${pending.user?.name || 'Student'} checked in.`);
      setPending(null);
      await loadRegistrations();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not check in this student.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <Link to="/organizer/events" className="text-sm font-semibold text-indigo-700 hover:underline">← Manage events</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Event attendees</h1>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Attendee counts">
        <Count label="Registered" value={result.totalRegistrations || 0} />
        <Count label="Cancelled" value={result.totalCancelled || 0} />
        <Count label="Attended" value={result.totalAttended || 0} />
      </section>

      <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_190px_auto]" onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search.trim()) params.set('search', search.trim());
        else params.delete('search');
        params.set('page', '1');
        setSearchParams(params);
      }}>
        <label className="sr-only" htmlFor="attendee-search">Search students</label>
        <input id="attendee-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="sr-only" htmlFor="status-filter">Registration status</label>
        <select id="status-filter" value={searchParams.get('status') || ''} onChange={(event) => updateFilter('status', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option><option value="registered">Registered</option><option value="cancelled">Cancelled</option>
        </select>
        <label className="sr-only" htmlFor="attendance-filter">Attendance status</label>
        <select id="attendance-filter" value={searchParams.get('attendance') || ''} onChange={(event) => updateFilter('attendance', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All attendance</option><option value="attended">Attended</option><option value="not_attended">Not attended</option>
        </select>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
      </form>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center"><LoadingSpinner label="Loading attendees…" /></div>
      ) : !error && result.registrations.length === 0 ? (
        <div className="mt-6"><EmptyState title="No matching attendees">Try changing the filters or search terms.</EmptyState></div>
      ) : !error && (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Year</th><th className="px-4 py-3">Registration</th><th className="px-4 py-3">Attendance</th><th className="px-4 py-3">Registered at</th><th className="px-4 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.registrations.map((registration) => (
                  <tr key={registration._id}>
                    <td className="px-4 py-4"><p className="font-semibold text-slate-900">{registration.user?.name}</p><p className="text-xs text-slate-500">{registration.user?.email}</p></td>
                    <td className="px-4 py-4 text-slate-600">{registration.user?.department || '—'}</td>
                    <td className="px-4 py-4 text-slate-600">{registration.user?.year || '—'}</td>
                    <td className="px-4 py-4 capitalize text-slate-600">{registration.status}</td>
                    <td className="px-4 py-4 capitalize text-slate-600">{registration.attendanceStatus === 'attended' ? 'Attended' : 'Not attended'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatLocalDateTime(registration.registrationDate, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-4">
                      {registration.status === 'registered' && registration.attendanceStatus === 'not_attended' && (
                        <button type="button" onClick={() => setPending(registration)} className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Check in</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-7"><Pagination page={result.page} totalPages={result.totalPages} onPageChange={(nextPage) => updateFilter('page', String(nextPage))} /></div>
        </>
      )}
      <Modal open={Boolean(pending)} title="Check in this student?" confirmLabel="Check in" busy={busy} onClose={() => setPending(null)} onConfirm={confirmCheckIn}>
        This will mark {pending?.user?.name || 'this student'} as attended for the event.
      </Modal>
    </main>
  );
}
