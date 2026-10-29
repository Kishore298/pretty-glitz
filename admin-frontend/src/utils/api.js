import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Interceptor to inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized request, redirecting to login...');
      // If unauthorized on protected routes (not auth endpoints), clear stale token
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
