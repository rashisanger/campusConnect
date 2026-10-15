import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { createUser, getUsers } from '../services/adminService';

const initialForm = { name: '', email: '', password: '', role: 'organizer' };

export default function AdminUsersPage() {
  const [result, setResult] = useState({ users: [], page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadUsers() {
    setError('');
    try {
      setResult(await getUsers({ page, limit: 20 }));
    } catch {
      setError('Could not load user accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [page]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createUser(form);
      toast.success(`${form.role === 'admin' ? 'Admin' : 'Organizer'} account created.`);
      setForm(initialForm);
      setPage(1);
      await loadUsers();
    } catch (requestError) {
      const message = requestError.response?.data?.errors?.[0]?.message
        || requestError.response?.data?.message
        || 'Could not create this account.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm font-semibold text-indigo-700">Administration</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">User accounts</h1>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          {error && <div className="mb-4"><ErrorState message={error} /></div>}
          {loading ? <LoadingSpinner label="Loading users…" /> : result.users.length === 0 ? (
            <EmptyState title="No user accounts found">Create an organizer or admin account with the form.</EmptyState>
          ) : (
            <>
              <div className="space-y-3">
                {result.users.map((user) => (
                  <article key={user._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div><h2 className="font-semibold text-slate-900">{user.name}</h2><p className="mt-1 text-sm text-slate-500">{user.email}</p></div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">{user.role}</span>
                  </article>
                ))}
              </div>
              <div className="mt-6"><Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} /></div>
            </>
          )}
        </section>
        <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Create organizer/admin</h2>
          <FormInput id="name" label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <FormInput id="email" label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <FormInput id="password" label="Temporary password (8+ characters)" type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <label htmlFor="role" className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Role</span>
            <select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3">
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create account'}</Button>
        </form>
      </div>
    </main>
  );
}
