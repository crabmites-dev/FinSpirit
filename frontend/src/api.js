import axios from 'axios';

const getApiBase = () => {
  const env = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (env) {
    return env.endsWith('/api') ? env : `${env}/api`;
  }
  return '/api';
};

const api = axios.create({
  withCredentials: true,
  timeout: 30000,
});

export function getApiErrorMessage(error, fallback = 'Une erreur est survenue') {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Délai de connexion dépassé. Le serveur met trop de temps à répondre.';
  }
  if (error?.message === 'Network Error') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }
  return fallback;
}

// Axios traite "/auth/login" comme chemin absolu → évite le préfixe /api
api.interceptors.request.use((config) => {
  const path = (config.url || '').replace(/^\//, '');
  config.url = `${getApiBase()}/${path}`;

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
