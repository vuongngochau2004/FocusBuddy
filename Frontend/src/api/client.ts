// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthEndpoint = err.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; fullName: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  verifyEmail: (data: { email: string; code: string }) =>
    api.post('/auth/verify-email', data),
  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};


// ── Grade API ─────────────────────────────────────────────────────────────────
export const gradeApi = {
  getAll: (semester?: string) =>
    api.get('/grades', { params: semester ? { semester } : {} }),
  getStats: () => api.get('/grades/stats'),
  create: (data: unknown) => api.post('/grades', data),
  update: (id: string, data: unknown) => api.patch(`/grades/${id}`, data),
  remove: (id: string) => api.delete(`/grades/${id}`),
};

// ── Upload API ────────────────────────────────────────────────────────────────
export const uploadApi = {
  uploadGradeSheet: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ uploadId: string; status: string; message: string }>(
      '/upload/grade-sheet',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      },
    );
  },
  getStatus: (id: string) => api.get(`/upload/${id}/status`),
  getMyFiles: () => api.get('/upload/my-files'),
  remove: (id: string) => api.delete(`/upload/${id}`),
};

// ── Chat API ──────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (data: { sessionId?: string; message: string }) =>
    api.post('/chat', data),
  getSessions: () => api.get('/chat/sessions'),
  getHistory: (sessionId: string) =>
    api.get(`/chat/sessions/${sessionId}/history`),
};
