import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { cancelEvent, deleteEvent, getMyEvents } from '../services/eventService';
import { formatLocalDateTime } from '../utils/eventDate';

export default function OrganizerEventsPage() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadEvents() {
    setError('');
    try {
      setEvents(await getMyEvents());
    } catch {
      setError('Could not load your events. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, [location.state?.updatedEventId]);

  async function confirmAction() {
    if (!confirmation) return;
    setBusy(true);
    try {
      if (confirmation.action === 'cancel') {
        await cancelEvent(confirmation.event._id);
        toast.success('Event cancelled.');
      } else {
        await deleteEvent(confirmation.event._id);
        toast.success('Event deleted.');
      }
      setConfirmation(null);
      await loadEvents();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not update this event.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-5 py-12"><LoadingSpinner label="Loading your events…" /></main>;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Organizer tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Manage events</h1>
        </div>
        <Link to="/organizer/events/new"><Button>Create event</Button></Link>
      </div>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      <div className="mt-7">
        {!error && events.length === 0 ? (
          <EmptyState title="No events yet">Create your first event to get it listed for the campus community.</EmptyState>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <article key={event._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : event.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{formatLocalDateTime(event.schedule.startAt, { dateStyle: 'medium', timeStyle: 'short' })} · {event.venue?.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.availableSeats} of {event.capacity} seats available</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/events/${event._id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">View</Link>
                  <Link to={`/organizer/events/${event._id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Edit</Link>
                  {event.status !== 'cancelled' && (
                    <button type="button" onClick={() => setConfirmation({ action: 'cancel', event })} className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700">Cancel event</button>
                  )}
                  <button type="button" onClick={() => setConfirmation({ action: 'delete', event })} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Modal
        open={Boolean(confirmation)}
        title={confirmation?.action === 'cancel' ? 'Cancel this event?' : 'Delete this event?'}
        confirmLabel={confirmation?.action === 'cancel' ? 'Cancel event' : 'Delete event'}
        busy={busy}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmAction}
      >
        {confirmation?.action === 'cancel'
          ? `“${confirmation.event.title}” will be marked cancelled and remain visible in public listings.`
          : `“${confirmation?.event.title}” can only be deleted if it has no registrations.`}
      </Modal>
    </main>
  );
}
