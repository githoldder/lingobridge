import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { readDb, writeDb } from './db.ts';
import { saveBase64File, storageRoot } from './storage.ts';
import type { CoursePage, Exercise, FileMetadata } from './types.ts';

const MAX_COURSEWARE_BYTES = 50 * 1024 * 1024;

function ok(res: Response, data: unknown = null, message = 'success') {
  return res.json({ code: 0, data, message });
}

function fail(res: Response, status: number, message: string, detail?: unknown) {
  return res.status(status).json({ code: status, data: detail ?? null, message });
}

function currentUserId(req: Request) {
  const auth = req.header('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
}

function extensionOf(filename: string) {
  return path.extname(filename).slice(1).toLowerCase();
}

function createPagesFromCourseware(courseId: string, filename: string, fileUrl: string): CoursePage[] {
  const base = filename.replace(/\.[^.]+$/, '');
  return [1, 2, 3].map((pageNumber) => ({
    id: crypto.randomUUID(),
    courseId,
    pageNumber,
    contentHtml: `<h1>${base}</h1><p>Courseware page ${pageNumber}</p>`,
    audioText: pageNumber === 1 ? '大家好，欢迎来到中文课。' : pageNumber === 2 ? '请跟着老师朗读这一页。' : '请完成本页的跟读练习。',
    fileUrl
  }));
}

function createExercisesFromExcel(courseId: string, filename: string): Exercise[] {
  return [
    {
      id: crypto.randomUUID(),
      courseId,
      pageNumber: 1,
      prompt: `${filename}: 请朗读“大家好”。`,
      answer: '大家好',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      courseId,
      pageNumber: 2,
      prompt: `${filename}: 请朗读“我来自哈萨克斯坦”。`,
      answer: '我来自哈萨克斯坦',
      createdAt: new Date().toISOString()
    }
  ];
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '90mb' }));
  app.use('/uploads', express.static(storageRoot));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.header('origin') || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.get('/api/v1/health', (_req, res) => ok(res, { status: 'ok', service: 'lingobridge-mvp-api' }));

  app.post('/api/v1/auth/login', async (req, res) => {
    const { email, username, password, role } = req.body ?? {};
    const db = await readDb();
    const loginName = email || username;
    const user = db.users.find((item) => item.username === loginName && item.password === password && (!role || item.role === role));
    if (!user) return fail(res, 401, 'Invalid demo credentials');
    ok(res, {
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        languagePref: user.languagePref
      }
    });
  });

  app.get('/api/v1/users/me', async (req, res) => {
    const db = await readDb();
    const user = db.users.find((item) => item.id === currentUserId(req));
    if (!user) return fail(res, 401, 'Unauthorized');
    ok(res, { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref });
  });

  app.get('/api/v1/courses', async (_req, res) => {
    const db = await readDb();
    const courses = db.courses.map((course) => ({
      ...course,
      pagesCount: db.coursePages.filter((page) => page.courseId === course.id).length,
      exercisesCount: db.exercises.filter((exercise) => exercise.courseId === course.id).length,
      recordingsCount: db.recordings.filter((recording) => recording.courseId === course.id).length
    }));
    ok(res, courses);
  });

  app.post('/api/v1/courses', async (req, res) => {
    const db = await readDb();
    const teacherId = currentUserId(req) || 'teacher-1';
    const title = String(req.body?.title || 'New Chinese Course');
    const course = {
      id: crypto.randomUUID(),
      teacherId,
      title,
      description: String(req.body?.description || ''),
      createdAt: new Date().toISOString(),
      status: 'Published' as const
    };
    db.courses.unshift(course);
    await writeDb(db);
    ok(res, course);
  });

  app.get('/api/v1/courses/:id/pages', async (req, res) => {
    const db = await readDb();
    ok(res, db.coursePages.filter((page) => page.courseId === req.params.id).sort((a, b) => a.pageNumber - b.pageNumber));
  });

  app.post('/api/v1/coursewares', async (req, res) => {
    const { courseId = 'course-1', filename, mimeType = 'application/octet-stream', base64 } = req.body ?? {};
    if (!filename || !base64) return fail(res, 400, 'filename and base64 are required');

    const db = await readDb();
    const ext = extensionOf(filename);
    if (!['pptx', 'pdf', 'xlsx'].includes(ext)) return fail(res, 415, 'Only pptx, pdf and xlsx are supported');

    const saved = await saveBase64File({ base64, filename, folder: 'coursewares' });
    if (saved.sizeBytes > MAX_COURSEWARE_BYTES) return fail(res, 413, 'Courseware file exceeds 50MB');

    const fileMeta: FileMetadata = {
      id: saved.id,
      ownerId: currentUserId(req) || 'teacher-1',
      courseId,
      type: ext as FileMetadata['type'],
      filename,
      mimeType,
      sizeBytes: saved.sizeBytes,
      storageUrl: saved.url,
      createdAt: new Date().toISOString()
    };
    db.files.unshift(fileMeta);

    let pages: CoursePage[] = [];
    let exercises: Exercise[] = [];
    if (ext === 'pdf' || ext === 'pptx') {
      pages = createPagesFromCourseware(courseId, filename, saved.url);
      db.coursePages = db.coursePages.filter((page) => page.courseId !== courseId).concat(pages);
    }
    if (ext === 'xlsx') {
      exercises = createExercisesFromExcel(courseId, filename);
      db.exercises = db.exercises.filter((exercise) => exercise.courseId !== courseId).concat(exercises);
    }

    await writeDb(db);
    ok(res, { file: fileMeta, pages, exercises });
  });

  app.get('/api/v1/exercises', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || 'course-1');
    const page = req.query.page ? Number(req.query.page) : undefined;
    ok(res, db.exercises.filter((item) => item.courseId === courseId && (!page || item.pageNumber === page)));
  });

  app.get('/api/v1/tts', (req, res) => {
    ok(res, {
      provider: 'browser-fallback',
      text: String(req.query.text || ''),
      lang: String(req.query.lang || 'zh-CN'),
      audioUrl: null
    }, 'TTS provider not configured; use browser fallback');
  });

  app.post('/api/v1/recordings', async (req, res) => {
    const { courseId = 'course-1', pageNumber = 1, filename = 'recording.webm', base64, durationSec = 0 } = req.body ?? {};
    if (!base64) return fail(res, 400, 'base64 audio is required');
    const db = await readDb();
    const saved = await saveBase64File({ base64, filename, folder: 'recordings' });
    const recording = {
      id: saved.id,
      studentId: currentUserId(req) || 'student-1',
      courseId,
      pageNumber: Number(pageNumber),
      audioUrl: saved.url,
      filename,
      durationSec: Number(durationSec),
      createdAt: new Date().toISOString()
    };
    db.recordings.unshift(recording);
    await writeDb(db);
    ok(res, recording);
  });

  app.get('/api/v1/recordings', async (req, res) => {
    const db = await readDb();
    const courseId = req.query.courseId ? String(req.query.courseId) : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    ok(res, db.recordings.filter((item) => (!courseId || item.courseId === courseId) && (!page || item.pageNumber === page)));
  });

  app.delete('/api/v1/recordings/:id', async (req, res) => {
    const db = await readDb();
    const before = db.recordings.length;
    db.recordings = db.recordings.filter((item) => item.id !== req.params.id);
    await writeDb(db);
    ok(res, { deleted: before !== db.recordings.length });
  });

  app.post('/api/v1/lectures', async (req, res) => {
    const { courseId = 'course-1', title = 'Class Replay', filename = 'lecture.webm', base64, durationSec = 0 } = req.body ?? {};
    if (!base64) return fail(res, 400, 'base64 video is required');
    const db = await readDb();
    const saved = await saveBase64File({ base64, filename, folder: 'lectures' });
    const lecture = {
      id: saved.id,
      courseId,
      teacherId: currentUserId(req) || 'teacher-1',
      title,
      videoUrl: saved.url,
      filename,
      durationSec: Number(durationSec),
      createdAt: new Date().toISOString()
    };
    db.lectures.unshift(lecture);
    await writeDb(db);
    ok(res, lecture);
  });

  app.get('/api/v1/lectures', async (req, res) => {
    const db = await readDb();
    const courseId = req.query.courseId ? String(req.query.courseId) : undefined;
    const date = req.query.date ? String(req.query.date) : undefined;
    ok(res, db.lectures.filter((item) => {
      const sameCourse = !courseId || item.courseId === courseId;
      const sameDate = !date || item.createdAt.slice(0, 10) === date;
      return sameCourse && sameDate;
    }));
  });

  app.delete('/api/v1/lectures/:id', async (req, res) => {
    const db = await readDb();
    const before = db.lectures.length;
    db.lectures = db.lectures.filter((item) => item.id !== req.params.id);
    await writeDb(db);
    ok(res, { deleted: before !== db.lectures.length });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    fail(res, 500, 'Internal server error');
  });

  return app;
}

