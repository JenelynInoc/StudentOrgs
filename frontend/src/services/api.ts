import axios, { AxiosInstance } from 'axios';

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Determine which token to use based on the current path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    let token: string | null = null;
    
    if (currentPath.startsWith('/admin')) {
      token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    } else {
      token = typeof window !== 'undefined' ? localStorage.getItem('member_token') : null;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to appropriate login page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('member_token');
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'member_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
