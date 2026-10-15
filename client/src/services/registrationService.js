import api from './api';

export async function register(eventId) {
  const response = await api.post('/registrations', { eventId });
  return response.data.registration;
}

export async function cancelRegistration(registrationId) {
  const response = await api.patch(`/registrations/${registrationId}/cancel`);
  return response.data.registration;
}

export async function getMyRegistrations(params = {}) {
  const response = await api.get('/registrations/me', { params });
  return response.data;
}

export async function getRegistrationById(registrationId) {
  const response = await api.get(`/registrations/${registrationId}`);
  return response.data.registration;
}

export async function getRegistrationForEvent(eventId) {
  const response = await api.get(`/registrations/event/${eventId}`);
  return response.data.registration;
}
