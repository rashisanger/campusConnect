import api from './api';

export async function getStudentDashboard() {
  const response = await api.get('/dashboards/student');
  return response.data;
}

export async function getOrganizerDashboard() {
  const response = await api.get('/dashboards/organizer');
  return response.data;
}

export async function getAdminDashboard() {
  const response = await api.get('/dashboards/admin');
  return response.data;
}
