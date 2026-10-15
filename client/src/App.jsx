import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import OrganizerEventsPage from './pages/OrganizerEventsPage';
import AdminCatalogPage from './pages/AdminCatalogPage';
import AdminUsersPage from './pages/AdminUsersPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentEventsPage from './pages/StudentEventsPage';
import RegistrationDetailPage from './pages/RegistrationDetailPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import OrganizerAttendeesPage from './pages/OrganizerAttendeesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventsPage from './pages/AdminEventsPage';
const OrganizerCheckInPage = lazy(() => import('./pages/OrganizerCheckInPage'));

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/student/events" element={<ProtectedRoute roles={['student']}><StudentEventsPage /></ProtectedRoute>} />
        <Route path="/student/registrations/:registrationId" element={<ProtectedRoute roles={['student']}><RegistrationDetailPage /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerDashboardPage /></ProtectedRoute>} />
        <Route path="/organizer/events" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerEventsPage /></ProtectedRoute>} />
        <Route path="/organizer/events/:eventId/attendees" element={<ProtectedRoute roles={['organizer', 'admin']}><OrganizerAttendeesPage /></ProtectedRoute>} />
        <Route path="/organizer/events/:eventId/check-in" element={<ProtectedRoute roles={['organizer', 'admin']}><Suspense fallback={<LoadingSpinner label="Loading check-in tools…" />}><OrganizerCheckInPage /></Suspense></ProtectedRoute>} />
        <Route path="/organizer/events/new" element={<ProtectedRoute roles={['organizer', 'admin']}><EventFormPage /></ProtectedRoute>} />
        <Route path="/organizer/events/:eventId/edit" element={<ProtectedRoute roles={['organizer', 'admin']}><EventFormPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminCatalogPage kind="categories" /></ProtectedRoute>} />
        <Route path="/admin/venues" element={<ProtectedRoute roles={['admin']}><AdminCatalogPage kind="venues" /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute roles={['admin']}><AdminEventsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <AppRoutes />
    </div>
  );
}
