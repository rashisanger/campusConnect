import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import { checkInByToken, getEventAttendance } from '../services/attendanceService';
import { formatLocalDateTime } from '../utils/eventDate';

const scannerRegionId = 'campusconnect-qr-reader';

export default function OrganizerCheckInPage() {
  const { eventId } = useParams();
  const scannerRef = useRef(null);
  const requestInFlight = useRef(false);
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [attendance, setAttendance] = useState({ attendance: [], totalAttendance: 0, registered: 0 });
  const [loading, setLoading] = useState(true);

  const stopScanner = useCallback(async (showError = true) => {
    const scanner = scannerRef.current;
    if (!scanner || !scanner.isScanning) return;
    try {
      await scanner.stop();
      scanner.clear();
      setScanning(false);
    } catch (error) {
      if (showError) setCameraError('The camera could not be stopped. You can still use the manual token box.');
      else console.error('Could not stop the QR scanner during cleanup.', error);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      setAttendance(await getEventAttendance(eventId, { page: 1, limit: 5 }));
    } catch (error) {
      setCameraError(error.response?.data?.message || 'Could not load the attendance counter.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadAttendance();
    return () => { void stopScanner(false); };
  }, [loadAttendance, stopScanner]);

  const submitToken = useCallback(async (providedToken) => {
    if (requestInFlight.current) return;
    const value = providedToken.trim();
    if (!value) {
      setResult({ success: false, message: 'Enter or scan a QR token first.' });
      return;
    }
    requestInFlight.current = true;
    setSubmitting(true);
    setResult(null);
    try {
      await stopScanner();
      const response = await checkInByToken(eventId, value);
      setResult({ success: true, ...response });
      setToken('');
      toast.success(`${response.student.name} checked in.`);
      await loadAttendance();
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Check-in failed. Please try again.',
        checkInTime: error.response?.data?.checkInTime
      });
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  }, [eventId, loadAttendance, stopScanner]);

  async function startScanner() {
    setCameraError('');
    setResult(null);
    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode(scannerRegionId);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedToken) => { void submitToken(decodedToken); },
        () => {}
      );
      setScanning(true);
    } catch (error) {
      setScanning(false);
      setCameraError('Camera access is unavailable or was denied. Use the manual token box below.');
    }
  }

  function scanNext() {
    setResult(null);
    setToken('');
    void startScanner();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/organizer/events" className="text-sm font-semibold text-indigo-700 hover:underline">← Manage events</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Event check-in</h1>
      <p className="mt-2 text-sm text-slate-600">Scan a student QR code or enter its token manually.</p>

      <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-sm font-medium text-indigo-900">Checked in <strong>{attendance.totalAttendance}</strong> / Registered <strong>{attendance.registered}</strong></p>
        {loading && <div className="mt-3"><LoadingSpinner label="Updating attendance…" /></div>}
        {attendance.attendance.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-bold text-slate-900">Latest check-ins</h2>
            <ul className="mt-2 divide-y divide-indigo-100">
              {attendance.attendance.map((record) => (
                <li key={record._id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span className="font-medium text-slate-800">{record.user?.name} <span className="font-normal text-slate-500">{record.user?.department}</span></span>
                  <time className="text-slate-500">{formatLocalDateTime(record.checkInTime, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {cameraError && <div className="mt-5"><ErrorState message={cameraError} /></div>}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Camera scanner</h2>
          <div id={scannerRegionId} className="mt-4 min-h-20 overflow-hidden rounded-xl bg-slate-100" />
          <div className="mt-4 flex flex-wrap gap-3">
            {!scanning ? <button type="button" onClick={startScanner} disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start camera</button> : (
              <button type="button" onClick={() => stopScanner()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Stop camera</button>
            )}
            {result && <button type="button" onClick={scanNext} disabled={submitting} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">Scan next</button>}
          </div>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => {
          event.preventDefault();
          void submitToken(token);
        }}>
          <h2 className="text-lg font-bold text-slate-900">Manual token</h2>
          <label htmlFor="manual-token" className="mt-4 block text-sm font-medium text-slate-700">QR token</label>
          <input id="manual-token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm" placeholder="Paste the 48-character token" />
          <button type="submit" disabled={submitting || !token.trim()} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Checking in…' : 'Submit token'}</button>
        </form>
      </section>

      {result && (
        <section className={`mt-6 rounded-2xl border p-5 ${result.success ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`} role="status" aria-live="polite">
          {result.success ? (
            <>
              <h2 className="text-lg font-bold">Check-in successful</h2>
              <p className="mt-2"><strong>{result.student.name}</strong> · {result.student.department || 'Department not set'} · {result.student.year || 'Year not set'}</p>
              <p className="mt-1 text-sm">{formatLocalDateTime(result.checkInTime, { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold">Check-in unsuccessful</h2>
              <p className="mt-2">{result.message}</p>
              {result.checkInTime && <p className="mt-1 text-sm">Previously checked in at {formatLocalDateTime(result.checkInTime, { dateStyle: 'medium', timeStyle: 'short' })}.</p>}
            </>
          )}
        </section>
      )}
    </main>
  );
}
