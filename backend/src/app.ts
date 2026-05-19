import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { readDb, writeDb } from './db.ts';
import { initPostgres, healthCheck as pgHealthCheck } from './db/postgres.ts';
import { saveBase64File, storageRoot } from './storage.ts';
import { parseExcel, upsertTasks, upsertVocabulary } from './excelParser.ts';
import type { CoursePage, Exercise, FileMetadata, LiveSession, ClassroomComment, LessonNode, AssignmentNode, UserRole, Course, LiveClassStudent, HomeworkImport } from './types.ts';
import { ttsFacade } from './providers/ttsFacade.ts';
import * as usersRepo from './repositories/users.ts';
import * as coursesRepo from './repositories/courses.ts';

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

function deriveStyleTokens(styleSeed: number): { colorToken: string; shapeToken: string } {
  const colors = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#64748B'];
  const shapes = ['circle', 'square', 'diamond', 'hexagon', 'star', 'triangle', 'pentagon', 'octagon'];
  const hash = ((styleSeed * 2654435761) >>> 0) % 2147483647;
  return {
    colorToken: colors[hash % colors.length],
    shapeToken: shapes[hash % shapes.length]
  };
}

function publicUser(user: import('./types.ts').User) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    languagePref: user.languagePref,
    email: user.email || user.username
  };
}

function extractPptxText(absolutePath: string): string[] {
  try {
    const data = fs.readFileSync(absolutePath);
    let JSZip: any;
    try { JSZip = require('jszip'); } catch { return []; }
    const zip = JSZip.loadAsync(data).then(async (zip: any) => {
      const slides: string[] = [];
      let index = 1;
      while (true) {
        const file = zip.file(`ppt/slides/slide${index}.xml`);
        if (!file) break;
        const xml = await file.async('string');
        const texts: string[] = [];
        let m: RegExpExecArray | null;
        const tagRe = /<a:t[^>]*>([^<]+)<\/a:t>/g;
        while ((m = tagRe.exec(xml)) !== null) texts.push(m[1]);
        const slideRe = /<p:spTree[^>]*>[\s\S]*?<\/p:spTree>/;
        const slideMatch = xml.match(slideRe);
        if (slideMatch) {
          let line: RegExpExecArray | null;
          const lineRe = /<a:p[^>]*>[\s\S]*?<\/a:p>/g;
          const lines: string[] = [];
          while ((line = lineRe.exec(slideMatch[0])) !== null) {
            const lineText = texts.slice(lines.length * 100).join('').trim();
            if (lineText) lines.push(lineText);
          }
          slides.push(texts.join(' ').trim());
        } else {
          slides.push(texts.join(' ').trim());
        }
        index++;
      }
      return slides.filter((s) => s.length > 0);
    });
    return [];
  } catch {
    return [];
  }
}

function createPagesFromCourseware(courseId: string, filename: string, fileUrl: string, absolutePath?: string): CoursePage[] {
  const ext = extensionOf(filename);
  const base = filename.replace(/\.[^.]+$/, '');

  if (ext === 'pdf') {
    return [{
      id: crypto.randomUUID(),
      courseId,
      pageNumber: 1,
      contentHtml: '',
      audioText: '请查看PDF课件。',
      fileUrl
    }];
  }

  if (ext === 'pptx' && absolutePath) {
    const slides = extractPptxText(absolutePath);
    if (slides.length > 0) {
      return slides.map((text, i) => ({
        id: crypto.randomUUID(),
        courseId,
        pageNumber: i + 1,
        contentHtml: `<div class="pptx-slide"><h1>${base}</h1><div class="slide-content"><p>${text.replace(/\n/g, '<br/>')}</p></div></div>`,
        audioText: text,
        fileUrl
      }));
    }
  }

  return [1, 2, 3].map((pageNumber) => ({
    id: crypto.randomUUID(),
    courseId,
    pageNumber,
    contentHtml: `<h1>${base}</h1><p>Courseware page ${pageNumber}</p>`,
    audioText: pageNumber === 1 ? '大家好，欢迎来到中文课。' : pageNumber === 2 ? '请跟着老师朗读这一页。' : '请完成本页的跟读练习。',
    fileUrl
  }));
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '90mb' }));
  app.use('/uploads', express.static(storageRoot));

  const ttsCacheDir = path.resolve(process.cwd(), 'backend/data/tts-cache');
  if (!fs.existsSync(ttsCacheDir)) fs.mkdirSync(ttsCacheDir, { recursive: true });
  app.use('/uploads/tts-cache', express.static(ttsCacheDir));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.header('origin') || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.get('/api/v1/health', async (_req, res) => {
    const dbStatus = await pgHealthCheck();
    ok(res, { status: 'ok', service: 'lingobridge-mvp-api', db: dbStatus });
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    const { email, username, password, role } = req.body ?? {};
    const loginName = (email || username);
    if (!loginName || !password) return fail(res, 401, 'Invalid demo credentials');
    const user = await usersRepo.verifyPassword(String(loginName), String(password));
    if (!user) return fail(res, 401, 'Invalid demo credentials');
    if (role && user.role !== role) return fail(res, 401, 'Invalid role');
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

  app.post('/api/v1/auth/register', async (req, res) => {
    const { email, username, password, role = 'student', displayName } = req.body ?? {};
    const loginName = String(email || username || '').trim().toLowerCase();
    if (!loginName || !password || !displayName) return fail(res, 400, 'email, password, and displayName are required');
    if (!['student', 'teacher'].includes(role)) return fail(res, 400, 'Only student or teacher registration is allowed');
    const existing = await usersRepo.findByUsername(loginName);
    if (existing) return fail(res, 409, 'Account already exists');

    const user = await usersRepo.create({
      username: loginName,
      password: String(password),
      role,
      displayName: String(displayName),
      languagePref: 'zh',
      email: loginName
    });

    if (user.role === 'student') {
      const defaultTeacherId = await usersRepo.findDefaultTeacherId();
      if (defaultTeacherId) {
        await usersRepo.addTeacherStudentLink(defaultTeacherId, user.id);
      }
    }
    ok(res, { token: user.id, user: publicUser(user as import('./types.ts').User) });
  });

  app.get('/api/v1/users/me', async (req, res) => {
    const userId = currentUserId(req);
    if (!userId) return fail(res, 401, 'Unauthorized');
    const user = await usersRepo.findById(userId);
    if (!user) return fail(res, 401, 'Unauthorized');
    ok(res, { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref });
  });

  app.get('/api/v1/courses', async (_req, res) => {
    const db = await readDb();
    const courses = await Promise.all(
      db.courses.map(async (course) => ({
        id: course.id,
        teacherId: course.teacherId,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
        pagesCount: db.coursePages.filter((page) => page.courseId === course.id).length,
        exercisesCount: db.learningTasks.filter((t) => t.courseId === course.id && t.publishToHomework).length,
        recordingsCount: db.recordings.filter((recording) => recording.courseId === course.id).length
      }))
    );
    ok(res, courses);
  });

  app.post('/api/v1/courses', async (req, res) => {
    const teacherId = currentUserId(req) || 'teacher-1';
    const title = String(req.body?.title || 'New Chinese Course');
    const course = await coursesRepo.create({
      teacherId,
      title,
      description: String(req.body?.description || ''),
      status: 'published'
    });
    await coursesRepo.addMember(course.id, teacherId, 'teacher');

    const linkedStudentIds = await usersRepo.findStudentIdsByTeacherId(teacherId);
    for (const studentId of linkedStudentIds) {
      await coursesRepo.addMember(course.id, studentId, 'student');
    }

    ok(res, course);
  });

  app.get('/api/v1/courses/:id/pages', async (req, res) => {
    const db = await readDb();
    ok(res, db.coursePages.filter((page) => page.courseId === req.params.id).sort((a, b) => a.pageNumber - b.pageNumber));
  });

  app.post('/api/v1/coursewares', async (req, res) => {
    const { courseId = 'course-1', lessonNodeId, filename, mimeType = 'application/octet-stream', base64 } = req.body ?? {};
    if (!filename || !base64) return fail(res, 400, 'filename and base64 are required');

    const db = await readDb();
    if (lessonNodeId && !db.lessonNodes.find((n) => n.id === lessonNodeId && n.courseId === courseId)) {
      return fail(res, 404, 'Live class not found for this course');
    }
    const ext = extensionOf(filename);
    if (!['pptx', 'pdf', 'xlsx'].includes(ext)) return fail(res, 415, 'Only pptx, pdf and xlsx are supported');

    const saved = await saveBase64File({ base64, filename, folder: 'coursewares' });
    if (saved.sizeBytes > MAX_COURSEWARE_BYTES) return fail(res, 413, 'Courseware file exceeds 50MB');

    const fileMeta: FileMetadata = {
      id: saved.id,
      ownerId: currentUserId(req) || 'teacher-1',
      courseId,
      lessonNodeId: lessonNodeId || undefined,
      type: ext as FileMetadata['type'],
      filename,
      mimeType,
      sizeBytes: saved.sizeBytes,
      storageUrl: saved.url,
      createdAt: new Date().toISOString()
    };
    db.files.unshift(fileMeta);
    if (['pdf', 'pptx', 'xlsx'].includes(ext)) {
      db.coursewareFiles.unshift({
        id: fileMeta.id,
        courseId,
        lessonNodeId: lessonNodeId || undefined,
        type: ext as 'pdf' | 'pptx' | 'xlsx',
        filename,
        storageUrl: saved.url,
        renderStatus: 'processing',
        pageCount: 0,
        createdAt: fileMeta.createdAt
      });
    }

    let renderStatus: 'pending' | 'processing' | 'ready' | 'failed' = 'ready';

    let pages: CoursePage[] = [];
    let exercises: Exercise[] = [];
    let tasks: unknown[] = [];
    let vocab: unknown[] = [];
    let parseErrors: string[] = [];

    if (ext === 'pdf' || ext === 'pptx') {
      renderStatus = 'processing';
      try {
        pages = createPagesFromCourseware(courseId, filename, saved.url, saved.absolutePath);
        db.coursePages = db.coursePages.filter((page) => page.courseId !== courseId).concat(pages);
        renderStatus = 'ready';
      } catch {
        renderStatus = 'failed';
      }
    }
    if (ext === 'xlsx') {
      const result = parseExcel(saved.absolutePath, courseId, fileMeta.id, lessonNodeId || undefined);
      if (result.errors.length > 0) {
        parseErrors = result.errors;
      }
      upsertTasks(db, result.learningTasks);
      upsertVocabulary(db, result.vocabularyItems);
      tasks = result.learningTasks;
      vocab = result.vocabularyItems;
    }

    const coursewareRecord = db.coursewareFiles.find((f) => f.id === fileMeta.id);
    if (coursewareRecord) {
      coursewareRecord.renderStatus = renderStatus;
      coursewareRecord.pageCount = pages.length;
    }

    await writeDb(db);
    ok(res, { file: { ...fileMeta, renderStatus }, pages, exercises, tasks, vocabulary: vocab, warnings: parseErrors.length > 0 ? parseErrors : undefined });
  });

  app.patch('/api/v1/courses/:id', async (req, res) => {
    const { title, description, status } = req.body ?? {};
    const updated = await coursesRepo.update(req.params.id, {
      title: title !== undefined ? String(title) : undefined,
      description: description !== undefined ? String(description) : undefined,
      status: status !== undefined && ['published', 'draft'].includes(status) ? status : undefined,
    });
    if (!updated) return fail(res, 404, 'Course not found');
    ok(res, updated);
  });

  app.get('/api/v1/courses/:id/members', async (req, res) => {
    const members = await coursesRepo.findMembers(req.params.id);
    const studentMembers = members.filter((m) => m.role === 'student');
    const result = [];
    for (const m of studentMembers) {
      const user = await usersRepo.findById(m.userId);
      result.push({
        id: m.id,
        userId: m.userId,
        username: user?.username || '',
        displayName: user?.displayName || '',
        email: user?.username || '',
        role: m.role,
        joinedAt: m.joinedAt
      });
    }
    ok(res, result);
  });

  app.post('/api/v1/courses/:id/members', async (req, res) => {
    const course = await coursesRepo.findById(req.params.id);
    if (!course) return fail(res, 404, 'Course not found');
    const { email, userId, q } = req.body ?? {};
    if (!email && !userId && !q) return fail(res, 400, 'email, q, or userId is required');

    let user = userId ? await usersRepo.findById(userId) : null;
    if (!user) {
      const search = String(email || q || userId).toLowerCase();
      const candidates = await usersRepo.search(search);
      user = candidates.find((u) => u.role === 'student') || null;
    }
    if (!user) return fail(res, 404, 'User not found');
    const existingMembers = await coursesRepo.findMembers(req.params.id);
    if (existingMembers.find((m) => m.userId === user.id)) return fail(res, 409, 'User is already a member');
    const member = await coursesRepo.addMember(req.params.id, user.id, 'student');
    ok(res, {
      id: member.id,
      userId: member.userId,
      username: user.username,
      displayName: user.displayName,
      email: user.username,
      role: member.role,
      joinedAt: member.joinedAt
    });
  });

  app.post('/api/v1/courses/:id/members/batch', async (req, res) => {
    const course = await coursesRepo.findById(req.params.id);
    if (!course) return fail(res, 404, 'Course not found');
    const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
    if (ids.length === 0) return fail(res, 400, 'userIds is required');

    const existingMembers = await coursesRepo.findMembers(req.params.id);
    const existingMemberIds = new Set(existingMembers.map((m) => m.userId));
    const added = [];
    for (const userId of ids) {
      if (existingMemberIds.has(userId)) continue;
      const user = await usersRepo.findById(userId);
      if (!user || user.role !== 'student') continue;
      const member = await coursesRepo.addMember(req.params.id, userId, 'student');
      added.push({ ...member, username: user.username, displayName: user.displayName, email: user.email || user.username });
    }
    ok(res, added);
  });

  app.get('/api/v1/courses/:id/students/search', async (req, res) => {
    const q = String(req.query.q || '');
    const courseId = req.params.id;
    const course = await coursesRepo.findById(courseId);
    if (!course) return fail(res, 404, 'Course not found');
    const existingMembers = await coursesRepo.findMembers(courseId);
    const existingMemberIds = new Set(existingMembers.map((m) => m.userId));
    const teacherStudentIds = await usersRepo.findStudentIdsByTeacherId(course.teacherId);

    const allStudents = q ? await usersRepo.searchExtended(q) : await usersRepo.searchExtended('');
    const students = allStudents
      .filter((u) => u.role === 'student' && teacherStudentIds.includes(u.id) && !existingMemberIds.has(u.id))
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        email: u.email || u.username
      }));

    ok(res, students);
  });

  app.get('/api/v1/students/search', async (req, res) => {
    const teacherId = currentUserId(req) || 'teacher-1';
    const q = String(req.query.q || '');
    const linkedIds = await usersRepo.findStudentIdsByTeacherId(teacherId);
    const allStudents = await usersRepo.searchExtended(q);
    const students = allStudents
      .filter((u) => u.role === 'student' && linkedIds.includes(u.id))
      .map(publicUser);
    ok(res, students);
  });

  app.delete('/api/v1/courses/:id/members/:memberId', async (req, res) => {
    const members = await coursesRepo.findMembers(req.params.id);
    const target = members.find((m) => m.id === req.params.memberId);
    if (!target) return ok(res, { deleted: false });
    const deleted = await coursesRepo.removeMember(req.params.id, target.userId);
    ok(res, { deleted });
  });

  app.get('/api/v1/coursewares', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || '');
    const lessonNodeId = String(req.query.lessonNodeId || '');
    let files = db.files;
    if (courseId) files = files.filter((f) => f.courseId === courseId);
    if (lessonNodeId) files = files.filter((f) => f.lessonNodeId === lessonNodeId);
    const items = files.map((f) => {
      const pages = db.coursePages.filter((p) => p.courseId === f.courseId && p.fileUrl === f.storageUrl);
      const lesson = f.lessonNodeId ? db.lessonNodes.find((n) => n.id === f.lessonNodeId) : undefined;
      return {
        id: f.id,
        filename: f.filename,
        mimeType: f.mimeType,
        type: f.type,
        lessonNodeId: f.lessonNodeId || '',
        liveClassTitle: lesson?.title || '',
        pageCount: pages.length,
        status: ['pdf', 'pptx'].includes(f.type) ? 'ready' : 'ready' as const,
        createdAt: f.createdAt
      };
    });
    ok(res, items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  app.post('/api/v1/assignments/import', async (req, res) => {
    const { courseId, lessonNodeId, filename, base64 } = req.body ?? {};
    if (!filename || !base64) return fail(res, 400, 'filename and base64 are required');
    const db = await readDb();
    if (lessonNodeId && !db.lessonNodes.find((n) => n.id === lessonNodeId && n.courseId === courseId)) {
      return fail(res, 404, 'Live class not found for this course');
    }
    const ext = extensionOf(filename);
    if (!['xlsx', 'xls'].includes(ext)) return fail(res, 415, 'Only xlsx files are supported');
    const saved = await saveBase64File({ base64, filename, folder: 'assignments' });
    const fileMeta: FileMetadata = {
      id: saved.id,
      ownerId: currentUserId(req) || 'teacher-1',
      courseId,
      lessonNodeId: lessonNodeId || undefined,
      type: 'xlsx' as FileMetadata['type'],
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: saved.sizeBytes,
      storageUrl: saved.url,
      createdAt: new Date().toISOString()
    };
    db.files.unshift(fileMeta);
    db.coursewareFiles.unshift({
      id: fileMeta.id,
      courseId,
      lessonNodeId: lessonNodeId || undefined,
      type: 'xlsx',
      filename,
      storageUrl: saved.url,
      renderStatus: 'ready',
      pageCount: 0,
      createdAt: fileMeta.createdAt
    });
    const result = parseExcel(saved.absolutePath, courseId, fileMeta.id, lessonNodeId || undefined);
    upsertTasks(db, result.learningTasks);
    upsertVocabulary(db, result.vocabularyItems);
    const importRecord: HomeworkImport = {
      id: crypto.randomUUID(),
      courseId,
      lessonNodeId: lessonNodeId || '',
      fileId: fileMeta.id,
      filename,
      tasksCount: result.learningTasks.length,
      vocabCount: result.vocabularyItems.length,
      errors: result.errors,
      createdAt: fileMeta.createdAt
    };
    db.homeworkImports.unshift(importRecord);
    await writeDb(db);
    ok(res, {
      tasksCount: result.learningTasks.length,
      vocabCount: result.vocabularyItems.length,
      lessonNodeId: lessonNodeId || undefined,
      warnings: result.errors.length > 0 ? result.errors : [],
      errorRows: []
    });
  });

  app.get('/api/v1/exercises', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || 'course-1');
    const page = req.query.page ? Number(req.query.page) : undefined;
    ok(res, db.exercises.filter((item) => item.courseId === courseId && (!page || item.pageNumber === page)));
  });

  app.get('/api/v1/homework/tasks', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || '');
    const lessonNodeId = String(req.query.lessonNodeId || '');
    const unit = req.query.unit ? Number(req.query.unit) : undefined;
    const lesson = req.query.lesson ? Number(req.query.lesson) : undefined;
    let items = db.learningTasks.filter((t) => t.publishToHomework);
    if (courseId) items = items.filter((t) => t.courseId === courseId);
    if (lessonNodeId) items = items.filter((t) => t.lessonNodeId === lessonNodeId);
    if (unit !== undefined) items = items.filter((t) => t.unit === unit);
    if (lesson !== undefined) items = items.filter((t) => t.lesson === lesson);
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    ok(res, items);
  });

  app.get('/api/v1/vocabulary', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || '');
    const q = String(req.query.q || '').toLowerCase();
    const initial = String(req.query.initial || '');
    const final_ = String(req.query.final || '');
    const tone = String(req.query.tone || '');
    let items = db.vocabularyItems;
    if (courseId) items = items.filter((v) => v.courseId === courseId);
    if (q) items = items.filter((v) => v.zhText.includes(q) || v.pinyin.toLowerCase().includes(q));
    if (initial) items = items.filter((v) => v.initial === initial);
    if (final_) items = items.filter((v) => v.final === final_);
    if (tone) items = items.filter((v) => v.tone === tone);
    ok(res, items);
  });

  app.post('/api/v1/learning-records', async (req, res) => {
    const { taskId, context = 'homework', status = 'completed', score = 0, lessonNodeId } = req.body ?? {};
    if (!taskId) return fail(res, 400, 'taskId is required');
    const db = await readDb();
    const studentId = currentUserId(req) || 'student-1';
    const existing = db.learningRecords.find(
      (r) => r.studentId === studentId && r.taskId === taskId && (lessonNodeId ? r.lessonNodeId === lessonNodeId : !r.lessonNodeId)
    );
    const now = new Date().toISOString();
    if (existing) {
      existing.status = status;
      existing.score = Math.max(existing.score, Number(score));
      existing.attemptsCount += 1;
      existing.lastRecordingId = req.body?.recordingId || existing.lastRecordingId;
      existing.completedAt = status === 'completed' ? now : existing.completedAt;
      existing.updatedAt = now;
      await writeDb(db);
      ok(res, existing);
    } else {
      const record = {
        id: crypto.randomUUID(),
        studentId,
        taskId,
        context,
        status,
        score: Number(score),
        attemptsCount: 1,
        lastRecordingId: req.body?.recordingId || '',
        completedAt: status === 'completed' ? now : '',
        updatedAt: now,
        ...(lessonNodeId ? { lessonNodeId } : {})
      };
      db.learningRecords.push(record);
      await writeDb(db);
      ok(res, record);
    }
  });

  app.get('/api/v1/learning-records', async (req, res) => {
    const db = await readDb();
    const studentId = currentUserId(req) || 'student-1';
    const courseId = String(req.query.courseId || '');
    const context = String(req.query.context || '');
    const lessonNodeId = String(req.query.lessonNodeId || '');
    let records = db.learningRecords.filter((r) => r.studentId === studentId);
    if (context) records = records.filter((r) => r.context === context);
    if (lessonNodeId) records = records.filter((r) => r.lessonNodeId === lessonNodeId);
    if (courseId) {
      const taskIds = db.learningTasks.filter((t) => t.courseId === courseId).map((t) => t.taskId);
      records = records.filter((r) => taskIds.includes(r.taskId));
    }
    ok(res, records);
  });

  app.get('/api/v1/tts', async (req, res) => {
    const text = String(req.query.text || '');
    const lang = String(req.query.lang || 'zh-CN');
    const voice = req.query.voice ? String(req.query.voice) : undefined;
    const speed = req.query.speed ? Number(req.query.speed) : undefined;

    if (!text) return fail(res, 400, 'text is required');

    try {
      const result = await ttsFacade.synthesize({ text, lang, voice, speed });
      ok(res, {
        provider: result.provider,
        text,
        lang,
        audioUrl: result.audioUrl,
        cached: result.cached,
        charCount: result.charCount,
        billingChars: result.billingChars,
        latencyMs: result.latencyMs
      });
    } catch (error: any) {
      fail(res, 500, 'TTS synthesis failed', error.message);
    }
  });

  app.get('/api/v1/tts/usage', requireAdmin, async (req, res) => {
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const usage = await ttsFacade.getUsage(startDate, endDate);
    const redacted = usage.map(r => ({ ...r, text: '[redacted]' }));
    ok(res, redacted);
  });

  app.get('/api/v1/tts/status', async (req, res) => {
    const status = await ttsFacade.getProviderStatus();
    ok(res, status);
  });

  app.post('/api/v1/recordings', async (req, res) => {
    const { courseId = 'course-1', pageNumber = 1, taskId, filename = 'recording.webm', base64, durationSec = 0 } = req.body ?? {};
    if (!base64) return fail(res, 400, 'base64 audio is required');
    const db = await readDb();
    const saved = await saveBase64File({ base64, filename, folder: 'recordings' });
    const recording = {
      id: saved.id,
      studentId: currentUserId(req) || 'student-1',
      courseId,
      pageNumber: Number(pageNumber),
      taskId: taskId || undefined,
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

  // Lesson node API (T02)
  app.get('/api/v1/courses/:id/lesson-nodes', async (req, res) => {
    const db = await readDb();
    const nodes = db.lessonNodes.filter((n) => n.courseId === req.params.id);
    ok(res, nodes);
  });

  app.post('/api/v1/courses/:id/lesson-nodes', async (req, res) => {
    const db = await readDb();
    const courseId = req.params.id;
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) return fail(res, 404, 'Course not found');

    const now = new Date().toISOString();
    const styleSeed = Math.floor(Math.random() * 1000000);
    const { colorToken, shapeToken } = deriveStyleTokens(styleSeed);

    const lessonNode: LessonNode = {
      id: crypto.randomUUID(),
      courseId,
      title: String(req.body?.title || 'New Lesson'),
      startsAt: req.body?.startsAt || undefined,
      endsAt: req.body?.endsAt || undefined,
      styleSeed,
      colorToken,
      shapeToken,
      status: (req.body?.status || 'draft') as LessonNode['status'],
      createdAt: now,
      updatedAt: now
    };

    const assignmentNode: AssignmentNode = {
      id: crypto.randomUUID(),
      courseId,
      lessonNodeId: lessonNode.id,
      title: String(req.body?.assignmentTitle || `${lessonNode.title} - Homework`),
      dueAt: req.body?.dueAt || undefined,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    lessonNode.assignmentNodeId = assignmentNode.id;

    db.lessonNodes.unshift(lessonNode);
    db.assignmentNodes.unshift(assignmentNode);
    const courseStudentIds = db.courseMembers
      .filter((m) => m.courseId === courseId && m.role === 'student')
      .map((m) => m.userId);
    for (const studentId of courseStudentIds) {
      db.liveClassStudents.push({
        id: crypto.randomUUID(),
        lessonNodeId: lessonNode.id,
        studentId,
        source: 'course_member',
        joinedAt: now
      });
    }
    await writeDb(db);
    ok(res, { lessonNode, assignmentNode });
  });

  app.get('/api/v1/live-classes/:id/students', async (req, res) => {
    const db = await readDb();
    const node = db.lessonNodes.find((n) => n.id === req.params.id);
    if (!node) return fail(res, 404, 'Live class not found');
    const students = db.liveClassStudents
      .filter((item) => item.lessonNodeId === node.id)
      .map((item) => {
        const user = db.users.find((u) => u.id === item.studentId);
        return user ? { ...item, user: publicUser(user) } : null;
      })
      .filter(Boolean);
    ok(res, students);
  });

  app.post('/api/v1/live-classes/:id/students/batch', async (req, res) => {
    const db = await readDb();
    const node = db.lessonNodes.find((n) => n.id === req.params.id);
    if (!node) return fail(res, 404, 'Live class not found');
    const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
    if (userIds.length === 0) return fail(res, 400, 'userIds is required');
    const now = new Date().toISOString();
    const added = [];
    for (const userId of userIds) {
      const user = db.users.find((u) => u.id === userId && u.role === 'student');
      if (!user) continue;
      const existing = db.liveClassStudents.find((item) => item.lessonNodeId === node.id && item.studentId === userId);
      if (existing) continue;
      const liveStudent: LiveClassStudent = {
        id: crypto.randomUUID(),
        lessonNodeId: node.id,
        studentId: userId,
        source: 'manual',
        joinedAt: now
      };
      db.liveClassStudents.push(liveStudent);
      added.push({ ...liveStudent, user: publicUser(user) });
    }
    await writeDb(db);
    ok(res, added);
  });

  app.patch('/api/v1/lesson-nodes/:id', async (req, res) => {
    const db = await readDb();
    const node = db.lessonNodes.find((n) => n.id === req.params.id);
    if (!node) return fail(res, 404, 'Lesson node not found');

    const { title, startsAt, endsAt, status } = req.body ?? {};
    if (title !== undefined) node.title = String(title);
    if (startsAt !== undefined) node.startsAt = startsAt || undefined;
    if (endsAt !== undefined) node.endsAt = endsAt || undefined;
    if (status !== undefined) node.status = status as LessonNode['status'];
    node.updatedAt = new Date().toISOString();

    await writeDb(db);
    ok(res, node);
  });

  app.get('/api/v1/assignments', async (req, res) => {
    const db = await readDb();
    const lessonNodeId = String(req.query.lessonNodeId || '');
    if (lessonNodeId) {
      const node = db.assignmentNodes.find((a) => a.lessonNodeId === lessonNodeId);
      return ok(res, node || null);
    }
    ok(res, db.assignmentNodes);
  });

  // Live session API (T27)
  app.post('/api/v1/live-sessions', async (req, res) => {
    const db = await readDb();
    const teacherId = currentUserId(req) || 'teacher-1';
    const { courseId = 'course-1', sourceMode = 'pdf', lessonNodeId } = req.body ?? {};

    if (!lessonNodeId) return fail(res, 400, 'lessonNodeId is required');

    const lessonNode = db.lessonNodes.find((n) => n.id === lessonNodeId);
    if (!lessonNode) return fail(res, 404, 'Lesson node not found');

    const existingActive = db.liveSessions.find(
      (s) => s.lessonNodeId === lessonNodeId && s.status === 'active'
    );
    if (existingActive) return fail(res, 409, 'An active live session already exists for this lesson node');

    db.liveSessions.forEach((s) => {
      if (s.courseId === courseId && s.teacherId === teacherId && s.status === 'active') {
        s.status = 'ended';
        s.endedAt = new Date().toISOString();
      }
    });

    const session: LiveSession = {
      id: crypto.randomUUID(),
      courseId,
      teacherId,
      lessonNodeId,
      status: 'active',
      sourceMode: sourceMode as LiveSession['sourceMode'],
      currentPage: 1,
      recordingStatus: 'idle',
      startedAt: new Date().toISOString(),
      endedAt: ''
    };
    db.liveSessions.push(session);
    await writeDb(db);
    ok(res, session);
  });

  app.get('/api/v1/live-sessions/active', async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || '');
    const active = db.liveSessions.find(
      (s) => s.courseId === courseId && s.status === 'active'
    );
    if (!active) return ok(res, null);
    ok(res, active);
  });

  app.patch('/api/v1/live-sessions/:id', async (req, res) => {
    const db = await readDb();
    const session = db.liveSessions.find((s) => s.id === req.params.id);
    if (!session) return fail(res, 404, 'Live session not found');

    const { sourceMode, currentPage, recordingStatus, status, endedAt } = req.body ?? {};
    if (sourceMode) session.sourceMode = sourceMode as LiveSession['sourceMode'];
    if (currentPage !== undefined) session.currentPage = Number(currentPage);
    if (recordingStatus) session.recordingStatus = recordingStatus as LiveSession['recordingStatus'];
    if (status) {
      session.status = status as LiveSession['status'];
      if (status === 'ended' && !session.endedAt) {
        session.endedAt = endedAt || new Date().toISOString();
      }
    }
    await writeDb(db);
    ok(res, session);
  });

  app.post('/api/v1/live-sessions/:id/comments', async (req, res) => {
    const db = await readDb();
    const session = db.liveSessions.find((s) => s.id === req.params.id);
    if (!session) return fail(res, 404, 'Live session not found');

    const { body } = req.body ?? {};
    if (!body || !body.trim()) return fail(res, 400, 'Comment body is required');

    const comment: ClassroomComment = {
      id: crypto.randomUUID(),
      liveSessionId: req.params.id,
      studentId: currentUserId(req) || 'student-1',
      body: body.trim(),
      createdAt: new Date().toISOString(),
      visibility: 'visible'
    };
    db.classroomComments.push(comment);
    await writeDb(db);
    ok(res, comment);
  });

  app.get('/api/v1/live-sessions/:id/comments', async (req, res) => {
    const db = await readDb();
    const comments = db.classroomComments
      .filter((c) => c.liveSessionId === req.params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    ok(res, comments);
  });

  // Admin routes
  app.get('/api/v1/admin/users', requireAdmin, async (req, res) => {
    const db = await readDb();
    const roleFilter = req.query.role ? String(req.query.role) : undefined;
    const search = req.query.q ? String(req.query.q).toLowerCase() : undefined;
    let users = db.users.map(u => ({ id: u.id, username: u.username, role: u.role, displayName: u.displayName, languagePref: u.languagePref, createdAt: (u as any).createdAt || '' }));
    if (roleFilter) users = users.filter(u => u.role === roleFilter);
    if (search) users = users.filter(u => u.username.toLowerCase().includes(search) || u.displayName.toLowerCase().includes(search));
    ok(res, users);
  });

  app.post('/api/v1/admin/users', requireAdmin, async (req, res) => {
    const db = await readDb();
    const { username, password, role, displayName } = req.body ?? {};
    if (!username || !password || !role) return fail(res, 400, 'username, password, and role are required');
    if (!['student', 'teacher', 'admin'].includes(role)) return fail(res, 400, 'Invalid role');
    const existing = db.users.find(u => u.username === username);
    if (existing) return fail(res, 409, 'Username already exists');
    const user = {
      id: crypto.randomUUID(),
      username: String(username),
      password: String(password),
      role: role as UserRole,
      displayName: String(displayName || username),
      languagePref: 'en' as const,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    await writeDb(db);
    ok(res, { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, createdAt: user.createdAt });
  });

  app.patch('/api/v1/admin/users/:id', requireAdmin, async (req, res) => {
    const db = await readDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    const { disabled, password, displayName, role } = req.body ?? {};
    if (displayName !== undefined) user.displayName = String(displayName);
    if (password !== undefined) user.password = String(password);
    if (role !== undefined && ['student', 'teacher', 'admin'].includes(role)) user.role = role as UserRole;
    if (disabled !== undefined) (user as any).disabled = Boolean(disabled);
    await writeDb(db);
    ok(res, { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, disabled: !!(user as any).disabled });
  });

  app.delete('/api/v1/admin/users/:id', requireAdmin, async (req, res) => {
    const db = await readDb();
    const before = db.users.length;
    db.users = db.users.filter(u => u.id !== req.params.id);
    await writeDb(db);
    ok(res, { deleted: before !== db.users.length });
  });

  app.get('/api/v1/admin/users/:id/records', requireAdmin, async (req, res) => {
    const db = await readDb();
    const records = db.learningRecords.filter(r => r.studentId === req.params.id);
    ok(res, records);
  });

  // Admin middleware
  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const userId = currentUserId(req);
    if (!userId) return fail(res, 401, 'Unauthorized');
    const db = readDbSync();
    const user = db.users.find((u) => u.id === userId);
    if (!user || user.role !== 'admin') return fail(res, 403, 'Admin access required');
    next();
  }

  function readDbSync() {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'backend/data/db.json'), 'utf8');
    return JSON.parse(raw) as import('./types.ts').Database;
  }

  // T14: Admin - Live sessions list
  app.get('/api/v1/admin/live-sessions', requireAdmin, async (_req, res) => {
    const db = await readDb();
    const items = db.liveSessions.map((s) => {
      const course = db.courses.find((c) => c.id === s.courseId);
      const lesson = db.lessonNodes.find((n) => n.id === s.lessonNodeId);
      const teacher = db.users.find((u) => u.id === s.teacherId);
      return {
        ...s,
        courseTitle: course?.title || '',
        lessonTitle: lesson?.title || '',
        teacherName: teacher?.displayName || ''
      };
    });
    ok(res, items);
  });

  // T14: Admin - Recordings list (lectures + student recordings)
  app.get('/api/v1/admin/recordings', requireAdmin, async (req, res) => {
    const db = await readDb();
    const courseId = String(req.query.courseId || '');
    const lectures = db.lectures
      .filter((l) => !courseId || l.courseId === courseId)
      .map((l) => {
        const course = db.courses.find((c) => c.id === l.courseId);
        const teacher = db.users.find((u) => u.id === l.teacherId);
        return { type: 'lecture' as const, ...l, courseTitle: course?.title || '', teacherName: teacher?.displayName || '' };
      });
    const recordings = db.recordings
      .filter((r) => !courseId || r.courseId === courseId)
      .map((r) => {
        const course = db.courses.find((c) => c.id === r.courseId);
        const student = db.users.find((u) => u.id === r.studentId);
        return { type: 'student' as const, ...r, courseTitle: course?.title || '', studentName: student?.displayName || '' };
      });
    ok(res, [...lectures, ...recordings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  // T14: Admin - Notes (classroom comments/danmaku)
  app.get('/api/v1/admin/notes', requireAdmin, async (_req, res) => {
    const db = await readDb();
    const items = db.classroomComments.map((c) => {
      const session = db.liveSessions.find((s) => s.id === c.liveSessionId);
      const student = db.users.find((u) => u.id === c.studentId);
      return {
        ...c,
        sessionTitle: session ? `Live ${session.id.slice(0, 8)}` : '',
        studentName: student?.displayName || ''
      };
    });
    ok(res, items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  // T14: Admin - Transcript segments (stub: returns live sessions with transcript metadata)
  app.get('/api/v1/admin/transcripts', requireAdmin, async (req, res) => {
    const db = await readDb();
    const liveSessionId = String(req.query.liveSessionId || '');
    const sessions = db.liveSessions.filter((s) => !liveSessionId || s.id === liveSessionId);
    const items = sessions.map((s) => {
      const course = db.courses.find((c) => c.id === s.courseId);
      const comments = db.classroomComments.filter((c) => c.liveSessionId === s.id);
      return {
        liveSessionId: s.id,
        courseTitle: course?.title || '',
        segments: comments.map((c) => ({
          id: c.id,
          sourceText: c.body,
          translatedText: `[AI] ${c.body}`,
          language: 'zh-CN',
          createdAt: c.createdAt
        }))
      };
    });
    ok(res, items);
  });

  // T14: Admin - Courseware files
  app.get('/api/v1/admin/coursewares', requireAdmin, async (_req, res) => {
    const db = await readDb();
    const items = db.files.map((f) => {
      const course = db.courses.find((c) => c.id === f.courseId);
      const pages = db.coursePages.filter((p) => p.courseId === f.courseId && p.fileUrl === f.storageUrl);
      return {
        ...f,
        courseTitle: course?.title || '',
        pageCount: pages.length,
        renderStatus: ['pdf', 'pptx'].includes(f.type) ? 'ready' : 'ready' as const
      };
    });
    ok(res, items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  // T14: Admin - Assignment imports (Excel parse results)
  app.get('/api/v1/admin/assignment-imports', requireAdmin, async (_req, res) => {
    const db = await readDb();
    const imports = db.homeworkImports.length > 0
      ? db.homeworkImports
      : db.files.filter((f) => f.type === 'xlsx').map((f) => ({
        id: f.id,
        courseId: f.courseId,
        lessonNodeId: f.lessonNodeId || '',
        fileId: f.id,
        filename: f.filename,
        tasksCount: db.learningTasks.filter((t) => t.sourceFileId === f.id).length,
        vocabCount: db.vocabularyItems.filter((v) => v.sourceFileId === f.id).length,
        errors: [] as string[],
        createdAt: f.createdAt
      }));
    const items = imports.map((item) => {
      const course = db.courses.find((c) => c.id === item.courseId);
      const lesson = item.lessonNodeId ? db.lessonNodes.find((n) => n.id === item.lessonNodeId) : undefined;
      return {
        fileId: item.fileId,
        filename: item.filename,
        courseTitle: course?.title || '',
        liveClassTitle: lesson?.title || '',
        tasksCount: item.tasksCount,
        vocabCount: item.vocabCount,
        errors: item.errors,
        createdAt: item.createdAt
      };
    });
    ok(res, items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  // T14: Admin - Toggle note visibility
  app.patch('/api/v1/admin/notes/:id', requireAdmin, async (req, res) => {
    const db = await readDb();
    const comment = db.classroomComments.find((c) => c.id === req.params.id);
    if (!comment) return fail(res, 404, 'Note not found');
    const { visibility } = req.body ?? {};
    if (visibility) comment.visibility = visibility as ClassroomComment['visibility'];
    await writeDb(db);
    ok(res, comment);
  });

  // T15: Admin - Learning progress
  app.get('/api/v1/admin/learning-progress', requireAdmin, async (req, res) => {
    const db = await readDb();
    const studentId = String(req.query.studentId || '');
    const courseId = String(req.query.courseId || '');
    const lessonNodeId = String(req.query.lessonNodeId || '');

    let students = db.users.filter((u) => u.role === 'student');
    if (studentId) students = students.filter((u) => u.id === studentId);

    let courses = db.courses;
    if (courseId) courses = courses.filter((c) => c.id === courseId);

    const result = students.map((student) => {
      const courseProgress = courses.map((course) => {
        const nodes = db.lessonNodes.filter((n) => n.courseId === course.id);
        const filteredNodes = lessonNodeId ? nodes.filter((n) => n.id === lessonNodeId) : nodes;
        const lessonProgress = filteredNodes.map((node) => {
          const tasks = db.learningTasks.filter((t) => t.courseId === course.id);
          const records = db.learningRecords.filter((r) => r.studentId === student.id && r.lessonNodeId === node.id);
          const completedTasks = records.filter((r) => r.status === 'completed').length;
          const recordings = db.recordings.filter((r) => r.studentId === student.id && r.courseId === course.id).length;
          const scores = records.filter((r) => r.score > 0).map((r) => r.score);
          const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return {
            lessonNodeId: node.id,
            lessonTitle: node.title,
            totalTasks: tasks.length,
            completedTasks,
            completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
            recordings,
            avgScore: Math.round(avgScore * 10) / 10
          };
        });
        return { courseId: course.id, courseTitle: course.title, lessonProgress };
      });
      return {
        studentId: student.id,
        displayName: student.displayName,
        courseProgress
      };
    });

    ok(res, { students: result });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    fail(res, 500, 'Internal server error');
  });

  return app;
}
