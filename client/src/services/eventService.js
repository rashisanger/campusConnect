import api from './api';

export async function getEvents(params = {}) {
  const response = await api.get('/events', { params });
  return response.data;
}

export async function getEventById(eventId) {
  const response = await api.get(`/events/${eventId}`);
  return response.data.event;
}

export async function createEvent(payload) {
  const response = await api.post('/events', payload);
  return response.data.event;
}

export async function updateEvent(eventId, payload) {
  const response = await api.put(`/events/${eventId}`, payload);
  return response.data.event;
}

export async function cancelEvent(eventId) {
  const response = await api.patch(`/events/${eventId}/cancel`);
  return response.data.event;
}

export async function deleteEvent(eventId) {
  await api.delete(`/events/${eventId}`);
}

export async function getMyEvents() {
  const response = await api.get('/organizer/events');
  return response.data.events;
}
