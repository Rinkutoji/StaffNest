import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/ems/backend',
});

// Attach the saved token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected/expired, clear the session so the app
// falls back to the correct login screen instead of showing broken data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const rawUser = localStorage.getItem('ems_user');
      let role = null;
      try {
        role = rawUser ? JSON.parse(rawUser).role : null;
      } catch {
        role = null;
      }

      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');

      const isOnAuthPage = ['/login', '/employee-login', '/register'].some((path) =>
        window.location.pathname.startsWith(path)
      );
      if (!isOnAuthPage) {
        window.location.href = role === 'employee' ? '/employee-login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
