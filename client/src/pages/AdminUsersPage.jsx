import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { createUser, deleteUser, getUsers, updateUser } from '../services/adminService';

const initialForm = { name: '', email: '', password: '', role: 'organizer' };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [result, setResult] = useState({ users: [], page: 1, totalPages: 0, totalUsers: 0 });
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyUserId, setBusyUserId] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  async function loadUsers() {
    setError('');
    try {
      setResult(await getUsers({
        page,
        limit: 20,
        role: role || undefined,
        isActive: active || undefined,
        search: appliedSearch || undefined
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load user accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadUsers();
  }, [page, role, active, appliedSearch]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createUser(form);
      toast.success(`${form.role === 'admin' ? 'Admin' : 'Organizer'} account created.`);
      setForm(initialForm);
      setPage(1);
      if (page === 1) await loadUsers();
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

  async function changeUser(userId, updates) {
    setBusyUserId(userId);
    try {
      await updateUser(userId, updates);
      toast.success('User account updated.');
      await loadUsers();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not update this account.';
      setError(message);
      toast.error(message);
    } finally {
      setBusyUserId('');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyUserId(pendingDelete._id);
    setPendingDelete({ ...pendingDelete, message: '' });
    try {
      await deleteUser(pendingDelete._id);
      toast.success('User account deleted.');
      setPendingDelete(null);
      await loadUsers();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not delete this account.';
      setPendingDelete((current) => ({ ...current, message }));
      toast.error(message);
    } finally {
      setBusyUserId('');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-semibold text-indigo-700">Administration</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">User accounts</h1>
      {error && <div className="mt-5"><ErrorState message={error} /></div>}
      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_150px_150px_auto]" onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setAppliedSearch(search.trim());
          }}>
            <label className="sr-only" htmlFor="user-search">Search users</label>
            <input id="user-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <label className="sr-only" htmlFor="user-role-filter">Filter by role</label>
            <select id="user-role-filter" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All roles</option><option value="student">Student</option><option value="organizer">Organizer</option><option value="admin">Admin</option>
            </select>
            <label className="sr-only" htmlFor="user-active-filter">Filter by account status</label>
            <select id="user-active-filter" value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
            <Button type="submit">Search</Button>
          </form>

          {loading ? <div className="mt-5"><LoadingSpinner label="Loading users…" /></div> : result.users.length === 0 ? (
            <div className="mt-5"><EmptyState title="No user accounts found">Change the filters or create an organizer/admin account.</EmptyState></div>
          ) : (
            <>
              <div className="mt-4 text-sm text-slate-500">{result.totalUsers} accounts</div>
              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.users.map((account) => {
                      const isSelf = String(account._id) === String(currentUser?._id || currentUser?.id);
                      const isBusy = busyUserId === account._id;
                      return (
                        <tr key={account._id}>
                          <td className="px-4 py-4"><p className="font-semibold text-slate-900">{account.name}{isSelf && <span className="ml-2 text-xs font-normal text-indigo-700">(you)</span>}</p><p className="mt-1 text-xs text-slate-500">{account.email}</p></td>
                          <td className="px-4 py-4">
                            <label className="sr-only" htmlFor={`role-${account._id}`}>Role for {account.name}</label>
                            <select id={`role-${account._id}`} value={account.role} disabled={isSelf || isBusy} onChange={(event) => changeUser(account._id, { role: event.target.value })} className="rounded-lg border border-slate-300 px-2.5 py-2 capitalize disabled:bg-slate-100">
                              <option value="student">Student</option><option value="organizer">Organizer</option><option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{account.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" disabled={isSelf || isBusy} onClick={() => changeUser(account._id, { isActive: !account.isActive })} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{account.isActive ? 'Deactivate' : 'Activate'}</button>
                              <button type="button" disabled={isSelf || isBusy} onClick={() => setPendingDelete(account)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-6"><Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} /></div>
            </>
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Create organizer/admin</h2>
          <FormInput id="name" label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <FormInput id="email" label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <FormInput id="password" label="Temporary password (8+ characters)" type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <label htmlFor="role" className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Role</span>
            <select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3">
              <option value="organizer">Organizer</option><option value="admin">Admin</option>
            </select>
          </label>
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create account'}</Button>
        </form>
      </div>

      <Modal open={Boolean(pendingDelete)} title="Delete this account?" confirmLabel="Delete user" busy={Boolean(busyUserId)} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete}>
        <p>Delete {pendingDelete?.name} ({pendingDelete?.email})?</p>
        {pendingDelete?.message && <div className="mt-4"><ErrorState message={pendingDelete.message} /></div>}
      </Modal>
    </main>
  );
}
