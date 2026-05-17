import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Database } from './types.ts';

const dataDir = path.resolve(process.cwd(), 'backend/data');
const dbPath = path.join(dataDir, 'db.json');

const now = new Date().toISOString();

const seed: Database = {
  users: [
    {
      id: 'teacher-1',
      username: 'teacher@test.com',
      password: 'Test@123456',
      role: 'teacher',
      displayName: '王老师',
      languagePref: 'zh'
    },
    {
      id: 'student-1',
      username: 'student_a@test.com',
      password: 'Test@123456',
      role: 'student',
      displayName: '阿合买提',
      languagePref: 'kk'
    },
    {
      id: 'student-2',
      username: 'student_b@test.com',
      password: 'Test@123456',
      role: 'student',
      displayName: '玛丽亚',
      languagePref: 'ru'
    },
    {
      id: 'student-3',
      username: 'student_c@test.com',
      password: 'Test@123456',
      role: 'student',
      displayName: '努尔兰',
      languagePref: 'kk'
    },
    {
      id: 'admin-1',
      username: 'admin@test.com',
      password: 'Test@123456',
      role: 'admin',
      displayName: '系统管理员',
      languagePref: 'zh'
    }
  ],
  courses: [
    {
      id: 'course-1',
      teacherId: 'teacher-1',
      title: '第三课：自我介绍',
      description: 'MVP demo course generated from teacher courseware.',
      createdAt: now,
      status: 'Published'
    }
  ],
  coursePages: [
    {
      id: 'page-1',
      courseId: 'course-1',
      pageNumber: 1,
      contentHtml: '<h1>大家好</h1><p>Dajia hao</p>',
      audioText: '大家好，我叫阿合买提。'
    },
    {
      id: 'page-2',
      courseId: 'course-1',
      pageNumber: 2,
      contentHtml: '<h1>我来自哈萨克斯坦</h1>',
      audioText: '我来自哈萨克斯坦。'
    },
    {
      id: 'page-3',
      courseId: 'course-1',
      pageNumber: 3,
      contentHtml: '<h1>我在常州工学院学习</h1>',
      audioText: '我在常州工学院学习中文。'
    }
  ],
  exercises: [
    {
      id: 'exercise-1',
      courseId: 'course-1',
      pageNumber: 1,
      prompt: '请朗读：大家好，我叫阿合买提。',
      answer: '大家好，我叫阿合买提。',
      createdAt: now
    }
  ],
  learningTasks: [],
  vocabularyItems: [],
  learningRecords: [],
  recordings: [],
  lectures: [],
  liveSessions: [],
  classroomComments: [],
  files: [],
  lessonNodes: [],
  assignmentNodes: [],
  coursewareFiles: [],
  courseMembers: [
    {
      id: 'course-member-1',
      courseId: 'course-1',
      userId: 'student-1',
      role: 'student',
      joinedAt: now
    },
    {
      id: 'course-member-2',
      courseId: 'course-1',
      userId: 'student-2',
      role: 'student',
      joinedAt: now
    },
    {
      id: 'course-member-3',
      courseId: 'course-1',
      userId: 'student-3',
      role: 'student',
      joinedAt: now
    }
  ],
  teacherStudentLinks: [
    {
      id: 'teacher-student-1',
      teacherId: 'teacher-1',
      studentId: 'student-1',
      className: '文科院中文测试班',
      status: 'active',
      createdAt: now
    },
    {
      id: 'teacher-student-2',
      teacherId: 'teacher-1',
      studentId: 'student-2',
      className: '文科院中文测试班',
      status: 'active',
      createdAt: now
    },
    {
      id: 'teacher-student-3',
      teacherId: 'teacher-1',
      studentId: 'student-3',
      className: '文科院中文测试班',
      status: 'active',
      createdAt: now
    }
  ],
  liveClassStudents: [],
  homeworkImports: []
};

let cached: Database | null = null;

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  if (cached) return cached;

  try {
    const raw = await readFile(dbPath, 'utf8');
    cached = JSON.parse(raw) as Database;
    // Migration: add missing fields
    if (!cached.courseMembers) cached.courseMembers = [];
    if (!cached.coursewareFiles) cached.coursewareFiles = [];
    if (!cached.teacherStudentLinks) cached.teacherStudentLinks = structuredClone(seed.teacherStudentLinks);
    if (!cached.liveClassStudents) cached.liveClassStudents = [];
    if (!cached.homeworkImports) cached.homeworkImports = [];
    for (const user of seed.users) {
      if (!cached.users.find((existing) => existing.id === user.id)) cached.users.push(user);
    }
    for (const member of seed.courseMembers) {
      if (!cached.courseMembers.find((existing) => existing.courseId === member.courseId && existing.userId === member.userId)) {
        cached.courseMembers.push(member);
      }
    }
    await writeDb(cached);
  } catch {
    cached = seed;
    await writeDb(cached);
  }

  return cached;
}

export async function readDb() {
  return ensureDb();
}

export async function writeDb(db: Database) {
  cached = db;
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

export function resetDbForTests() {
  cached = structuredClone(seed);
  return cached;
}
