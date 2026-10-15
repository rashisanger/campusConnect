import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { cancelRegistration, getMyRegistrations } from '../services/registrationService';
import { formatLocalDateTime } from '../utils/eventDate';

const tabs = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'attended', label: 'Attended' },
  { id: 'cancelled', label: 'Cancelled' }
];

export default function StudentEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabs.some((item) => item.id === searchParams.get('tab')) ? searchParams.get('tab') : 'upcoming';
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const paramsKey = searchParams.toString();
  const [result, setResult] = useState({ registrations: [], page: 1, totalPages: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(paramsKey);
    const selectedTab = tabs.some((item) => item.id === params.get('tab')) ? params.get('tab') : 'upcoming';
    setLoading(true);
    setError('');
    getMyRegistrations({ tab: selectedTab, page: params.get('page') || 1, limit: 9 })
      .then((data) => { if (active) setResult(data); })
      .catch(() => { if (active) setError('Could not load your registrations. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paramsKey]);

  function selectTab(nextTab) {
    setSearchParams({ tab: nextTab, page: '1' });
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelRegistration(pendingCancel._id);
      toast.success('Registration cancelled and the seat released.');
      setPendingCancel(null);
      const params = new URLSearchParams(searchParams);
      params.set('tab', 'upcoming');
      params.set('page', '1');
      setSearchParams(params);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not cancel this registration.';
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm font-semibold text-indigo-700">Student dashboard</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">My events</h1>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200" role="tablist" aria-label="Registration status">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => selectTab(item.id)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >{item.label}</button>
        ))}
      </div>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      {loading ? (
        <div className="flex min-h-60 items-center justify-center"><LoadingSpinner label="Loading your events…" /></div>
      ) : !error && result.registrations.length === 0 ? (
        <div className="mt-7"><EmptyState title={`No ${tab} events`}>Your {tab} registrations will show here.</EmptyState></div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {result.registrations.map((registration) => {
              const event = registration.event;
              return (
                <article key={registration._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/events/${event._id}`} className="text-lg font-bold text-slate-900 hover:text-indigo-700">{event.title}</Link>
                    <p className="mt-2 text-sm text-slate-500">{formatLocalDateTime(event.schedule.startAt, { dateStyle: 'medium', timeStyle: 'short' })} · {event.venue?.name}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{registration.attendanceStatus === 'attended' ? 'Attended' : registration.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/student/registrations/${registration._id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Registration details</Link>
                    {tab === 'upcoming' && (
                      <button type="button" onClick={() => setPendingCancel(registration)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Cancel</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-8">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={(nextPage) => setSearchParams({ tab, page: String(nextPage) })}
            />
          </div>
        </>
      )}
      <Modal
        open={Boolean(pendingCancel)}
        title="Cancel this registration?"
        confirmLabel="Cancel registration"
        busy={cancelling}
        onClose={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
      >
        Your seat for “{pendingCancel?.event?.title}” will be released.
      </Modal>
    </main>
  );
}
