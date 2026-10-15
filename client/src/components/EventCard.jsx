import { Link } from 'react-router-dom';
import { formatLocalDateTime } from '../utils/eventDate';

export default function EventCard({ event }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/events/${event._id}`} className="block">
        {event.poster ? (
          <img className="h-44 w-full object-cover" src={event.poster} alt="" />
        ) : (
          <div className="grid h-44 place-items-center bg-gradient-to-br from-indigo-100 to-violet-100 text-4xl font-bold text-indigo-400" aria-hidden="true">
            {event.title?.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {event.category?.name || 'Event'}
            </span>
            {event.status === 'cancelled' && (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Cancelled</span>
            )}
          </div>
          <h3 className="mt-4 line-clamp-2 text-lg font-bold text-slate-900">{event.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{event.description}</p>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>{formatLocalDateTime(event.schedule?.startAt, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span>{event.venue?.name || 'Venue TBA'}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
