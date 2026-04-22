import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend URI
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
