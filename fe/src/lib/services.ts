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

// ===== CLIENT-SIDE STATEFUL MOCK CONFIGURATION =====
export const USE_MOCK = true;

// Helper functions for stateful localStorage mock database
const getMockData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setMockData = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const initMockDB = () => {
  if (typeof window === 'undefined') return;

  // Initialize Users
  if (!localStorage.getItem('focusbuddy_users')) {
    setMockData('focusbuddy_users', [
      {
        id: 'mock-user-123',
        email: 'test@gmail.com',
        full_name: 'Nguyễn Văn A',
        phone_number: '0912345678',
        created_at: new Date().toISOString()
      }
    ]);
  }

  // Initialize Academic Terms
  if (!localStorage.getItem('focusbuddy_academic_terms')) {
    setMockData('focusbuddy_academic_terms', {
      items: [
        {
          id: 'term-1',
          display_name: 'Học kỳ 1 - 2026-2027',
          academic_year: '2026-2027',
          semester_type: 'REGULAR',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Courses
  if (!localStorage.getItem('focusbuddy_courses')) {
    setMockData('focusbuddy_courses', {
      items: [
        { id: 'course-1', course_code: 'MATH101', course_name: 'Giải tích 1', credits: 3, course_type: 'COMPULSORY' },
        { id: 'course-2', course_code: 'CS101', course_name: 'Kỹ thuật lập trình', credits: 4, course_type: 'COMPULSORY' },
        { id: 'course-3', course_code: 'CS102', course_name: 'Cấu trúc dữ liệu và giải thuật', credits: 4, course_type: 'COMPULSORY' }
      ]
    });
  }

  // Initialize Study Tasks
  if (!localStorage.getItem('focusbuddy_tasks')) {
    setMockData('focusbuddy_tasks', {
      items: [
        {
          id: 'task-1',
          title: 'Làm bài tập Giải tích 1 (Tuần 1)',
          description: 'Bài tập chương 1 về giới hạn dãy số',
          status: 'TODO',
          priority: 'HIGH',
          deadline: '2026-08-30T23:59:00.000Z',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-2',
          title: 'Cài đặt Stack và Queue bằng C++',
          description: 'Thực hành môn Cấu trúc dữ liệu',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          deadline: '2026-09-02T23:59:00.000Z',
          created_at: new Date().toISOString()
        },
        {
          id: 'task-3',
          title: 'Đọc slide chương 1 Kỹ thuật lập trình',
          description: 'Làm quen với con trỏ trong C/C++',
          status: 'DONE',
          priority: 'LOW',
          deadline: '2026-08-20T23:59:00.000Z',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Study Sessions
  if (!localStorage.getItem('focusbuddy_study_sessions')) {
    setMockData('focusbuddy_study_sessions', {
      items: [
        {
          id: 'session-1',
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          duration_minutes: 90,
          note: 'Học giải tích 1',
          created_at: new Date().toISOString()
        },
        {
          id: 'session-2',
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          note: 'Lập trình C++',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Goals
  if (!localStorage.getItem('focusbuddy_goals')) {
    setMockData('focusbuddy_goals', {
      items: [
        {
          id: 'goal-1',
          title: 'Đạt GPA học kỳ trên 3.6',
          target_value: 3.6,
          unit: 'GPA',
          end_date: '2027-01-15',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        },
        {
          id: 'goal-2',
          title: 'Học nhóm tối thiểu 10 tiếng/tuần',
          target_value: 10,
          unit: 'giờ',
          end_date: '2026-09-10',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Chat Sessions
  if (!localStorage.getItem('focusbuddy_chat_sessions')) {
    setMockData('focusbuddy_chat_sessions', [
      {
        id: 'session-chat-1',
        user_id: 'mock-user-123',
        title: 'Lên kế hoạch ôn thi Giải tích 1',
        started_at: '2026-08-25T14:30:00.000Z'
      },
      {
        id: 'session-chat-2',
        user_id: 'mock-user-123',
        title: 'Hỏi về phương pháp Pomodoro',
        started_at: '2026-08-24T09:15:00.000Z'
      }
    ]);
  }

  // Initialize Chat Messages
  if (!localStorage.getItem('focusbuddy_chat_messages')) {
    setMockData('focusbuddy_chat_messages', {
      'session-chat-1': [
        {
          id: 'msg-1',
          session_id: 'session-chat-1',
          sender_type: 'BOT',
          content: 'Xin chào! Mình có thể giúp gì cho bạn trong việc ôn thi Giải tích 1?',
          message_type: 'TEXT',
          created_at: '2026-08-25T14:30:00.000Z'
        },
        {
          id: 'msg-2',
          session_id: 'session-chat-1',
          sender_type: 'USER',
          content: 'Mình muốn lập kế hoạch ôn thi trong vòng 2 tuần tới.',
          message_type: 'TEXT',
          created_at: '2026-08-25T14:31:00.000Z'
        },
        {
          id: 'msg-3',
          session_id: 'session-chat-1',
          sender_type: 'BOT',
          content: "Tuyệt vời! Giải tích 1 thường tập trung vào 3 phần chính:\n1. Giới hạn và liên tục\n2. Đạo hàm và tích phân hàm một biến\n3. Chuỗi số và chuỗi lũy thừa.\n\nBạn có muốn chia lịch ôn mỗi phần trong 4 ngày, và dành 2 ngày cuối luyện đề thi thử không?",
          message_type: 'TEXT',
          created_at: '2026-08-25T14:32:00.000Z'
        }
      ],
      'session-chat-2': [
        {
          id: 'msg-4',
          session_id: 'session-chat-2',
          sender_type: 'BOT',
          content: 'Chào bạn! Bạn đã biết về phương pháp Pomodoro chưa?',
          message_type: 'TEXT',
          created_at: '2026-08-24T09:15:00.000Z'
        }
      ]
    });
  }

  // Initialize Grades
  if (!localStorage.getItem('focusbuddy_grades')) {
    setMockData('focusbuddy_grades', [
      {
        id: 'grade-1',
        course_id: 'course-1',
        academic_term_id: 'term-1',
        score_process: 8.5,
        score_midterm: 9.0,
        score_final: 8.0,
        total_score: 8.45,
        letter_grade: 'A',
        grade_point: 4.0,
        status: 'PASSED',
        attempt_number: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'grade-2',
        course_id: 'course-2',
        academic_term_id: 'term-1',
        score_process: 7.5,
        score_midterm: 8.0,
        score_final: 7.8,
        total_score: 7.77,
        letter_grade: 'B+',
        grade_point: 3.5,
        status: 'PASSED',
        attempt_number: 1,
        created_at: new Date().toISOString()
      }
    ]);
  }

  // Initialize Emotions
  if (!localStorage.getItem('focusbuddy_emotions')) {
    setMockData('focusbuddy_emotions', {
      items: [
        {
          id: 'emotion-1',
          emotion: 'HAPPY',
          stress_level: 3,
          motivation_level: 8,
          energy_level: 7,
          note: 'Học nhóm rất vui và hiệu quả',
          recorded_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'emotion-2',
          emotion: 'NEUTRAL',
          stress_level: 5,
          motivation_level: 6,
          energy_level: 6,
          note: 'Một ngày học bình thường',
          recorded_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Assessments
  if (!localStorage.getItem('focusbuddy_assessments')) {
    setMockData('focusbuddy_assessments', {
      items: [
        {
          id: 'assess-1',
          assessment_type: 'Đánh giá Stress & Sức khỏe tinh thần',
          stress_score: 12,
          anxiety_score: 8,
          burnout_score: 10,
          risk_level: 'LOW',
          recommendation: 'Tình trạng tinh thần của bạn khá tốt. Hãy tiếp tục duy trì lối sống lành mạnh!',
          created_at: new Date().toISOString()
        }
      ]
    });
  }

  // Initialize Notifications
  if (!localStorage.getItem('focusbuddy_notifications')) {
    setMockData('focusbuddy_notifications', {
      items: [
        {
          id: 'noti-1',
          title: 'Hạn chót nhiệm vụ sắp đến',
          content: 'Nhiệm vụ "Làm bài tập Giải tích 1 (Tuần 1)" sắp đến hạn chót vào ngày 30/08.',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'noti-2',
          title: 'Chuỗi tập trung đã đạt 2 ngày!',
          content: 'Bạn đang duy trì thói quen học tập rất tốt, tiếp tục phát huy nhé!',
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    });
  }
};

// Run DB Initialization
initMockDB();


// ===== USER SERVICE =====
export const userService = {
  create: (data: UserCreate) => {
    if (USE_MOCK) {
      const users = getMockData<any[]>('focusbuddy_users', []);
      const newUser = {
        id: `mock-user-${Date.now()}`,
        email: data.email,
        full_name: data.full_name,
        phone_number: data.phone_number,
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      setMockData('focusbuddy_users', users);
      return Promise.resolve({ data: newUser });
    }
    return api.post<User>('/v1/users', data);
  },

  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const users = getMockData<any[]>('focusbuddy_users', []);
      return Promise.resolve({
        data: {
          users: users.slice(skip, skip + limit),
          total: users.length,
        } as unknown as UserListResponse,
      });
    }
    return api.get<UserListResponse>('/v1/users', { params: { skip, limit } });
  },

  getById: (userId: string) => {
    if (USE_MOCK) {
      const users = getMockData<any[]>('focusbuddy_users', []);
      const user = users.find((u) => u.id === userId);
      if (user) {
        return Promise.resolve({ data: user });
      }
      return Promise.reject(new Error('User not found'));
    }
    return api.get<User>(`/v1/users/${userId}`);
  },

  update: (userId: string, data: Partial<User>) => {
    if (USE_MOCK) {
      const users = getMockData<any[]>('focusbuddy_users', []);
      const index = users.findIndex((u) => u.id === userId);
      if (index !== -1) {
        users[index] = { ...users[index], ...data };
        setMockData('focusbuddy_users', users);
        return Promise.resolve({ data: users[index] });
      }
      return Promise.reject(new Error('User not found'));
    }
    return api.put<User>(`/v1/users/${userId}`, data);
  },

  delete: (userId: string) => {
    if (USE_MOCK) {
      const users = getMockData<any[]>('focusbuddy_users', []);
      const filtered = users.filter((u) => u.id !== userId);
      setMockData('focusbuddy_users', filtered);
      return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/v1/users/${userId}`);
  },
};

// ===== ACADEMIC TERM SERVICE =====
export const academicTermService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const terms = getMockData<any>('focusbuddy_academic_terms', { items: [] });
      return Promise.resolve({ data: terms });
    }
    return api.get<AcademicTermListResponse>('/v1/academic-terms', { params: { skip, limit } });
  },

  create: (data: any) => {
    if (USE_MOCK) {
      const terms = getMockData<any>('focusbuddy_academic_terms', { items: [] });
      const newTerm = {
        id: `term-${Date.now()}`,
        display_name: data.display_name,
        academic_year: data.academic_year,
        semester_type: data.semester_type || 'REGULAR',
        created_at: new Date().toISOString(),
      };
      terms.items.push(newTerm);
      setMockData('focusbuddy_academic_terms', terms);
      return Promise.resolve({ data: newTerm as unknown as AcademicTerm });
    }
    return api.post<AcademicTerm>('/v1/academic-terms', data);
  },
};

// ===== COURSE SERVICE =====
export const courseService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const courses = getMockData<any>('focusbuddy_courses', { items: [] });
      return Promise.resolve({ data: courses });
    }
    return api.get<CourseListResponse>('/v1/courses', { params: { skip, limit } });
  },
  create: (data: any) => {
    if (USE_MOCK) {
      const courses = getMockData<any>('focusbuddy_courses', { items: [] });
      const newCourse = {
        id: `course-${Date.now()}`,
        course_code: data.course_code.toUpperCase(),
        course_name: data.course_name,
        credits: data.credits,
        course_type: data.course_type || 'COMPULSORY',
      };
      courses.items.push(newCourse);
      setMockData('focusbuddy_courses', courses);
      return Promise.resolve({ data: newCourse as unknown as Course });
    }
    return api.post<Course>('/v1/courses', data);
  },
};

// ===== STUDY TASK SERVICE =====
export const studyTaskService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const tasks = getMockData<any>('focusbuddy_tasks', { items: [] });
      return Promise.resolve({ data: tasks });
    }
    return api.get<StudyTaskListResponse>('/v1/study-tasks', { params: { skip, limit } });
  },

  create: (data: StudyTaskCreate) => {
    if (USE_MOCK) {
      const tasks = getMockData<any>('focusbuddy_tasks', { items: [] });
      const newTask = {
        id: `task-${Date.now()}`,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'TODO',
        deadline: data.deadline,
        created_at: new Date().toISOString(),
      };
      tasks.items.push(newTask);
      setMockData('focusbuddy_tasks', tasks);
      return Promise.resolve({ data: newTask as unknown as StudyTask });
    }
    return api.post<StudyTask>('/v1/study-tasks', data);
  },

  update: (taskId: string, data: Partial<StudyTask>) => {
    if (USE_MOCK) {
      const tasks = getMockData<any>('focusbuddy_tasks', { items: [] });
      const index = tasks.items.findIndex((t: any) => t.id === taskId);
      if (index !== -1) {
        tasks.items[index] = { ...tasks.items[index], ...data };
        setMockData('focusbuddy_tasks', tasks);
        return Promise.resolve({ data: tasks.items[index] as unknown as StudyTask });
      }
      return Promise.reject(new Error('Task not found'));
    }
    return api.put<StudyTask>(`/v1/study-tasks/${taskId}`, data);
  },

  delete: (taskId: string) => {
    if (USE_MOCK) {
      const tasks = getMockData<any>('focusbuddy_tasks', { items: [] });
      tasks.items = tasks.items.filter((t: any) => t.id !== taskId);
      setMockData('focusbuddy_tasks', tasks);
      return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/v1/study-tasks/${taskId}`);
  },
};

// ===== STUDY SESSION SERVICE =====
export const studySessionService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const sessions = getMockData<any>('focusbuddy_study_sessions', { items: [] });
      return Promise.resolve({ data: sessions });
    }
    return api.get<StudySessionListResponse>('/v1/study-sessions', { params: { skip, limit } });
  },

  create: (data: Partial<StudySession>) => {
    if (USE_MOCK) {
      const sessions = getMockData<any>('focusbuddy_study_sessions', { items: [] });
      const newSession = {
        id: `session-${Date.now()}`,
        start_time: data.start_time || new Date().toISOString(),
        end_time: data.end_time || new Date().toISOString(),
        duration_minutes: data.duration_minutes || 0,
        note: data.note || '',
        created_at: new Date().toISOString(),
      };
      sessions.items.push(newSession);
      setMockData('focusbuddy_study_sessions', sessions);
      return Promise.resolve({ data: newSession as unknown as StudySession });
    }
    return api.post<StudySession>('/v1/study-sessions', data);
  },
};

// ===== LEARNING GOAL SERVICE =====
export const learningGoalService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const goals = getMockData<any>('focusbuddy_goals', { items: [] });
      return Promise.resolve({ data: goals });
    }
    return api.get<LearningGoalListResponse>('/v1/learning-goals', { params: { skip, limit } });
  },

  create: (data: Partial<LearningGoal>) => {
    if (USE_MOCK) {
      const goals = getMockData<any>('focusbuddy_goals', { items: [] });
      const newGoal = {
        id: `goal-${Date.now()}`,
        title: data.title,
        target_value: data.target_value,
        unit: data.unit,
        end_date: data.end_date,
        status: data.status || 'ACTIVE',
        created_at: new Date().toISOString(),
      };
      goals.items.push(newGoal);
      setMockData('focusbuddy_goals', goals);
      return Promise.resolve({ data: newGoal as unknown as LearningGoal });
    }
    return api.post<LearningGoal>('/v1/learning-goals', data);
  },

  update: (goalId: string, data: Partial<LearningGoal>) => {
    if (USE_MOCK) {
      const goals = getMockData<any>('focusbuddy_goals', { items: [] });
      const index = goals.items.findIndex((g: any) => g.id === goalId);
      if (index !== -1) {
        goals.items[index] = { ...goals.items[index], ...data };
        setMockData('focusbuddy_goals', goals);
        return Promise.resolve({ data: goals.items[index] as unknown as LearningGoal });
      }
      return Promise.reject(new Error('Goal not found'));
    }
    return api.put<LearningGoal>(`/v1/learning-goals/${goalId}`, data);
  },
};

// ===== EMOTION LOG SERVICE =====
export const emotionLogService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const emotions = getMockData<any>('focusbuddy_emotions', { items: [] });
      return Promise.resolve({ data: emotions });
    }
    return api.get<EmotionLogListResponse>('/v1/emotions', { params: { skip, limit } });
  },

  create: (data: Partial<EmotionLog>) => {
    if (USE_MOCK) {
      const emotions = getMockData<any>('focusbuddy_emotions', { items: [] });
      const newLog = {
        id: `emotion-${Date.now()}`,
        emotion: data.emotion || 'NEUTRAL',
        stress_level: data.stress_level || 5,
        motivation_level: data.motivation_level || 5,
        energy_level: data.energy_level || 5,
        note: data.note || '',
        recorded_at: data.recorded_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      emotions.items.unshift(newLog);
      setMockData('focusbuddy_emotions', emotions);
      return Promise.resolve({ data: newLog as unknown as EmotionLog });
    }
    return api.post<EmotionLog>('/v1/emotions', data);
  },
};

// ===== MENTAL ASSESSMENT SERVICE =====
export const mentalAssessmentService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const assessments = getMockData<any>('focusbuddy_assessments', { items: [] });
      return Promise.resolve({ data: assessments });
    }
    return api.get<MentalAssessmentListResponse>('/v1/assessments', { params: { skip, limit } });
  },
};

const getSmartAIResponse = (userInput: string): string => {
  const inputLower = userInput.toLowerCase();
  if (inputLower.includes('pomodoro')) {
    return "Phương pháp Pomodoro là một kỹ thuật quản lý thời gian cực kỳ hiệu quả!\n\nCách thực hiện rất đơn giản:\n1. Chọn một nhiệm vụ bạn cần làm (ví dụ: làm bài tập toán, lập trình).\n2. Đặt đồng hồ đếm ngược 25 phút.\n3. Tập trung cao độ làm việc trong 25 phút đó (không điện thoại, không Facebook).\n4. Sau khi hết 25 phút, nghỉ ngơi thư giãn 5 phút.\n5. Lặp lại chu kỳ! Sau mỗi 4 chu kỳ Pomodoro, bạn hãy nghỉ dài hơn khoảng 15-30 phút để nạp lại năng lượng.\n\nBạn có muốn mình lên lịch hoặc tạo một nhiệm vụ Pomodoro cho bạn không?";
  }
  if (inputLower.includes('stress') || inputLower.includes('mệt') || inputLower.includes('áp lực') || inputLower.includes('lo lắng')) {
    return "Học tập quả thực có những lúc rất mệt mỏi và áp lực. Bạn đừng lo lắng quá nhé, cảm xúc này hoàn toàn bình thường.\n\nĐể cải thiện tinh thần lúc này, bạn có thể:\n- Uống một cốc nước ấm.\n- Nhắm mắt thư giãn và hít thở sâu trong 2-3 phút.\n- Chia sẻ với bạn bè hoặc đi dạo nhẹ nhàng.\n\nNgoài ra, bạn có thể vào trang Sức khỏe tinh thần của FocusBuddy để làm bài đánh giá tâm lý hoặc ghi chép nhật ký cảm xúc. Mình luôn ở đây để lắng nghe và hỗ trợ bạn!";
  }
  if (inputLower.includes('ôn thi') || inputLower.includes('học tập') || inputLower.includes('gpa') || inputLower.includes('kế hoạch')) {
    return "Để ôn thi hiệu quả và cải thiện GPA học kỳ này, bạn hãy:\n1. Đặt mục tiêu học tập rõ ràng trên trang Mục tiêu (Ví dụ: Học 10 tiếng môn Giải tích tuần này).\n2. Lên danh sách các nhiệm vụ cần ôn luyện trong Lịch học & Nhiệm vụ.\n3. Sử dụng đồng hồ tập trung khi học.\n\nBạn muốn lập kế hoạch ôn thi cụ thể cho môn học nào trước? Mình có thể hỗ trợ bạn liệt kê các chương trọng tâm!";
  }
  return `Chào bạn! Mình là trợ lý học tập FocusBuddy AI 🎓. Mình đã nhận được tin nhắn của bạn: "${userInput}".\n\nĐể học tập hiệu quả hôm nay, mình khuyên bạn nên kiểm tra danh sách nhiệm vụ trên Dashboard và thực hiện tập trung ôn tập. Nếu bạn cần lên kế hoạch ôn thi hay có thắc mắc bài tập nào, cứ hỏi mình nhé!`;
};

// ===== CHAT SERVICE =====
export const chatService = {
  getSessions: (skip = 0, limit = 50) => {
    if (USE_MOCK) {
      const sessions = getMockData<ChatSession[]>('focusbuddy_chat_sessions', []);
      return Promise.resolve({ data: sessions });
    }
    return api.get<ChatSession[]>('/v1/chat/sessions', { params: { skip, limit } });
  },

  createSession: (title?: string) => {
    if (USE_MOCK) {
      const sessions = getMockData<ChatSession[]>('focusbuddy_chat_sessions', []);
      const newSession: ChatSession = {
        id: `session-chat-${Date.now()}`,
        user_id: 'mock-user-123',
        title: title || 'Cuộc trò chuyện mới',
        started_at: new Date().toISOString(),
      };
      sessions.unshift(newSession);
      setMockData('focusbuddy_chat_sessions', sessions);
      return Promise.resolve({ data: newSession });
    }
    return api.post<ChatSession>('/v1/chat/sessions', { title });
  },

  getMessages: (sessionId: string, skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const messagesMap = getMockData<Record<string, ChatMessage[]>>('focusbuddy_chat_messages', {});
      const sessionMessages = messagesMap[sessionId] || [];
      return Promise.resolve({ data: sessionMessages });
    }
    return api.get<ChatMessage[]>(`/v1/chat/sessions/${sessionId}/messages`, { params: { skip, limit } });
  },

  sendMessage: (sessionId: string, data: ChatMessageCreate) => {
    if (USE_MOCK) {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        session_id: sessionId,
        sender_type: 'USER',
        content: data.content,
        message_type: 'TEXT',
        created_at: new Date().toISOString(),
      };
      const messagesMap = getMockData<Record<string, ChatMessage[]>>('focusbuddy_chat_messages', {});
      if (!messagesMap[sessionId]) messagesMap[sessionId] = [];
      messagesMap[sessionId].push(userMsg);

      const aiReplyText = getSmartAIResponse(data.content);
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        session_id: sessionId,
        sender_type: 'BOT',
        content: aiReplyText,
        message_type: 'TEXT',
        created_at: new Date().toISOString(),
      };
      messagesMap[sessionId].push(aiMsg);
      setMockData('focusbuddy_chat_messages', messagesMap);

      return Promise.resolve({ data: userMsg });
    }
    return api.post<ChatMessage>(`/v1/chat/sessions/${sessionId}/messages`, data);
  },

  sendMessageStream: async function* (sessionId: string, data: ChatMessageCreate) {
    if (USE_MOCK) {
      // 1. Lưu tin nhắn User
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        session_id: sessionId,
        sender_type: 'USER',
        content: data.content,
        message_type: 'TEXT',
        created_at: new Date().toISOString(),
      };
      const messagesMap = getMockData<Record<string, ChatMessage[]>>('focusbuddy_chat_messages', {});
      if (!messagesMap[sessionId]) messagesMap[sessionId] = [];
      messagesMap[sessionId].push(userMsg);
      setMockData('focusbuddy_chat_messages', messagesMap);

      // 2. Tạo câu trả lời AI
      const aiReplyText = getSmartAIResponse(data.content);

      // 3. Yield các cụm chữ kèm độ trễ để tạo hiệu ứng gõ chữ
      const chunkSize = 6;
      for (let i = 0; i < aiReplyText.length; i += chunkSize) {
        await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 40));
        yield aiReplyText.slice(i, i + chunkSize);
      }

      // 4. Lưu tin nhắn AI khi hoàn tất stream
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        session_id: sessionId,
        sender_type: 'BOT',
        content: aiReplyText,
        message_type: 'TEXT',
        created_at: new Date().toISOString(),
      };

      const latestMessagesMap = getMockData<Record<string, ChatMessage[]>>('focusbuddy_chat_messages', {});
      if (!latestMessagesMap[sessionId]) latestMessagesMap[sessionId] = [];
      latestMessagesMap[sessionId].push(aiMsg);
      setMockData('focusbuddy_chat_messages', latestMessagesMap);
      return;
    }

    const userId = localStorage.getItem('focusbuddy_user_id');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8018/api';
    const response = await fetch(`${baseUrl}/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.body) throw new Error('No response body');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },
};

// Helper to calculate rank based on cumulative GPA
const getRankFromGPA = (gpa: number): string => {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  return 'Yếu';
};

// ===== GRADE SERVICE =====
export const gradeService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      return Promise.resolve({ data: grades });
    }
    return api.get('/v1/grades', { params: { skip, limit } });
  },
  create: (data: any) => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      const newGrade = {
        id: `grade-${Date.now()}`,
        course_id: data.course_id,
        academic_term_id: data.academic_term_id,
        score_process: data.score_process,
        score_midterm: data.score_midterm,
        score_final: data.score_final,
        total_score: data.total_score,
        letter_grade: data.letter_grade || '-',
        grade_point: data.grade_point || 0.0,
        status: data.status || 'PASSED',
        attempt_number: data.attempt_number || 1,
        created_at: new Date().toISOString(),
      };
      grades.push(newGrade);
      setMockData('focusbuddy_grades', grades);
      return Promise.resolve({ data: newGrade });
    }
    return api.post('/v1/grades', data);
  },
  update: (gradeId: string, data: any) => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      const index = grades.findIndex((g) => g.id === gradeId);
      if (index !== -1) {
        grades[index] = { ...grades[index], ...data };
        setMockData('focusbuddy_grades', grades);
        return Promise.resolve({ data: grades[index] });
      }
      return Promise.reject(new Error('Grade not found'));
    }
    return api.put(`/v1/grades/${gradeId}`, data);
  },
  delete: (gradeId: string) => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      const filtered = grades.filter((g) => g.id !== gradeId);
      setMockData('focusbuddy_grades', filtered);
      return Promise.resolve({ data: { success: true } });
    }
    return api.delete(`/v1/grades/${gradeId}`);
  },
};

// ===== ACADEMIC PERFORMANCE SERVICE =====
export const academicPerformanceService = {
  getStatistics: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      const termsRes = getMockData<any>('focusbuddy_academic_terms', { items: [] });
      const coursesRes = getMockData<any>('focusbuddy_courses', { items: [] });

      const terms = termsRes.items || [];
      const courses = coursesRes.items || [];

      const stats: AcademicStatistic[] = [];
      let totalWeightedPoints = 0;
      let totalCumulativeCredits = 0;

      const sortedTerms = [...terms].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

      sortedTerms.forEach(term => {
        const termGrades = grades.filter(g => g.academic_term_id === term.id);
        let semesterWeightedPoints = 0;
        let semesterCredits = 0;
        let semesterCompletedCredits = 0;
        let semesterFailedCourses = 0;

        termGrades.forEach(grade => {
          const course = courses.find(c => c.id === grade.course_id);
          const credits = course ? course.credits : 3;

          semesterWeightedPoints += (grade.grade_point || 0) * credits;
          semesterCredits += credits;

          if (grade.status === 'PASSED') {
            semesterCompletedCredits += credits;
          } else {
            semesterFailedCourses += 1;
          }
        });

        const semesterGpa = semesterCredits > 0 ? semesterWeightedPoints / semesterCredits : 0;

        totalWeightedPoints += semesterWeightedPoints;
        totalCumulativeCredits += semesterCredits;
        const cumulativeGpa = totalCumulativeCredits > 0 ? totalWeightedPoints / totalCumulativeCredits : 0;

        stats.push({
          id: `stat-${term.id}`,
          student_profile_id: 'mock-user-123',
          semester_id: term.id,
          semester_gpa: Math.round(semesterGpa * 100) / 100,
          cumulative_gpa: Math.round(cumulativeGpa * 100) / 100,
          total_credits: semesterCredits,
          completed_credits: semesterCompletedCredits,
          failed_courses: semesterFailedCourses,
          rank: getRankFromGPA(cumulativeGpa),
          updated_at: new Date().toISOString(),
        });
      });

      return Promise.resolve({ data: stats.reverse() });
    }
    return api.get<AcademicStatistic[]>('/v1/academic-performance', { params: { skip, limit } });
  },
  getBasicStatistics: () => {
    if (USE_MOCK) {
      const grades = getMockData<any[]>('focusbuddy_grades', []);
      const coursesRes = getMockData<any>('focusbuddy_courses', { items: [] });
      const courses = coursesRes.items || [];

      let totalWeightedPoints = 0;
      let totalCredits = 0;
      let completedCourses = 0;
      let failedCourses = 0;
      let highestScore = 0;
      let lowestScore = 10;

      grades.forEach(grade => {
        const course = courses.find(c => c.id === grade.course_id);
        const credits = course ? course.credits : 3;

        totalWeightedPoints += (grade.grade_point || 0) * credits;
        totalCredits += credits;

        if (grade.status === 'PASSED') {
          completedCourses += 1;
        } else {
          failedCourses += 1;
        }

        const score = grade.total_score || 0;
        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;
      });

      const averageScore = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;

      return Promise.resolve({
        data: {
          total_courses: grades.length,
          completed_courses: completedCourses,
          failed_courses: failedCourses,
          average_score: Math.round(averageScore * 100) / 100,
          highest_score: highestScore,
          lowest_score: grades.length > 0 ? lowestScore : 0,
        }
      });
    }
    return api.get<{
      total_courses: number;
      completed_courses: number;
      failed_courses: number;
      average_score: number;
      highest_score: number;
      lowest_score: number;
    }>('/v1/academic-performance/basic-statistics');
  },
};

// ===== HEALTH CHECK =====
export const healthCheck = () => {
  if (USE_MOCK) {
    return Promise.resolve({ status: 200, data: 'pong' });
  }
  return api.get('/v1/ping');
};

// ===== NOTIFICATION SERVICE =====
export const notificationService = {
  getAll: (skip = 0, limit = 100) => {
    if (USE_MOCK) {
      const notifications = getMockData<any>('focusbuddy_notifications', { items: [] });
      return Promise.resolve({ data: notifications });
    }
    return api.get<NotificationListResponse>('/v1/notifications', { params: { skip, limit } });
  },
  markRead: (notiId: string) => {
    if (USE_MOCK) {
      const notifications = getMockData<any>('focusbuddy_notifications', { items: [] });
      const index = notifications.items.findIndex((n: any) => n.id === notiId);
      if (index !== -1) {
        notifications.items[index].is_read = true;
        setMockData('focusbuddy_notifications', notifications);
        return Promise.resolve({ data: notifications.items[index] as unknown as Notification });
      }
      return Promise.reject(new Error('Notification not found'));
    }
    return api.put<Notification>(`/v1/notifications/${notiId}/read`);
  },
  markAllRead: () => {
    if (USE_MOCK) {
      const notifications = getMockData<any>('focusbuddy_notifications', { items: [] });
      notifications.items.forEach((n: any) => {
        n.is_read = true;
      });
      setMockData('focusbuddy_notifications', notifications);
      return Promise.resolve({ data: { success: true } });
    }
    return api.post('/v1/notifications/read-all');
  },
};
