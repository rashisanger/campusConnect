import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';

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
        <Route path="/student" element={<ProtectedRoute roles={['student']}><WelcomePage /></ProtectedRoute>} />
        <Route path="/organizer" element={<ProtectedRoute roles={['organizer']}><WelcomePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><WelcomePage /></ProtectedRoute>} />
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
