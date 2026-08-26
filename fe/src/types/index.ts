// ===== USER =====
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  avatar_url?: string;
  phone_number?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

// ===== ACADEMIC TERM =====
export interface AcademicTerm {
  id: string;
  display_name: string;
  academic_year: string;
  semester_type: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface AcademicTermListResponse {
  items: AcademicTerm[];
  total: number;
}

// ===== COURSE =====
export interface Course {
  id: string;
  major_id?: string;
  course_code: string;
  course_name: string;
  credits: number;
  course_type?: string;
  description?: string;
  created_at: string;
}

export interface CourseListResponse {
  items: Course[];
  total: number;
}

// ===== STUDY TASK =====
export interface StudyTask {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  deadline?: string;
  completed_at?: string;
  created_at?: string;
}

export interface StudyTaskCreate {
  course_id?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  deadline?: string;
}

export interface StudyTaskListResponse {
  items: StudyTask[];
  total: number;
}

// ===== STUDY SESSION =====
export interface StudySession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  study_method?: string;
  focus_score?: number;
  note?: string;
  created_at: string;
}

export interface StudySessionListResponse {
  items: StudySession[];
  total: number;
}

// ===== LEARNING GOAL =====
export interface LearningGoal {
  id: string;
  user_id: string;
  title: string;
  target_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ACTIVE' | 'ACHIEVED' | 'FAILED';
  created_at: string;
}

export interface LearningGoalListResponse {
  items: LearningGoal[];
  total: number;
}

// ===== EMOTION LOG =====
export interface EmotionLog {
  id: string;
  user_id: string;
  emotion: string;
  stress_level?: number;
  motivation_level?: number;
  energy_level?: number;
  note?: string;
  recorded_at: string;
  created_at: string;
}

export interface EmotionLogListResponse {
  items: EmotionLog[];
  total: number;
}

// ===== MENTAL ASSESSMENT =====
export interface MentalAssessment {
  id: string;
  user_id: string;
  assessment_type?: string;
  stress_score?: number;
  anxiety_score?: number;
  burnout_score?: number;
  risk_level?: string;
  summary?: string;
  recommendation?: string;
  created_at: string;
}

export interface MentalAssessmentListResponse {
  items: MentalAssessment[];
  total: number;
}

// ===== CHAT =====
export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  status?: string;
  started_at: string;
  ended_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type?: 'USER' | 'BOT';
  content: string;
  message_type?: string;
  token_count?: number;
  created_at: string;
  metadata_data?: Record<string, any>;
}

export interface ChatMessageCreate {
  content: string;
  message_type?: string;
}

// ===== GRADE =====
export interface Grade {
  id: string;
  student_course_id: string;
  grade_type: string;
  score: number;
  weight?: number;
  created_at: string;
}

// ===== ACADEMIC STATS =====
export interface AcademicStatistic {
  id: string;
  student_profile_id: string;
  semester_id: string;
  semester_gpa?: number;
  cumulative_gpa?: number;
  total_credits?: number;
  completed_credits?: number;
  failed_courses?: number;
  rank?: string;
  updated_at: string;
}

// ===== NOTIFICATION =====
export interface Notification {
  id: string;
  user_id: string;
  recommendation_id?: string;
  notification_type: 'REMINDER' | 'RECOMMENDATION' | 'SYSTEM' | 'ACADEMIC' | 'MENTAL_HEALTH';
  title: string;
  content: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
}

