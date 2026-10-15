import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCategories, getVenues } from '../services/catalogService';
import { createEvent, getMyEvents, updateEvent } from '../services/eventService';
import { localDateAndTimeToUtc, toLocalDateTimeInput } from '../utils/eventDate';

const emptyForm = {
  title: '',
  description: '',
  poster: '',
  category: '',
  tags: '',
  startAt: '',
  endAt: '',
  venue: '',
  capacity: '1',
  registrationDeadline: '',
  status: 'published',
  speakers: [],
  agenda: []
};

function formFromEvent(event) {
  return {
    title: event.title || '',
    description: event.description || '',
    poster: event.poster || '',
    category: event.category?._id || event.category || '',
    tags: (event.tags || []).join(', '),
    startAt: toLocalDateTimeInput(event.schedule?.startAt),
    endAt: toLocalDateTimeInput(event.schedule?.endAt),
    venue: event.venue?._id || event.venue || '',
    capacity: String(event.capacity ?? 1),
    registrationDeadline: toLocalDateTimeInput(event.registrationDeadline),
    status: event.status,
    speakers: event.speakers || [],
    agenda: event.agenda || []
  };
}

function validationMessage(error) {
  return error.response?.data?.message || 'Please review the event details and try again.';
}

export default function EventFormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(eventId);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const requests = [getCategories(), getVenues()];
    if (editing) requests.push(getMyEvents());

    Promise.all(requests)
      .then(([categoryList, venueList, events]) => {
        if (!active) return;
        setCategories(categoryList);
        setVenues(venueList);
        if (editing) {
          const event = events.find((item) => item._id === eventId);
          if (!event) {
            setError('This event is unavailable or you do not have permission to edit it.');
          } else {
            setForm(formFromEvent(event));
          }
        }
      })
      .catch(() => { if (active) setError('Could not load the event form data. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [editing, eventId]);

  function changeField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: '' }));
  }

  function changeItem(section, index, field, value) {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  }

  function addItem(section, item) {
    setForm((current) => ({ ...current, [section]: [...current[section], item] }));
  }

  function removeItem(section, index) {
    setForm((current) => ({ ...current, [section]: current[section].filter((_item, itemIndex) => itemIndex !== index) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        poster: form.poster.trim(),
        category: form.category,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        venue: form.venue,
        schedule: {
          startAt: localDateAndTimeToUtc(form.startAt.slice(0, 10), form.startAt.slice(11)),
          endAt: localDateAndTimeToUtc(form.endAt.slice(0, 10), form.endAt.slice(11))
        },
        capacity: Number(form.capacity),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        speakers: form.speakers.filter((speaker) => speaker.name?.trim()).map((speaker) => ({
          name: speaker.name.trim(),
          designation: speaker.designation?.trim() || '',
          bio: speaker.bio?.trim() || ''
        })),
        agenda: form.agenda.filter((item) => item.title?.trim() && item.time?.trim()).map((item) => ({
          time: item.time.trim(),
          title: item.title.trim(),
          description: item.description?.trim() || ''
        }))
      };
      if (form.status === 'draft' || form.status === 'published') payload.status = form.status;

      const saved = editing
        ? await updateEvent(eventId, payload)
        : await createEvent(payload);
      toast.success(editing ? 'Event updated.' : 'Event created.');
      navigate('/organizer/events', { replace: true, state: { updatedEventId: saved._id } });
    } catch (requestError) {
      const response = requestError.response?.data;
      setError(validationMessage(requestError));
      if (response?.errors) {
        const mappedErrors = {};
        response.errors.forEach(({ field, message }) => {
          const formField = field.startsWith('tags.') ? 'tags' : field;
          mappedErrors[formField] = message;
        });
        setFieldErrors(mappedErrors);
      }
      toast.error(validationMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-4xl px-5 py-12"><LoadingSpinner label="Loading event form…" /></main>;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link to="/organizer/events" className="text-sm font-semibold text-indigo-700">← Manage events</Link>
      <div className="mt-5">
        <p className="text-sm font-semibold text-indigo-700">Organizer tools</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{editing ? 'Edit event' : 'Create an event'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="mt-7 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ErrorState message={error} />
        {editing && error ? null : (
          <>
            <section className="grid gap-5 sm:grid-cols-2">
              <FormInput id="title" name="title" label="Event title" value={form.title} onChange={changeField} required maxLength={150} error={fieldErrors.title} />
              <label htmlFor="category" className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Category</span>
                <select id="category" name="category" value={form.category} onChange={changeField} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <option value="">Choose a category</option>
                  {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
                {fieldErrors.category && <span className="block text-xs text-rose-600">{fieldErrors.category}</span>}
              </label>
              <label htmlFor="description" className="block space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <span>Description</span>
                <textarea id="description" name="description" value={form.description} onChange={changeField} required maxLength={5000} rows={5} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                {fieldErrors.description && <span className="block text-xs text-rose-600">{fieldErrors.description}</span>}
              </label>
              <FormInput id="poster" name="poster" label="Poster URL (optional)" type="url" value={form.poster} onChange={changeField} error={fieldErrors.poster} />
              <FormInput id="tags" name="tags" label="Tags (comma-separated)" value={form.tags} onChange={changeField} error={fieldErrors.tags} />
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Schedule and venue</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <FormInput id="startAt" name="startAt" label="Starts at" type="datetime-local" value={form.startAt} onChange={changeField} required error={fieldErrors['schedule.startAt']} />
                <FormInput id="endAt" name="endAt" label="Ends at" type="datetime-local" value={form.endAt} onChange={changeField} required error={fieldErrors['schedule.endAt']} />
                <FormInput id="registrationDeadline" name="registrationDeadline" label="Registration deadline" type="datetime-local" value={form.registrationDeadline} onChange={changeField} required error={fieldErrors.registrationDeadline} />
                <FormInput id="capacity" name="capacity" label="Capacity" type="number" min="1" value={form.capacity} onChange={changeField} required error={fieldErrors.capacity} />
                <label htmlFor="venue" className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>Venue</span>
                  <select id="venue" name="venue" value={form.venue} onChange={changeField} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <option value="">Choose a venue</option>
                    {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}
                  </select>
                  {fieldErrors.venue && <span className="block text-xs text-rose-600">{fieldErrors.venue}</span>}
                </label>
                {form.status === 'draft' || form.status === 'published' ? (
                  <label htmlFor="status" className="block space-y-2 text-sm font-medium text-slate-700">
                    <span>Visibility</span>
                    <select id="status" name="status" value={form.status} onChange={changeField} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <option value="published">Published</option>
                      <option value="draft">Save as draft</option>
                    </select>
                    {fieldErrors.status && <span className="block text-xs text-rose-600">{fieldErrors.status}</span>}
                  </label>
                ) : <p className="self-center text-sm font-medium capitalize text-slate-600">Status: {form.status}</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Speakers</h2>
                <button type="button" onClick={() => addItem('speakers', { name: '', designation: '', bio: '' })} className="text-sm font-semibold text-indigo-700">+ Add speaker</button>
              </div>
              <div className="mt-4 space-y-4">
                {form.speakers.map((speaker, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                    <FormInput id={`speaker-name-${index}`} label="Name" value={speaker.name} onChange={(event) => changeItem('speakers', index, 'name', event.target.value)} error={fieldErrors[`speakers.${index}.name`]} />
                    <FormInput id={`speaker-role-${index}`} label="Designation" value={speaker.designation || ''} onChange={(event) => changeItem('speakers', index, 'designation', event.target.value)} error={fieldErrors[`speakers.${index}.designation`]} />
                    <FormInput id={`speaker-bio-${index}`} label="Bio" value={speaker.bio || ''} onChange={(event) => changeItem('speakers', index, 'bio', event.target.value)} error={fieldErrors[`speakers.${index}.bio`]} />
                    <button type="button" onClick={() => removeItem('speakers', index)} className="text-left text-xs font-semibold text-rose-600 sm:col-span-3">Remove speaker</button>
                  </div>
                ))}
                {form.speakers.length === 0 && <p className="text-sm text-slate-500">Speaker details are optional.</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Agenda</h2>
                <button type="button" onClick={() => addItem('agenda', { time: '', title: '', description: '' })} className="text-sm font-semibold text-indigo-700">+ Add agenda item</button>
              </div>
              <div className="mt-4 space-y-4">
                {form.agenda.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                    <FormInput id={`agenda-time-${index}`} label="Time" value={item.time} onChange={(event) => changeItem('agenda', index, 'time', event.target.value)} error={fieldErrors[`agenda.${index}.time`]} />
                    <FormInput id={`agenda-title-${index}`} label="Title" value={item.title} onChange={(event) => changeItem('agenda', index, 'title', event.target.value)} error={fieldErrors[`agenda.${index}.title`]} />
                    <FormInput id={`agenda-description-${index}`} label="Description" value={item.description || ''} onChange={(event) => changeItem('agenda', index, 'description', event.target.value)} error={fieldErrors[`agenda.${index}.description`]} />
                    <button type="button" onClick={() => removeItem('agenda', index)} className="text-left text-xs font-semibold text-rose-600 sm:col-span-3">Remove agenda item</button>
                  </div>
                ))}
                {form.agenda.length === 0 && <p className="text-sm text-slate-500">Agenda items are optional.</p>}
              </div>
            </section>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : editing ? 'Save event' : 'Create event'}</Button>
          </>
        )}
      </form>
    </main>
  );
}
