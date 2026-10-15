import api from './api';

export async function createUser(payload) {
  const response = await api.post('/admin/users', payload);
  return response.data.user;
}

export async function getUsers(params = {}) {
  const response = await api.get('/admin/users', { params });
  return response.data;
}

export async function getAdminEvents(params = {}) {
  const response = await api.get('/admin/events', { params });
  return response.data;
}

export async function updateUser(userId, updates) {
  const response = await api.patch(`/admin/users/${userId}`, updates);
  return response.data.user;
}

export async function deleteUser(userId) {
  await api.delete(`/admin/users/${userId}`);
}
