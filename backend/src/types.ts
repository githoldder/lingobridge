export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  languagePref: 'zh' | 'ru' | 'kk' | 'en';
  email?: string;
}

export interface CourseMember {
  id: string;
  courseId: string;
  userId: string;
  role: 'student' | 'teacher' | 'assistant';
  joinedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyItem {
  id: string;
  courseId: string;
  lessonNodeId?: string;
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
  createdAt: string;
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

export interface LiveSession {
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
}

export interface ClassroomComment {
  id: string;
  liveSessionId: string;
  studentId: string;
  body: string;
  createdAt: string;
  visibility: 'visible' | 'hidden';
}

export interface FileMetadata {
  id: string;
  ownerId: string;
  courseId: string;
  lessonNodeId?: string;
  type: 'pptx' | 'pdf' | 'xlsx' | 'audio' | 'video' | 'other';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  createdAt: string;
}

export interface LessonNode {
  id: string;
  courseId: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  styleSeed: number;
  colorToken: string;
  shapeToken: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  assignmentNodeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentNode {
  id: string;
  courseId: string;
  lessonNodeId: string;
  title: string;
  dueAt?: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CoursewareFile {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  type: 'pdf' | 'pptx' | 'xlsx';
  filename: string;
  storageUrl: string;
  renderStatus: 'pending' | 'processing' | 'ready' | 'failed';
  pageCount?: number;
  createdAt: string;
}

export interface Database {
  users: User[];
  courses: Course[];
  coursePages: CoursePage[];
  exercises: Exercise[];
  learningTasks: LearningTask[];
  vocabularyItems: VocabularyItem[];
  learningRecords: LearningRecord[];
  recordings: Recording[];
  lectures: Lecture[];
  liveSessions: LiveSession[];
  classroomComments: ClassroomComment[];
  files: FileMetadata[];
  lessonNodes: LessonNode[];
  assignmentNodes: AssignmentNode[];
  coursewareFiles: CoursewareFile[];
  courseMembers: CourseMember[];
}
