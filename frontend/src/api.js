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
});

// Axios traite "/auth/login" comme chemin absolu → évite le préfixe /api
api.interceptors.request.use((config) => {
  const path = (config.url || '').replace(/^\//, '');
  config.url = `${getApiBase()}/${path}`;
  return config;
});

export default api;
