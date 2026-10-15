import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const homeByRole = {
  student: '/student',
  organizer: '/organizer',
  admin: '/admin'
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('You have been signed out.');
    navigate('/');
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm text-white">C</span>
          CampusConnect
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {user.name} <span className="text-slate-400">· {user.role}</span>
              </span>
              <Link to="/events" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline">
                Events
              </Link>
              <Link to={homeByRole[user.role]} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Dashboard
              </Link>
              {user.role === 'student' && (
                <Link to="/student/events" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline">
                  My events
                </Link>
              )}
              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link to="/organizer/events" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline">
                  Manage events
                </Link>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/categories" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:inline">
                    Categories
                  </Link>
                  <Link to="/admin/venues" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:inline">
                    Venues
                  </Link>
                  <Link to="/admin/users" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 lg:inline">
                    Users
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/events" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Events
              </Link>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Sign in
              </Link>
              <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
