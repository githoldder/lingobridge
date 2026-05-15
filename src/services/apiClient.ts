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
  status: 'Published' | 'Draft';
  pagesCount?: number;
  exercisesCount?: number;
  recordingsCount?: number;
}

export interface CoursePage {
  id: string;
  courseId: string;
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
  const payload = await response.json() as ApiEnvelope<T>;
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
  pages: (courseId: string) => request<CoursePage[]>(`/courses/${courseId}/pages`),
  exercises: (courseId: string, page?: number) => request<Exercise[]>(`/exercises?courseId=${courseId}${page ? `&page=${page}` : ''}`),
  async uploadCourseware(courseId: string, file: File) {
    return request<{ file: unknown; pages: CoursePage[]; exercises: Exercise[]; tasks: LearningTask[]; vocabulary: VocabularyItem[]; warnings?: string[] }>('/coursewares', {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: await fileToBase64(file)
      })
    });
  }
};

export const recordingsApi = {
  list: (courseId = 'course-1', page = 1) => request<Recording[]>(`/recordings?courseId=${courseId}&page=${page}`),
  async upload(params: { courseId: string; pageNumber: number; taskId?: string; blob: Blob; durationSec: number; filename?: string }) {
    return request<Recording>('/recordings', {
      method: 'POST',
      body: JSON.stringify({
        courseId: params.courseId,
        pageNumber: params.pageNumber,
        filename: params.filename || `recording-${Date.now()}.webm`,
        durationSec: params.durationSec,
        base64: await fileToBase64(params.blob)
      })
    });
  },
  delete: (id: string) => request<{ deleted: boolean }>(`/recordings/${id}`, { method: 'DELETE' })
};

export const lecturesApi = {
  list: (courseId = 'course-1', date?: string) => request<Lecture[]>(`/lectures?courseId=${courseId}${date ? `&date=${date}` : ''}`),
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
  context: 'homework' | 'vocabulary' | 'practice';
  status: 'not_started' | 'in_progress' | 'completed';
  score: number;
  attemptsCount: number;
  lastRecordingId: string;
  completedAt: string;
  updatedAt: string;
}

export const homeworkApi = {
  tasks: (courseId: string, unit?: number, lesson?: number) => {
    let path = `/homework/tasks?courseId=${courseId}`;
    if (unit !== undefined) path += `&unit=${unit}`;
    if (lesson !== undefined) path += `&lesson=${lesson}`;
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
  save: (taskId: string, params: { context?: string; status?: string; score?: number; recordingId?: string }) =>
    request<LearningRecord>('/learning-records', {
      method: 'POST',
      body: JSON.stringify({ taskId, ...params })
    }),
  list: (courseId: string, context?: string) => {
    let path = `/learning-records?courseId=${courseId}`;
    if (context) path += `&context=${context}`;
    return request<LearningRecord[]>(path);
  }
};

export const ttsApi = {
  synthesize: (text: string, lang: string) => request<{ provider: string; audioUrl: string | null; text: string; lang: string }>(`/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`)
};
