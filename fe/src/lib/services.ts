import api from '@/lib/api';
import {
  User,
  UserCreate,
  UserListResponse,
  AcademicTermListResponse,
  CourseListResponse,
  StudyTask,
  StudyTaskCreate,
  StudyTaskListResponse,
  StudySession,
  StudySessionListResponse,
  LearningGoal,
  LearningGoalListResponse,
  EmotionLog,
  MentalAssessment,
  ChatSession,
  ChatMessage,
  ChatMessageCreate,
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
};

// ===== COURSE SERVICE =====
export const courseService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<CourseListResponse>('/v1/courses', { params: { skip, limit } }),
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
    api.get<EmotionLog[]>('/v1/emotions', { params: { skip, limit } }),

  create: (data: Partial<EmotionLog>) =>
    api.post<EmotionLog>('/v1/emotions', data),
};

// ===== MENTAL ASSESSMENT SERVICE =====
export const mentalAssessmentService = {
  getAll: (skip = 0, limit = 100) =>
    api.get<MentalAssessment[]>('/v1/assessments', { params: { skip, limit } }),
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
};

// ===== HEALTH CHECK =====
export const healthCheck = () =>
  api.get('/v1/ping');
