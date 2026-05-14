export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  languagePref: 'zh' | 'ru' | 'kk' | 'en';
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'Published' | 'Draft';
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
  createdAt: string;
}

export interface Recording {
  id: string;
  studentId: string;
  courseId: string;
  pageNumber: number;
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

export interface FileMetadata {
  id: string;
  ownerId: string;
  courseId: string;
  type: 'pptx' | 'pdf' | 'xlsx' | 'audio' | 'video' | 'other';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  courses: Course[];
  coursePages: CoursePage[];
  exercises: Exercise[];
  recordings: Recording[];
  lectures: Lecture[];
  files: FileMetadata[];
}

