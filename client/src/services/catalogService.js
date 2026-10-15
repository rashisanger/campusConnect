import api from './api';

export async function getCategories() {
  const response = await api.get('/categories');
  return response.data.categories;
}

export async function getVenues() {
  const response = await api.get('/venues');
  return response.data.venues;
}

export async function getAdminCategories() {
  const response = await api.get('/admin/categories');
  return response.data.categories;
}

export async function createCategory(payload) {
  const response = await api.post('/admin/categories', payload);
  return response.data.category;
}

export async function updateCategory(id, payload) {
  const response = await api.put(`/admin/categories/${id}`, payload);
  return response.data.category;
}

export async function deleteCategory(id) {
  await api.delete(`/admin/categories/${id}`);
}

export async function getAdminVenues() {
  const response = await api.get('/admin/venues');
  return response.data.venues;
}

export async function createVenue(payload) {
  const response = await api.post('/admin/venues', payload);
  return response.data.venue;
}

export async function updateVenue(id, payload) {
  const response = await api.put(`/admin/venues/${id}`, payload);
  return response.data.venue;
}

export async function deleteVenue(id) {
  await api.delete(`/admin/venues/${id}`);
}
