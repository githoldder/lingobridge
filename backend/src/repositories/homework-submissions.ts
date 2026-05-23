/**
 * Homework Submissions Repository — JSON + Postgres dual-mode
 * S5-T06: 作业三级缓存策略（L3 后端草稿存储）
 */
import { getDbMode, query, queryRow, queryRows } from '../db/postgres.js';
import { readDb, writeDb } from '../db.js';

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

const DRAFT_CACHE_TTL_MS = 5 * 60 * 1000;
const submissionCache = new Map<string, { value: HomeworkSubmissionDto | null; expiresAt: number }>();

function cacheKey(studentId: string, assignmentNodeId: string) {
  return `${studentId}:${assignmentNodeId}`;
}

function getCached(studentId: string, assignmentNodeId: string): HomeworkSubmissionDto | null | undefined {
  const item = submissionCache.get(cacheKey(studentId, assignmentNodeId));
  if (!item) return undefined;
  if (item.expiresAt < Date.now()) {
    submissionCache.delete(cacheKey(studentId, assignmentNodeId));
    return undefined;
  }
  return item.value;
}

function setCached(value: HomeworkSubmissionDto | null) {
  if (!value) return;
  submissionCache.set(cacheKey(value.studentId, value.assignmentNodeId), {
    value,
    expiresAt: Date.now() + DRAFT_CACHE_TTL_MS
  });
}

function rowToDto(row: any): HomeworkSubmissionDto {
  return {
    id: row.id,
    studentId: row.student_id ?? row.studentId,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    assignmentNodeId: row.assignment_node_id ?? row.assignmentNodeId,
    status: row.status,
    draftData: typeof row.draft_data === 'string' ? JSON.parse(row.draft_data) : (row.draft_data || row.draftData || {}),
    submittedAt: row.submitted_at ?? row.submittedAt,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export async function findByStudentAndAssignment(studentId: string, assignmentNodeId: string): Promise<HomeworkSubmissionDto | null> {
  if (getDbMode() === 'postgres') {
    const cached = getCached(studentId, assignmentNodeId);
    if (cached !== undefined) return cached;

    const row = await queryRow(
      'SELECT * FROM homework_submissions WHERE student_id = $1 AND assignment_node_id = $2',
      [studentId, assignmentNodeId]
    );
    const dto = row ? rowToDto(row) : null;
    if (dto) setCached(dto);
    return dto;
  }
  const db = await readDb();
  const item = (db.homeworkSubmissions || []).find(
    (s: any) => s.studentId === studentId && s.assignmentNodeId === assignmentNodeId
  );
  const dto = item || null;
  if (dto) setCached(dto);
  return dto;
}

export async function findByStudentAndLesson(studentId: string, lessonNodeId: string): Promise<HomeworkSubmissionDto[]> {
  if (getDbMode() === 'postgres') {
    const rows = await queryRows(
      'SELECT * FROM homework_submissions WHERE student_id = $1 AND lesson_node_id = $2 ORDER BY updated_at DESC',
      [studentId, lessonNodeId]
    );
    return rows.map(rowToDto);
  }
  const db = await readDb();
  return (db.homeworkSubmissions || []).filter(
    (s: any) => s.studentId === studentId && s.lessonNodeId === lessonNodeId
  );
}

export async function findByStudentAndCourse(studentId: string, courseId: string): Promise<HomeworkSubmissionDto[]> {
  if (getDbMode() === 'postgres') {
    const rows = await queryRows(
      'SELECT * FROM homework_submissions WHERE student_id = $1 AND course_id = $2 ORDER BY updated_at DESC',
      [studentId, courseId]
    );
    return rows.map(rowToDto);
  }
  const db = await readDb();
  return (db.homeworkSubmissions || []).filter(
    (s: any) => s.studentId === studentId && s.courseId === courseId
  );
}

export async function create(data: {
  studentId: string;
  courseId: string;
  lessonNodeId: string;
  assignmentNodeId: string;
  draftData?: Record<string, any>;
}): Promise<HomeworkSubmissionDto> {
  if (getDbMode() === 'postgres') {
    const row = await queryRow(
      `INSERT INTO homework_submissions (student_id, course_id, lesson_node_id, assignment_node_id, draft_data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.studentId, data.courseId, data.lessonNodeId, data.assignmentNodeId, JSON.stringify(data.draftData || {})]
    );
    const dto = rowToDto(row!);
    setCached(dto);
    return dto;
  }
  const db = await readDb();
  if (!db.homeworkSubmissions) db.homeworkSubmissions = [];
  const item: any = {
    id: crypto.randomUUID(),
    studentId: data.studentId,
    courseId: data.courseId,
    lessonNodeId: data.lessonNodeId,
    assignmentNodeId: data.assignmentNodeId,
    status: 'draft',
    draftData: data.draftData || {},
    submittedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.homeworkSubmissions.push(item);
  await writeDb(db);
  setCached(item);
  return item;
}

export async function updateDraft(id: string, draftData: Record<string, any>): Promise<HomeworkSubmissionDto | null> {
  if (getDbMode() === 'postgres') {
    const row = await queryRow(
      `UPDATE homework_submissions SET draft_data = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [JSON.stringify(draftData), id]
    );
    const dto = row ? rowToDto(row) : null;
    if (dto) setCached(dto);
    return dto;
  }
  const db = await readDb();
  const item = (db.homeworkSubmissions || []).find((s: any) => s.id === id);
  if (!item) return null;
  item.draftData = draftData;
  item.updatedAt = new Date().toISOString();
  await writeDb(db);
  setCached(item);
  return item;
}

export async function submit(id: string): Promise<HomeworkSubmissionDto | null> {
  if (getDbMode() === 'postgres') {
    const row = await queryRow(
      `UPDATE homework_submissions SET status = 'submitted', submitted_at = now(), updated_at = now() WHERE id = $1 AND status = 'draft' RETURNING *`,
      [id]
    );
    const dto = row ? rowToDto(row) : null;
    if (dto) setCached(dto);
    return dto;
  }
  const db = await readDb();
  const item = (db.homeworkSubmissions || []).find((s: any) => s.id === id);
  if (!item || item.status !== 'draft') return null;
  item.status = 'submitted';
  item.submittedAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  await writeDb(db);
  setCached(item);
  return item;
}

export async function deleteById(id: string): Promise<boolean> {
  if (getDbMode() === 'postgres') {
    const existing = await queryRow('SELECT * FROM homework_submissions WHERE id = $1', [id]);
    const result = await query('DELETE FROM homework_submissions WHERE id = $1', [id]);
    if (existing) submissionCache.delete(cacheKey(existing.student_id, existing.assignment_node_id));
    return (result?.rowCount ?? 0) > 0;
  }
  const db = await readDb();
  const before = (db.homeworkSubmissions || []).length;
  const removed = (db.homeworkSubmissions || []).find((s: any) => s.id === id);
  db.homeworkSubmissions = (db.homeworkSubmissions || []).filter((s: any) => s.id !== id);
  if (removed) submissionCache.delete(cacheKey(removed.studentId, removed.assignmentNodeId));
  if (db.homeworkSubmissions.length < before) { await writeDb(db); return true; }
  return false;
}
