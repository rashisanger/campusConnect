import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { cancelEvent, deleteEvent } from '../services/eventService';
import { getAdminEvents } from '../services/adminService';
import { formatLocalDateTime } from '../utils/eventDate';

const statuses = ['draft', 'published', 'cancelled', 'completed'];

export default function AdminEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [result, setResult] = useState({ events: [], page: 1, totalPages: 0, totalEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadEvents() {
    setError('');
    try {
      const params = new URLSearchParams(paramsKey);
      setResult(await getAdminEvents({
        page: params.get('page') || 1,
        limit: 20,
        status: params.get('status') || undefined,
        search: params.get('search') || undefined
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load platform events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setLoading(true);
    loadEvents();
  }, [paramsKey]);

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  }

  async function confirmAction() {
    if (!pending || pending.action === 'view') {
      setPending(null);
      return;
    }
    setBusy(true);
    setPending({ ...pending, message: '' });
    try {
      if (pending.action === 'cancel') {
        await cancelEvent(pending.event._id);
        toast.success('Event cancelled.');
      } else {
        await deleteEvent(pending.event._id);
        toast.success('Event deleted.');
      }
      setPending(null);
      await loadEvents();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not update this event.';
      setPending((current) => ({ ...current, message }));
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-semibold text-indigo-700">Administration</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Manage events</h1>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      <form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_200px_auto]" onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search.trim()) params.set('search', search.trim());
        else params.delete('search');
        params.set('page', '1');
        setSearchParams(params);
      }}>
        <label className="sr-only" htmlFor="admin-event-search">Search events</label>
        <input id="admin-event-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, description or tags" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="sr-only" htmlFor="admin-event-status">Filter by status</label>
        <select id="admin-event-status" value={searchParams.get('status') || ''} onChange={(event) => updateParam('status', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Search</button>
      </form>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center"><LoadingSpinner label="Loading events…" /></div>
      ) : !error && result.events.length === 0 ? (
        <div className="mt-6"><EmptyState title="No events found">Events matching these filters will appear here.</EmptyState></div>
      ) : !error && (
        <>
          <div className="mt-5 text-sm text-slate-500">{result.totalEvents} events</div>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Organizer</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Registrations</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.events.map((event) => (
                  <tr key={event._id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{event.title}<p className="mt-1 font-normal text-slate-500">{event.venue?.name}</p></td>
                    <td className="px-4 py-4 text-slate-600">{event.organizer?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-slate-600">{event.category?.name || 'Uncategorized'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatLocalDateTime(event.schedule.startAt, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-4">{event.registeredCount} / {event.capacity}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${event.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : event.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.status}</span></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setPending({ action: 'view', event })} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700">View</button>
                        <Link to={`/organizer/events/${event._id}/edit`} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Edit</Link>
                        {event.status !== 'cancelled' && event.status !== 'completed' && <button type="button" onClick={() => setPending({ action: 'cancel', event })} className="rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700">Cancel</button>}
                        <button type="button" onClick={() => setPending({ action: 'delete', event })} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-7"><Pagination page={result.page} totalPages={result.totalPages} onPageChange={(nextPage) => updateParam('page', String(nextPage))} /></div>
        </>
      )}

      <Modal
        open={Boolean(pending)}
        title={pending?.action === 'view' ? pending.event.title : pending?.action === 'cancel' ? 'Cancel this event?' : 'Delete this event?'}
        confirmLabel={pending?.action === 'view' ? 'Done' : pending?.action === 'cancel' ? 'Cancel event' : 'Delete event'}
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirmAction}
      >
        {pending?.action === 'view' ? (
          <div className="space-y-1">
            <p>Status: <span className="capitalize">{pending.event.status}</span></p>
            <p>Organizer: {pending.event.organizer?.name || 'Unknown'}</p>
            <p>Category: {pending.event.category?.name || 'Uncategorized'}</p>
            <p>Venue: {pending.event.venue?.name || 'Not specified'}</p>
            <p>Date: {formatLocalDateTime(pending.event.schedule.startAt, { dateStyle: 'full', timeStyle: 'short' })}</p>
            <p>Registrations: {pending.event.registeredCount} / {pending.event.capacity}</p>
          </div>
        ) : (
          <p>{pending?.action === 'cancel'
            ? `“${pending?.event.title}” will be marked cancelled.`
            : `“${pending?.event.title}” can only be deleted if it has no registrations.`}</p>
        )}
        {pending?.message && <div className="mt-4"><ErrorState message={pending.message} /></div>}
      </Modal>
    </main>
  );
}
