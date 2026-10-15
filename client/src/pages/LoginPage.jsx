import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';

const homeByRole = {
  student: '/student',
  organizer: '/organizer',
  admin: '/admin'
};

function messageFromError(error) {
  return error.response?.data?.errors?.[0]?.message
    || error.response?.data?.message
    || 'Unable to sign in. Please try again.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success('Welcome back.');
      navigate(location.state?.from?.pathname || homeByRole[user.role], { replace: true });
    } catch (requestError) {
      const message = messageFromError(requestError);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-indigo-700">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use your CampusConnect account to continue.</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <FormInput id="email" name="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
          <FormInput id="password" name="password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={updateField} required />
          <ErrorState message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
