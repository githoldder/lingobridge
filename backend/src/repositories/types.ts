/**
 * S4-T04: Repository base — common DTO shape and helpers.
 *
 * All repositories return uniform DTOs through these helpers.
 * Business handlers never write raw SQL; they call repository methods.
 */

/** Standard API response envelope */
export interface ApiDto<T> {
  code: number;
  data: T;
  message: string;
}

/** Paginated list result */
export interface PageResult<T> {
  items: T[];
  total: number;
}

/** Public user DTO — never exposes password */
export interface UserDto {
  id: string;
  username: string;
  role: string;
  displayName: string;
  languagePref: string;
  email?: string;
}

/** Course DTO */
export interface CourseDto {
  id: string;
  teacherId: string;
  classId?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  status: string;
  startsAt?: string;
  endsAt?: string;
  defaultCoursewareFileId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Course member DTO */
export interface CourseMemberDto {
  id: string;
  courseId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

/** Lesson node DTO */
export interface LessonNodeDto {
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
  defaultCoursewareFileId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Assignment node DTO */
export interface AssignmentNodeDto {
  id: string;
  courseId: string;
  lessonNodeId: string;
  title: string;
  dueAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Live session DTO */
export interface LiveSessionDto {
  id: string;
  courseId: string;
  teacherId: string;
  lessonNodeId: string;
  status: string;
  sourceMode: string;
  currentPage: number;
  recordingStatus: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Learning task DTO */
export interface LearningTaskDto {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  assignmentNodeId?: string;
  taskKey: string;
  taskType: string;
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
  publishToHomework: boolean;
  publishToVocab: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Learning record DTO */
export interface LearningRecordDto {
  id: string;
  studentId: string;
  lessonNodeId?: string;
  assignmentNodeId?: string;
  taskId: string;
  context: string;
  status: string;
  score: number;
  attemptsCount: number;
  lastRecordingId?: string;
  completedAt?: string;
  updatedAt: string;
}

/** File metadata DTO */
export interface FileDto {
  id: string;
  ownerId: string;
  courseId?: string;
  lessonNodeId?: string;
  kind: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  createdAt: string;
}

/** Courseware file DTO */
export interface CoursewareFileDto {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  kind: string;
  filename: string;
  storageUrl: string;
  renderStatus: string;
  pageCount: number;
  createdAt: string;
}

/** Recording DTO */
export interface RecordingDto {
  id: string;
  studentId: string;
  courseId: string;
  lessonNodeId?: string;
  taskId?: string;
  pageNumber: number;
  audioUrl: string;
  filename: string;
  durationSec: number;
  createdAt: string;
}

/** Teacher-student link DTO */
export interface TeacherStudentLinkDto {
  id: string;
  teacherId: string;
  studentId: string;
  className?: string;
  status: string;
  createdAt: string;
}

/** Homework import DTO */
export interface HomeworkImportDto {
  id: string;
  courseId: string;
  lessonNodeId?: string;
  assignmentNodeId?: string;
  fileId?: string;
  sourceMode: string;
  filename?: string;
  tasksCount: number;
  vocabCount: number;
  errors: string[];
  createdAt: string;
}

/** Live class student DTO */
export interface LiveClassStudentDto {
  id: string;
  lessonNodeId: string;
  studentId: string;
  source: string;
  joinedAt: string;
}

/** Classroom comment DTO */
export interface ClassroomCommentDto {
  id: string;
  liveSessionId: string;
  studentId: string;
  body: string;
  visibility: string;
  createdAt: string;
}

/** Class (班级) DTO */
export interface ClassDto {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** Class member DTO */
export interface ClassMemberDto {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: string;
}

export interface HomeworkSubmissionDto {
  id: string;
  studentId: string;
  courseId: string;
  lessonNodeId: string;
  assignmentNodeId: string;
  status: 'draft' | 'submitted' | 'graded';
  draftData: Record<string, any>;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
