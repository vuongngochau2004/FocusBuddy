import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: tự động đính kèm JWT Bearer token vào header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('focusbuddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: xử lý lỗi 401 và lỗi chung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      
      // Nếu 401 xảy ra trên endpoint được bảo vệ (ngoại trừ lúc đang thử login), xóa session và redirect
      const requestUrl = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/v1/auth/login');

      if (error.response.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
        localStorage.removeItem('focusbuddy_token');
        localStorage.removeItem('focusbuddy_user');
        localStorage.removeItem('focusbuddy_user_id');
        localStorage.removeItem('focusbuddy_user_name');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
