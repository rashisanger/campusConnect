import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import { getEventById } from '../services/eventService';
import { formatLocalDateTime } from '../utils/eventDate';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getEventById(eventId)
      .then((data) => { if (active) setEvent(data); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.status === 404 ? 'This event could not be found.' : 'Could not load this event.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId]);

  if (loading) return <main className="mx-auto max-w-6xl px-5 py-12"><LoadingSpinner label="Loading event…" /></main>;
  if (error) return <main className="mx-auto max-w-6xl px-5 py-12"><ErrorState message={error} /><Link className="mt-5 inline-block text-sm font-semibold text-indigo-700" to="/events">Back to events</Link></main>;
  if (!event) return null;

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
          <Button className="mt-6 w-full" disabled>Registration coming soon</Button>
        </aside>
      </div>
    </main>
  );
}
