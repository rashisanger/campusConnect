import axios from 'axios';

export const TOKEN_KEY = 'campusconnect_token';

const configuredApiUrl = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://campusconnect-3ods.onrender.com/api');
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');
const apiBaseUrl = /\/api$/i.test(normalizedApiUrl)
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('campusconnect:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
