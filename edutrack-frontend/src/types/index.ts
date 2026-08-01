// src/types/index.ts
export type EducationLevel = 'SINH_VIEN' | 'THPT' | 'THCS';

export interface Grade {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  attendanceScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  letterGrade?: string | null;
  gpa?: number | null;
  status: 'PASSED' | 'FAILED' | 'PENDING' | 'RETAKE';
  semester: string;
  year: number;
  sourceFile?: { id: string; originalName: string } | null;
}

export interface GradeStats {
  totalCourses: number;
  passedCourses: number;
  failedCourses: number;
  cumulativeGpa: number;
  totalCredits: number;
  earnedCredits: number;
  gradeDistribution: Record<string, number>;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR';
  errorMessage?: string | null;
  createdAt: string;
  _count?: { grades: number };
}

export interface UploadStatus extends UploadedFile {
  extractedData?: unknown;
  grades: Array<{
    id: string;
    course: { code: string; name: string };
    totalScore?: number | null;
    gpa?: number | null;
    letterGrade?: string | null;
    status: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  agentType?: 'SUPERVISOR' | 'ACADEMIC' | 'PSYCHOLOGY' | null;
  intentScore?: Record<string, number> | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title?: string | null;
  updatedAt: string;
  _count: { messages: number };
}

export interface PsychologyLog {
  id: string;
  date: string;
  mood: string;
  stressLevel: string;
  sleepHours?: number | null;
  energyLevel?: number | null;
  anxietyScore?: number | null;
  notes?: string | null;
  factors: string[];
}
