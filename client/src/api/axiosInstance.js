import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — log user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lt_token');
      localStorage.removeItem('lt_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
