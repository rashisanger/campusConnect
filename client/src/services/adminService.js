import api from './api';

export async function createUser(payload) {
  const response = await api.post('/admin/users', payload);
  return response.data.user;
}

export async function getUsers(params = {}) {
  const response = await api.get('/admin/users', { params });
  return response.data;
}
