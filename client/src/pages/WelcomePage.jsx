import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-6xl px-5 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold capitalize text-indigo-700">{user.role} account</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Welcome, {user.name}</h1>
        {user.role === 'organizer' && (
          <Link to="/organizer/events" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Manage events</Link>
        )}
        {user.role === 'admin' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/organizer/events" className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Manage events</Link>
            <Link to="/admin/categories" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Categories</Link>
            <Link to="/admin/venues" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Venues</Link>
            <Link to="/admin/users" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">User accounts</Link>
          </div>
        )}
      </section>
    </main>
  );
}
