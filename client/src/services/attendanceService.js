import api from './api';

export async function checkInByToken(eventId, token) {
  const response = await api.post(`/organizer/events/${eventId}/check-ins`, { token });
  return response.data;
}

export async function checkInByRegistration(eventId, registrationId) {
  const response = await api.post(
    `/organizer/events/${eventId}/registrations/${registrationId}/check-in`
  );
  return response.data;
}

export async function getEventRegistrations(eventId, params = {}) {
  const response = await api.get(`/organizer/events/${eventId}/registrations`, { params });
  return response.data;
}

export async function getEventAttendance(eventId, params = {}) {
  const response = await api.get(`/organizer/events/${eventId}/attendance`, { params });
  return response.data;
}
