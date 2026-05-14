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
  recordings: [],
  lectures: [],
  files: []
};

let cached: Database | null = null;

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  if (cached) return cached;

  try {
    const raw = await readFile(dbPath, 'utf8');
    cached = JSON.parse(raw) as Database;
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

