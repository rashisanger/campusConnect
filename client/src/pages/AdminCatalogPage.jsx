import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import {
  createCategory, createVenue, deleteCategory, deleteVenue, getAdminCategories,
  getAdminVenues, updateCategory, updateVenue
} from '../services/catalogService';

const blankCategory = { name: '', description: '' };
const blankVenue = { name: '', building: '', room: '', address: '', lat: '', lng: '' };

export default function AdminCatalogPage({ kind }) {
  const isCategory = kind === 'categories';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(isCategory ? blankCategory : blankVenue);
  const [editingId, setEditingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    setError('');
    try {
      setItems(isCategory ? await getAdminCategories() : await getAdminVenues());
    } catch {
      setError(`Could not load ${kind}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, [kind]);

  function edit(item) {
    setEditingId(item._id);
    setForm(isCategory ? {
      name: item.name,
      description: item.description || ''
    } : {
      name: item.name,
      building: item.building || '',
      room: item.room || '',
      address: item.address || '',
      lat: item.coordinates?.lat ?? '',
      lng: item.coordinates?.lng ?? ''
    });
  }

  function resetForm() {
    setEditingId('');
    setForm(isCategory ? blankCategory : blankVenue);
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const payload = isCategory ? form : {
      name: form.name,
      building: form.building,
      room: form.room,
      address: form.address,
      ...(form.lat !== '' && form.lng !== '' ? { coordinates: { lat: Number(form.lat), lng: Number(form.lng) } } : {})
    };
    try {
      if (isCategory) {
        if (editingId) await updateCategory(editingId, payload);
        else await createCategory(payload);
      } else if (editingId) {
        await updateVenue(editingId, payload);
      } else {
        await createVenue(payload);
      }
      toast.success(`${isCategory ? 'Category' : 'Venue'} ${editingId ? 'updated' : 'created'}.`);
      resetForm();
      await loadItems();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not save this item.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (isCategory) await deleteCategory(deleteTarget._id);
      else await deleteVenue(deleteTarget._id);
      toast.success(`${isCategory ? 'Category' : 'Venue'} deleted.`);
      setDeleteTarget(null);
      await loadItems();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not delete this item.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-12"><LoadingSpinner label={`Loading ${kind}…`} /></main>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-sm font-semibold text-indigo-700">Administration</p>
      <h1 className="mt-1 text-3xl font-bold capitalize tracking-tight text-slate-950">Manage {kind}</h1>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          {error && <div className="mb-4"><ErrorState message={error} /></div>}
          {items.length === 0 ? (
            <EmptyState title={`No ${kind} yet`}>Use the form to add the first one.</EmptyState>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">{item.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{isCategory ? item.description : [item.building, item.room, item.address].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => edit(item)} className="text-sm font-semibold text-indigo-700">Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(item)} className="text-sm font-semibold text-rose-600">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <form onSubmit={save} className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">{editingId ? 'Edit' : 'Add'} {isCategory ? 'category' : 'venue'}</h2>
          <FormInput id="name" label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          {isCategory ? (
            <label htmlFor="description" className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Description</span>
              <textarea id="description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </label>
          ) : (
            <>
              <FormInput id="building" label="Building" value={form.building} onChange={(event) => setForm({ ...form, building: event.target.value })} />
              <FormInput id="room" label="Room" value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} />
              <FormInput id="address" label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <FormInput id="lat" label="Latitude" type="number" step="any" value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} />
                <FormInput id="lng" label="Longitude" type="number" step="any" value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} />
              </div>
              <p className="text-xs text-slate-500">Optional coordinates; provide both values together.</p>
            </>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add'}</Button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Discard</button>}
          </div>
        </form>
      </div>
      <Modal
        open={Boolean(deleteTarget)}
        title={`Delete ${isCategory ? 'category' : 'venue'}?`}
        confirmLabel="Delete"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      >
        If this {isCategory ? 'category' : 'venue'} is used by any event, the server will prevent deletion.
      </Modal>
    </main>
  );
}
