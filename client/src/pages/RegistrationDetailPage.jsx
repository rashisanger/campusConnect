import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { cancelRegistration, getRegistrationById } from '../services/registrationService';
import { formatLocalDateTime } from '../utils/eventDate';

export default function RegistrationDetailPage() {
  const { registrationId } = useParams();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRegistrationById(registrationId)
      .then((data) => { if (active) setRegistration(data); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.status === 404
          ? 'Registration not found.'
          : 'Could not load this registration.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [registrationId]);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(registration.qrToken);
      setCopied(true);
      toast.success('QR token copied.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the token. Select and copy it manually.');
    }
  }

  async function confirmCancel() {
    setCancelling(true);
    try {
      const updated = await cancelRegistration(registrationId);
      setRegistration(updated);
      toast.success('Registration cancelled and the seat released.');
      setConfirming(false);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not cancel this registration.';
      setError(message);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-12"><LoadingSpinner label="Loading registration…" /></main>;
  if (error && !registration) return <main className="mx-auto max-w-5xl px-5 py-12"><ErrorState message={error} /><Link to="/student/events" className="mt-5 inline-block text-sm font-semibold text-indigo-700">Back to my events</Link></main>;
  if (!registration) return null;
  const event = registration.event;
  const canCancel = registration.status === 'registered'
    && registration.attendanceStatus !== 'attended'
    && new Date(event.schedule.startAt) > new Date();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/student/events" className="text-sm font-semibold text-indigo-700">← My events</Link>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-indigo-700">Registration details</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h1>
          <div className="mt-6 space-y-4 text-sm">
            <div><p className="text-slate-500">Status</p><p className="mt-1 font-semibold capitalize text-slate-800">{registration.status === 'registered' && registration.attendanceStatus === 'attended' ? 'Attended' : registration.status}</p></div>
            <div><p className="text-slate-500">Registered on</p><p className="mt-1 font-medium text-slate-800">{formatLocalDateTime(registration.registrationDate, { dateStyle: 'full', timeStyle: 'short' })}</p></div>
            <div><p className="text-slate-500">Event date and time</p><p className="mt-1 font-medium text-slate-800">{formatLocalDateTime(event.schedule.startAt, { dateStyle: 'full', timeStyle: 'short' })} – {formatLocalDateTime(event.schedule.endAt, { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
            <div><p className="text-slate-500">Venue</p><p className="mt-1 font-medium text-slate-800">{event.venue?.name}{event.venue?.building ? ` · ${event.venue.building}` : ''}{event.venue?.room ? `, ${event.venue.room}` : ''}</p></div>
            <div><p className="text-slate-500">Category</p><p className="mt-1 font-medium text-slate-800">{event.category?.name}</p></div>
          </div>
          <Link to={`/events/${event._id}`} className="mt-7 inline-block text-sm font-semibold text-indigo-700">View event details</Link>
          {canCancel && <div><Button className="mt-6 bg-rose-600 hover:bg-rose-700 focus:ring-rose-200" onClick={() => setConfirming(true)}>Cancel registration</Button></div>}
        </section>
        {registration.status === 'registered' && registration.qrToken ? (
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Your event pass</h2>
            <p className="mt-2 text-sm text-slate-500">Show this QR code when check-in is available.</p>
            <div className="mx-auto mt-5 inline-block rounded-2xl border border-slate-100 bg-white p-4">
              <QRCodeSVG value={registration.qrToken} size={240} level="M" marginSize={2} />
            </div>
            <label htmlFor="qrToken" className="mt-5 block text-left text-xs font-semibold text-slate-600">Manual token</label>
            <div className="mt-2 flex gap-2">
              <input id="qrToken" readOnly value={registration.qrToken} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700" />
              <button type="button" onClick={copyToken} className="rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </aside>
        ) : (
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            This registration is cancelled; its event pass is no longer active.
          </aside>
        )}
      </div>
      <Modal
        open={confirming}
        title="Cancel this registration?"
        confirmLabel="Cancel registration"
        busy={cancelling}
        onClose={() => setConfirming(false)}
        onConfirm={confirmCancel}
      >
        The seat for “{event.title}” will be released.
      </Modal>
    </main>
  );
}
