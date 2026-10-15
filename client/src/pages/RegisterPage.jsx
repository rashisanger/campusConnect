import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import { useAuth } from '../context/AuthContext';

function messageFromError(error) {
  return error.response?.data?.errors?.[0]?.message
    || error.response?.data?.message
    || 'Unable to create your account. Please try again.';
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    year: '',
    interests: ''
  });
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
      await register({
        ...form,
        interests: form.interests.split(',').map((interest) => interest.trim()).filter(Boolean)
      });
      toast.success('Your student account is ready.');
      navigate('/student', { replace: true });
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
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-indigo-700">Get started</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create your student account</h1>
        <p className="mt-2 text-sm text-slate-500">Join your campus community in a few steps.</p>
        <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <FormInput id="name" name="name" label="Full name" autoComplete="name" value={form.name} onChange={updateField} required />
          <FormInput id="email" name="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
          <FormInput id="password" name="password" label="Password (8+ characters)" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={updateField} required className="sm:col-span-2" />
          <FormInput id="department" name="department" label="Department" value={form.department} onChange={updateField} />
          <FormInput id="year" name="year" label="Year of study" value={form.year} onChange={updateField} />
          <FormInput id="interests" name="interests" label="Interests (comma-separated)" value={form.interests} onChange={updateField} className="sm:col-span-2" />
          <div className="space-y-4 sm:col-span-2">
            <ErrorState message={error} />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
