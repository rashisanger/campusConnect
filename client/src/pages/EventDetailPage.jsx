import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getEventById } from '../services/eventService';
import { getRegistrationForEvent, register } from '../services/registrationService';
import { formatLocalDateTime } from '../utils/eventDate';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const requests = [getEventById(eventId)];
    if (user?.role === 'student') requests.push(getRegistrationForEvent(eventId));

    Promise.all(requests)
      .then(([data, currentRegistration]) => {
        if (!active) return;
        setEvent(data);
        setRegistration(currentRegistration || null);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.status === 404 ? 'This event could not be found.' : 'Could not load this event.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, user?.role]);

  async function confirmRegistration() {
    setRegistering(true);
    try {
      const created = await register(eventId);
      setRegistration(created);
      toast.success('You are registered for this event.');
      try {
        setEvent(await getEventById(eventId));
      } catch {
        toast.error('Registration succeeded, but available seats could not be refreshed.');
      }
      navigate(`/student/registrations/${created._id}`);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not register for this event.';
      toast.error(message);
      setError(message);
      try {
        setEvent(await getEventById(eventId));
      } catch {
        setError('Registration failed and event details could not be refreshed.');
      }
    } finally {
      setConfirming(false);
      setRegistering(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-5 py-12"><LoadingSpinner label="Loading event…" /></main>;
  if (error) return <main className="mx-auto max-w-6xl px-5 py-12"><ErrorState message={error} /><Link className="mt-5 inline-block text-sm font-semibold text-indigo-700" to="/events">Back to events</Link></main>;
  if (!event) return null;
  const isStudent = user?.role === 'student';
  const registrationClosed = new Date(event.registrationDeadline) <= new Date()
    || new Date(event.schedule.startAt) <= new Date();
  const isFull = event.availableSeats <= 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/events" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← All events</Link>
      {event.poster ? (
        <img src={event.poster} alt="" className="mt-5 h-64 w-full rounded-3xl object-cover sm:h-96" />
      ) : (
        <div className="mt-5 grid h-64 place-items-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-6xl font-bold text-indigo-400 sm:h-96" aria-hidden="true">
          {event.title.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <article>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{event.category?.name}</span>
            {event.status === 'cancelled' && <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Cancelled</span>}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{event.title}</h1>
          <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">{event.description}</p>
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">Speakers</h2>
            {event.speakers?.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {event.speakers.map((speaker, index) => (
                  <div key={`${speaker.name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="font-semibold text-slate-800">{speaker.name}</h3>
                    {speaker.designation && <p className="mt-1 text-sm text-indigo-700">{speaker.designation}</p>}
                    {speaker.bio && <p className="mt-2 text-sm text-slate-500">{speaker.bio}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">Speaker information has not been added.</p>}
          </section>
          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900">Agenda</h2>
            {event.agenda?.length ? (
              <ol className="mt-4 space-y-3">
                {event.agenda.map((item, index) => (
                  <li key={`${item.time}-${index}`} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="min-w-20 text-sm font-semibold text-indigo-700">{item.time}</span>
                    <span><span className="font-semibold text-slate-800">{item.title}</span>{item.description && <span className="mt-1 block text-sm text-slate-500">{item.description}</span>}</span>
                  </li>
                ))}
              </ol>
            ) : <EmptyState title="Agenda to be announced">The organizer has not added agenda items yet.</EmptyState>}
          </section>
        </article>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Event details</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="text-slate-500">Date and time</dt><dd className="mt-1 font-medium text-slate-800">{formatLocalDateTime(event.schedule.startAt, { dateStyle: 'full', timeStyle: 'short' })} – {formatLocalDateTime(event.schedule.endAt, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
            <div><dt className="text-slate-500">Venue</dt><dd className="mt-1 font-medium text-slate-800">{event.venue?.name}{event.venue?.building ? ` · ${event.venue.building}` : ''}{event.venue?.room ? `, ${event.venue.room}` : ''}</dd></div>
            <div><dt className="text-slate-500">Organizer</dt><dd className="mt-1 font-medium text-slate-800">{event.organizer?.name}</dd></div>
            <div><dt className="text-slate-500">Capacity</dt><dd className="mt-1 font-medium text-slate-800">{event.capacity} people · {event.availableSeats} available</dd></div>
            <div><dt className="text-slate-500">Registration deadline</dt><dd className="mt-1 font-medium text-slate-800">{formatLocalDateTime(event.registrationDeadline, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
          </dl>
          {event.status === 'cancelled' ? (
            <Button className="mt-6 w-full" disabled>Event cancelled</Button>
          ) : !user ? (
            <Link to="/login" state={{ from: { pathname: `/events/${event._id}` } }} className="mt-6 block rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700">
              Login to register
            </Link>
          ) : !isStudent ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs leading-5 text-slate-600">Registration is available to student accounts.</p>
          ) : registration?.status === 'registered' ? (
            <Link to={`/student/registrations/${registration._id}`} className="mt-6 block rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700">
              View registration
            </Link>
          ) : isFull ? (
            <Button className="mt-6 w-full" disabled>Event full</Button>
          ) : registrationClosed ? (
            <Button className="mt-6 w-full" disabled>Registration closed</Button>
          ) : (
            <Button className="mt-6 w-full" disabled={registering} onClick={() => setConfirming(true)}>
              {registering ? 'Registering…' : 'Register now'}
            </Button>
          )}
        </aside>
      </div>
      <Modal
        open={confirming}
        title="Confirm registration"
        confirmLabel="Register"
        busy={registering}
        onClose={() => setConfirming(false)}
        onConfirm={confirmRegistration}
      >
        Register for “{event.title}”? Your place will be reserved when you confirm.
      </Modal>
    </main>
  );
}
