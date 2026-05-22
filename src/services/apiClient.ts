export type Role = 'student' | 'teacher' | 'admin';

export interface ApiUser {
  id: string;
  username: string;
  role: Role;
  displayName: string;
  languagePref: string;
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'published' | 'draft';
  pagesCount?: number;
  exercisesCount?: number;
  recordingsCount?: number;
}

export interface CoursePage {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  pageNumber: number;
  contentHtml: string;
  audioText: string;
  fileUrl?: string;
}

export interface Exercise {
  id: string;
  courseId: string;
  pageNumber: number;
  prompt: string;
  answer: string;
}

export interface Recording {
  id: string;
  studentId: string;
  courseId: string;
  pageNumber: number;
  taskId?: string;
  audioUrl: string;
  filename: string;
  durationSec: number;
  createdAt: string;
}

export interface Lecture {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  videoUrl: string;
  filename: string;
  durationSec: number;
  createdAt: string;
}

const API_BASE_URL = (((import.meta as any).env?.VITE_API_BASE_URL) || 'http://127.0.0.1:3001/api/v1').replace(/\/$/, '');
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '');
const TOKEN_KEY = 'lingobridge_demo_token';
const USER_KEY = 'lingobridge_demo_user';

interface ApiEnvelope<T> {
  code: number;
  data: T;
  message: string;
}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();
  let payload: ApiEnvelope<T>;
  if (contentType.includes('application/json')) {
    try {
      payload = JSON.parse(raw) as ApiEnvelope<T>;
    } catch {
      throw new Error(`API returned invalid JSON for ${path}`);
    }
  } else {
    const preview = raw.trim().slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(
      response.ok
        ? `API route ${path} returned non-JSON content. Check VITE_API_BASE_URL/backend deployment.`
        : `API request failed: ${response.status} ${response.statusText} (${preview || 'non-JSON response'})`
    );
  }
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || `API request failed: ${path}`);
  }
  return payload.data;
}

export function mediaUrl(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE_URL}${path}`;
}

export async function fileToBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',').pop() || '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const authApi = {
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  async register(params: { email: string; password: string; displayName: string; role: 'student' | 'teacher' }) {
    const data = await request<{ token: string; user: ApiUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },
  currentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as ApiUser : null;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const coursesApi = {
  list: () => request<Course[]>('/courses'),
  create: (title: string, description = '') => request<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  }),
  update: (id: string, updates: { title?: string; description?: string; status?: 'published' | 'draft' }) =>
    request<Course>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  pages: (courseId: string) => request<CoursePage[]>(`/courses/${courseId}/pages`),
  exercises: (courseId: string, page?: number) => request<Exercise[]>(`/exercises?courseId=${courseId}${page ? `&page=${page}` : ''}`),
  async uploadCourseware(courseId: string, file: File, lessonNodeId?: string) {
    return request<{ file: unknown; pages: CoursePage[]; exercises: Exercise[]; tasks: LearningTask[]; vocabulary: VocabularyItem[]; warnings?: string[] }>('/coursewares', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        lessonNodeId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: await fileToBase64(file)
      })
    });
  }
};

export interface CourseMemberData {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export const courseMembersApi = {
  list: (courseId: string) => request<CourseMemberData[]>(`/courses/${courseId}/members`),
  add: (courseId: string, email: string) => request<CourseMemberData>(`/courses/${courseId}/members`, {
    method: 'POST',
    body: JSON.stringify({ q: email })
  }),
  addBatch: (courseId: string, userIds: string[]) => request<CourseMemberData[]>(`/courses/${courseId}/members/batch`, {
    method: 'POST',
    body: JSON.stringify({ userIds })
  }),
  search: (courseId: string, q = '') =>
    request<Array<{ id: string; username: string; displayName: string; email: string }>>(`/courses/${courseId}/students/search?q=${encodeURIComponent(q)}`),
  remove: (courseId: string, memberId: string) => request<{ deleted: boolean }>(`/courses/${courseId}/members/${memberId}`, {
    method: 'DELETE'
  })
};

export interface CoursewareFileData {
  id: string;
  filename: string;
  mimeType: string;
  type?: string;
  lessonNodeId?: string;
  storageUrl?: string;
  liveClassTitle?: string;
  pageCount: number;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
}

export const coursewareFilesApi = {
  list: (courseId: string, lessonNodeId?: string) =>
    request<CoursewareFileData[]>(`/coursewares?courseId=${courseId}${lessonNodeId ? `&lessonNodeId=${lessonNodeId}` : ''}`)
};

export interface HomeworkImportResult {
  tasksCount: number;
  vocabCount: number;
  warnings: string[];
  errorRows: string[];
  lessonNodeId?: string;
}

export const assignmentsApi = {
  import: (courseId: string, filename: string, base64: string, lessonNodeId?: string, assignmentNodeId?: string) =>
    request<HomeworkImportResult>('/assignments/import', {
      method: 'POST',
      body: JSON.stringify({ courseId, filename, base64, lessonNodeId, assignmentNodeId })
    }),
  exportBlob: async (courseId: string, lessonNodeId: string): Promise<Blob> => {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/assignments/export?courseId=${courseId}&lessonNodeId=${lessonNodeId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to download homework excel: ${response.statusText}`);
    }
    return response.blob();
  }
};

export interface LessonNodeData {
  id: string;
  courseId: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  styleSeed: number;
  colorToken: string;
  shapeToken: string;
  status: string;
  assignmentNodeId?: string;
  createdAt: string;
  updatedAt: string;
}

export const lessonNodesApi = {
  list: (courseId: string) => request<LessonNodeData[]>(`/courses/${courseId}/lesson-nodes`),
  create: (courseId: string, data: { title: string; startsAt?: string; endsAt?: string }) =>
    request<{ lessonNode: LessonNodeData; assignmentNode: unknown }>(`/courses/${courseId}/lesson-nodes`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: string, data: { title?: string; startsAt?: string; endsAt?: string; status?: string }) =>
    request<LessonNodeData>(`/lesson-nodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
};

export const recordingsApi = {
  list: (courseId: string, page = 1) => request<Recording[]>(`/recordings?courseId=${courseId}&page=${page}`),
  async upload(params: { courseId: string; pageNumber: number; taskId?: string; blob: Blob; durationSec: number; filename?: string }) {
    return request<Recording>('/recordings', {
      method: 'POST',
      body: JSON.stringify({
        courseId: params.courseId,
        pageNumber: params.pageNumber,
        taskId: params.taskId,
        filename: params.filename || `recording-${Date.now()}.webm`,
        durationSec: params.durationSec,
        base64: await fileToBase64(params.blob)
      })
    });
  },
  delete: (id: string) => request<{ deleted: boolean }>(`/recordings/${id}`, { method: 'DELETE' })
};

export const lecturesApi = {
  list: (courseId: string, date?: string) => request<Lecture[]>(`/lectures?courseId=${courseId}${date ? `&date=${date}` : ''}`),
  async upload(params: { courseId: string; title: string; blob: Blob; durationSec: number; filename?: string }) {
    return request<Lecture>('/lectures', {
      method: 'POST',
      body: JSON.stringify({
        courseId: params.courseId,
        title: params.title,
        filename: params.filename || `lecture-${Date.now()}.webm`,
        durationSec: params.durationSec,
        base64: await fileToBase64(params.blob)
      })
    });
  }
};

export interface LearningTask {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  sourceFileId: string;
  taskId: string;
  taskType: 'pronunciation' | 'vocabulary' | 'sentence_reading' | 'dialogue' | 'listening';
  unit: number;
  lesson: number;
  lessonTitle: string;
  pageNumber: number;
  zhText: string;
  pinyin: string;
  translationRu: string;
  translationKk: string;
  prompt: string;
  answer: string;
  initial: string;
  final: string;
  tone: string;
  rhymeGroup: string;
  difficulty: number;
  dueAt: string;
  publishToHomework: boolean;
  publishToVocab: boolean;
  sortOrder: number;
}

export interface VocabularyItem {
  id: string;
  courseId: string;
  taskId: string;
  zhText: string;
  pinyin: string;
  translationRu: string;
  translationKk: string;
  initial: string;
  final: string;
  tone: string;
  rhymeGroup: string;
  difficulty: number;
  tags: string;
  sourceFileId: string;
}

export interface LearningRecord {
  id: string;
  studentId: string;
  taskId: string;
  lessonNodeId?: string;
  context: 'homework' | 'vocabulary' | 'practice';
  status: 'not_started' | 'in_progress' | 'completed';
  score: number;
  attemptsCount: number;
  lastRecordingId: string;
  completedAt: string;
  updatedAt: string;
}

export const homeworkApi = {
  tasks: (courseId: string, params?: { unit?: number; lesson?: number; lessonNodeId?: string; includeAll?: boolean }) => {
    let path = `/homework/tasks?courseId=${courseId}`;
    if (params?.unit !== undefined) path += `&unit=${params.unit}`;
    if (params?.lesson !== undefined) path += `&lesson=${params.lesson}`;
    if (params?.lessonNodeId) path += `&lessonNodeId=${params.lessonNodeId}`;
    if (params?.includeAll) path += `&includeAll=true`;
    return request<LearningTask[]>(path);
  }
};

export const vocabularyApi = {
  list: (courseId: string, params?: { q?: string; initial?: string; final?: string; tone?: string }) => {
    let path = `/vocabulary?courseId=${courseId}`;
    if (params?.q) path += `&q=${encodeURIComponent(params.q)}`;
    if (params?.initial) path += `&initial=${params.initial}`;
    if (params?.final) path += `&final=${params.final}`;
    if (params?.tone) path += `&tone=${params.tone}`;
    return request<VocabularyItem[]>(path);
  }
};

export const learningRecordsApi = {
  save: (taskId: string, params: { context?: string; status?: string; score?: number; recordingId?: string; lessonNodeId?: string }) =>
    request<LearningRecord>('/learning-records', {
      method: 'POST',
      body: JSON.stringify({ taskId, ...params })
    }),
  list: (courseId: string, params?: { context?: string; lessonNodeId?: string }) => {
    let path = `/learning-records?courseId=${courseId}`;
    if (params?.context) path += `&context=${params.context}`;
    if (params?.lessonNodeId) path += `&lessonNodeId=${params.lessonNodeId}`;
    return request<LearningRecord[]>(path);
  }
};

export interface TTSSynthesizeResult {
  provider: string;
  audioUrl: string | null;
  text: string;
  lang: string;
  cached: boolean;
  charCount: number;
  billingChars: number;
  latencyMs: number;
}

export interface TTSUsageRecord {
  id: string;
  timestamp: string;
  provider: string;
  text: string;
  lang: string;
  charCount: number;
  billingChars: number;
  cached: boolean;
  latencyMs: number;
  costUsd: number;
}

export interface TTSProviderStatus {
  primary: 'healthy' | 'unhealthy';
  fallback: 'healthy' | 'unhealthy';
  overLimit: boolean;
}

export const ttsApi = {
  synthesize: (text: string, lang: string, voice?: string, speed?: number) => {
    let path = `/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
    if (voice) path += `&voice=${encodeURIComponent(voice)}`;
    if (speed) path += `&speed=${speed}`;
    return request<TTSSynthesizeResult>(path);
  },
  getUsage: (startDate?: string, endDate?: string) => {
    let path = '/tts/usage';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length) path += '?' + params.join('&');
    return request<TTSUsageRecord[]>(path);
  },
  getStatus: () => request<TTSProviderStatus>('/tts/status')
};

export interface LiveSessionData {
  id: string;
  courseId: string;
  teacherId: string;
  status: 'active' | 'ended';
  sourceMode: 'screen' | 'pdf';
  currentPage: number;
  recordingStatus: 'idle' | 'recording' | 'saved';
  startedAt: string;
  endedAt: string;
}

export interface ClassroomCommentData {
  id: string;
  liveSessionId: string;
  studentId: string;
  body: string;
  createdAt: string;
  visibility: 'visible' | 'hidden';
}

export interface AdminUser {
  id: string;
  username: string;
  role: Role;
  displayName: string;
  languagePref: string;
  disabled?: boolean;
  createdAt: string;
}

export const liveSessionsApi = {
  create: (courseId: string, lessonNodeId: string, sourceMode: 'screen' | 'pdf' = 'pdf') =>
    request<LiveSessionData>('/live-sessions', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonNodeId, sourceMode })
    }),
  getActive: (courseId: string) =>
    request<LiveSessionData | null>(`/live-sessions/active?courseId=${courseId}`),
  get: (sessionId: string) =>
    request<LiveSessionData>(`/live-sessions/${sessionId}`),
  join: (sessionId: string) =>
    request<{ allowed: boolean }>(`/live-sessions/${sessionId}/join`, { method: 'POST' }),
  patch: (id: string, updates: Partial<Pick<LiveSessionData, 'sourceMode' | 'currentPage' | 'recordingStatus' | 'status'>>) =>
    request<LiveSessionData>(`/live-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  comments: {
    list: (sessionId: string) =>
      request<ClassroomCommentData[]>(`/live-sessions/${sessionId}/comments`),
    send: (sessionId: string, body: string) =>
      request<ClassroomCommentData>(`/live-sessions/${sessionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body })
      })
  }
};

export interface AdminLiveSession {
  id: string;
  courseId: string;
  teacherId: string;
  lessonNodeId: string;
  status: 'active' | 'ended';
  sourceMode: 'screen' | 'pdf';
  currentPage: number;
  recordingStatus: 'idle' | 'recording' | 'saved';
  startedAt: string;
  endedAt: string;
  courseTitle: string;
  lessonTitle: string;
  teacherName: string;
}

export interface AdminRecording {
  type: 'lecture' | 'student';
  id: string;
  courseId: string;
  courseTitle: string;
  createdAt: string;
  durationSec: number;
  filename: string;
  title?: string;
  teacherName?: string;
  studentName?: string;
  studentId?: string;
  audioUrl?: string;
  videoUrl?: string;
  pageNumber?: number;
  taskId?: string;
}

export interface AdminNote {
  id: string;
  liveSessionId: string;
  studentId: string;
  body: string;
  createdAt: string;
  visibility: 'visible' | 'hidden';
  sessionTitle: string;
  studentName: string;
}

export interface AdminTranscriptSegment {
  id: string;
  sourceText: string;
  translatedText: string;
  language: string;
  createdAt: string;
}

export interface AdminTranscript {
  liveSessionId: string;
  courseTitle: string;
  segments: AdminTranscriptSegment[];
}

export interface AdminCourseware {
  id: string;
  ownerId: string;
  courseId: string;
  type: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  createdAt: string;
  courseTitle: string;
  pageCount: number;
  renderStatus: 'pending' | 'processing' | 'ready' | 'failed';
}

export interface AdminAssignmentImport {
  fileId: string;
  filename: string;
  courseTitle: string;
  tasksCount: number;
  vocabCount: number;
  errors: string[];
  createdAt: string;
}

export interface LessonProgress {
  lessonNodeId: string;
  lessonTitle: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  recordings: number;
  avgScore: number;
}

export interface CourseProgress {
  courseId: string;
  courseTitle: string;
  lessonProgress: LessonProgress[];
}

export interface StudentProgress {
  studentId: string;
  displayName: string;
  courseProgress: CourseProgress[];
}

export interface AdminLearningProgress {
  students: StudentProgress[];
}

export interface CleanupLearningRecordsResult {
  deleted: number;
  scanned: number;
  dryRun: boolean;
  reasons: Record<string, number>;
}

export const adminApi = {
  listUsers: (role?: string, q?: string) => {
    let path = '/admin/users';
    const params: string[] = [];
    if (role) params.push(`role=${role}`);
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (params.length) path += '?' + params.join('&');
    return request<AdminUser[]>(path);
  },
  createUser: (username: string, password: string, role: Role, displayName: string) =>
    request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role, displayName })
    }),
  updateUser: (id: string, updates: { disabled?: boolean; password?: string; displayName?: string; role?: Role }) =>
    request<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteUser: (id: string) =>
    request<{ deleted: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
  getUserRecords: (id: string) =>
    request<LearningRecord[]>(`/admin/users/${id}/records`),
  cleanupZombieLearningRecords: (dryRun = true) =>
    request<CleanupLearningRecordsResult>('/admin/learning-records/cleanup-zombies', {
      method: 'POST',
      body: JSON.stringify({ dryRun })
    }),
  liveSessions: () => request<AdminLiveSession[]>('/admin/live-sessions'),
  recordings: (courseId?: string) => request<AdminRecording[]>(`/admin/recordings${courseId ? `?courseId=${courseId}` : ''}`),
  notes: () => request<AdminNote[]>('/admin/notes'),
  transcripts: (liveSessionId?: string) => request<AdminTranscript[]>(`/admin/transcripts${liveSessionId ? `?liveSessionId=${liveSessionId}` : ''}`),
  coursewares: () => request<AdminCourseware[]>('/admin/coursewares'),
  assignmentImports: () => request<AdminAssignmentImport[]>('/admin/assignment-imports'),
  learningProgress: (params?: { studentId?: string; courseId?: string; lessonNodeId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.studentId) qs.set('studentId', params.studentId);
    if (params?.courseId) qs.set('courseId', params.courseId);
    if (params?.lessonNodeId) qs.set('lessonNodeId', params.lessonNodeId);
    const query = qs.toString();
    return request<AdminLearningProgress>(`/admin/learning-progress${query ? `?${query}` : ''}`);
  },
  toggleNoteVisibility: (noteId: string, visibility: 'visible' | 'hidden') =>
    request<AdminNote>(`/admin/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility })
    }),
  deleteRecording: (id: string) => request<{ deleted: boolean }>(`/recordings/${id}`, { method: 'DELETE' })
};
