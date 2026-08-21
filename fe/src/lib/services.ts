import api from '@/lib/api';
import {
  User,
  UserCreate,
  UserListResponse,
  AcademicTerm,
  AcademicTermListResponse,
  Course,
  CourseListResponse,
  AcademicStatistic,
  StudyTask,
  StudyTaskCreate,
  StudyTaskListResponse,
  StudySession,
  StudySessionListResponse,
  LearningGoal,
  LearningGoalListResponse,
  EmotionLog,
  EmotionLogListResponse,
  MentalAssessment,
  MentalAssessmentListResponse,
  ChatSession,
  ChatMessage,
  ChatMessageCreate,
  Notification,
  NotificationListResponse,
} from '@/types';

// ===== USER SERVICE =====
export const userService = {
  create: (data: UserCreate) =>
    api.post<User>('/v1/users', data),

  getAll: (skip = 0, limit = 100) =>
    api.get<UserListResponse>('/v1/users', { params: { skip, limit } }),

  getById: (userId: string) =>
    api.get<User>(`/v1/users/${userId}`),

  update: (userId: string, data: Partial<User>) =>
    api.put<User>(`/v1/users/${userId}`, data),

  delete: (userId: string) =>
    api.delete(`/v1/users/${userId}`),
};

// ===== ACADEMIC TERM SERVICE =====
export const academicTermService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<AcademicTermListResponse>('/v1/academic-terms', { params: { skip, limit } }),

  create: (data: any) =>
    api.post<AcademicTerm>('/v1/academic-terms', data),
};

// ===== COURSE SERVICE =====
export const courseService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<CourseListResponse>('/v1/courses', { params: { skip, limit } }),
  create: (data: any) =>
    api.post<Course>('/v1/courses', data),
};

// ===== STUDY TASK SERVICE =====
export const studyTaskService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<StudyTaskListResponse>('/v1/study-tasks', { params: { skip, limit } }),

  create: (data: StudyTaskCreate) =>
    api.post<StudyTask>('/v1/study-tasks', data),

  update: (taskId: string, data: Partial<StudyTask>) =>
    api.put<StudyTask>(`/v1/study-tasks/${taskId}`, data),

  delete: (taskId: string) =>
    api.delete(`/v1/study-tasks/${taskId}`),
};

// ===== STUDY SESSION SERVICE =====
export const studySessionService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<StudySessionListResponse>('/v1/study-sessions', { params: { skip, limit } }),

  create: (data: Partial<StudySession>) =>
    api.post<StudySession>('/v1/study-sessions', data),
};

// ===== LEARNING GOAL SERVICE =====
export const learningGoalService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<LearningGoalListResponse>('/v1/learning-goals', { params: { skip, limit } }),

  create: (data: Partial<LearningGoal>) =>
    api.post<LearningGoal>('/v1/learning-goals', data),

  update: (goalId: string, data: Partial<LearningGoal>) =>
    api.put<LearningGoal>(`/v1/learning-goals/${goalId}`, data),
};

// ===== EMOTION LOG SERVICE =====
export const emotionLogService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<EmotionLogListResponse>('/v1/emotions', { params: { skip, limit } }),

  create: (data: Partial<EmotionLog>) =>
    api.post<EmotionLog>('/v1/emotions', data),
};

// ===== MENTAL ASSESSMENT SERVICE =====
export const mentalAssessmentService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<MentalAssessmentListResponse>('/v1/assessments', { params: { skip, limit } }),
};

// ===== CHAT SERVICE =====
export const chatService = {
  getSessions: (skip = 0, limit = 50) =>
    api.get<ChatSession[]>('/v1/chat/sessions', { params: { skip, limit } }),

  createSession: (title?: string) =>
    api.post<ChatSession>('/v1/chat/sessions', { title }),

  getMessages: (sessionId: string, skip = 0, limit = 100) =>
    api.get<ChatMessage[]>(`/v1/chat/sessions/${sessionId}/messages`, { params: { skip, limit } }),

  sendMessage: (sessionId: string, data: ChatMessageCreate) =>
    api.post<ChatMessage>(`/v1/chat/sessions/${sessionId}/messages`, data),
};

// ===== GRADE SERVICE =====
export const gradeService = {
  getAll: (skip = 0, limit = 100) =>
    api.get('/v1/grades', { params: { skip, limit } }),
  create: (data: any) =>
    api.post('/v1/grades', data),
  update: (gradeId: string, data: any) =>
    api.put(`/v1/grades/${gradeId}`, data),
  delete: (gradeId: string) =>
    api.delete(`/v1/grades/${gradeId}`),
};

// ===== ACADEMIC PERFORMANCE SERVICE =====
export const academicPerformanceService = {
  getStatistics: (skip = 0, limit = 100) =>
    api.get<AcademicStatistic[]>('/v1/academic-performance', { params: { skip, limit } }),
  getBasicStatistics: () =>
    api.get<{
      total_courses: number;
      completed_courses: number;
      failed_courses: number;
      average_score: number;
      highest_score: number;
      lowest_score: number;
    }>('/v1/academic-performance/basic-statistics'),
};

// ===== HEALTH CHECK =====
export const healthCheck = () =>
  api.get('/v1/ping');

// ===== NOTIFICATION SERVICE =====
export const notificationService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<NotificationListResponse>('/v1/notifications', { params: { skip, limit } }),
  markRead: (notiId: string) =>
    api.put<Notification>(`/v1/notifications/${notiId}/read`),
  markAllRead: () =>
    api.post('/v1/notifications/read-all'),
};
