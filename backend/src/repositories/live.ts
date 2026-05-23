/**
 * S4-T04: Live repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, query, queryRow, queryRows } from '../db/postgres.ts';
import type { LiveSessionDto, LiveClassStudentDto } from './types.ts';

function mapSession(row: Record<string, any>): LiveSessionDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    teacherId: row.teacher_id ?? row.teacherId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    status: row.status,
    sourceMode: row.source_mode ?? row.sourceMode ?? 'pdf',
    currentPage: row.current_page ?? row.currentPage ?? 1,
    recordingStatus: row.recording_status ?? row.recordingStatus ?? 'idle',
    startedAt: row.started_at ?? row.startedAt,
    endedAt: row.ended_at ?? row.endedAt,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapClassStudent(row: Record<string, any>): LiveClassStudentDto {
  return {
    id: row.id,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    studentId: row.student_id ?? row.studentId,
    source: row.source ?? 'course_member',
    joinedAt: row.joined_at ?? row.joinedAt,
  };
}

export async function findById(id: string): Promise<LiveSessionDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const s = db.liveSessions.find((s) => s.id === id);
    return s ? mapSession(s) : null;
  }
  const row = await queryRow('SELECT * FROM live_sessions WHERE id = $1', [id]);
  return row ? mapSession(row) : null;
}

export async function findActiveByCourseId(courseId: string): Promise<LiveSessionDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const s = db.liveSessions.find((s) => s.courseId === courseId && (s.status === 'active' || s.status === 'scheduled' as string));
    return s ? mapSession(s) : null;
  }
  const row = await queryRow(
    `SELECT * FROM live_sessions
     WHERE course_id = $1 AND status IN ('scheduled', 'active')
     ORDER BY created_at DESC LIMIT 1`,
    [courseId]
  );
  return row ? mapSession(row) : null;
}

export async function findActiveByLessonNodeId(lessonNodeId: string): Promise<LiveSessionDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const s = db.liveSessions.find((s) => s.lessonNodeId === lessonNodeId && (s.status === 'active' || s.status === 'scheduled' as string));
    return s ? mapSession(s) : null;
  }
  const row = await queryRow(
    `SELECT * FROM live_sessions
     WHERE lesson_node_id = $1 AND status IN ('scheduled', 'active')
     ORDER BY created_at DESC LIMIT 1`,
    [lessonNodeId]
  );
  return row ? mapSession(row) : null;
}

export async function endActiveByCourseAndTeacher(courseId: string, teacherId: string): Promise<void> {
  const endedAt = new Date().toISOString();
  if (getDbMode() === 'json') {
    const db = await readDb();
    for (const session of db.liveSessions) {
      if (session.courseId === courseId && session.teacherId === teacherId && session.status === 'active') {
        session.status = 'ended';
        session.endedAt = endedAt;
      }
    }
    await writeDb(db);
    return;
  }
  await query(
    `UPDATE live_sessions
     SET status = 'ended', ended_at = $3, updated_at = now()
     WHERE course_id = $1 AND teacher_id = $2 AND status = 'active'`,
    [courseId, teacherId, endedAt]
  );
}

export async function createSession(data: {
  courseId: string;
  teacherId: string;
  lessonNodeId: string;
  sourceMode?: string;
  status?: string;
}): Promise<LiveSessionDto> {
  const now = new Date().toISOString();
  if (getDbMode() === 'json') {
    const db = await readDb();
    const session = {
      id: crypto.randomUUID(),
      courseId: data.courseId,
      teacherId: data.teacherId,
      lessonNodeId: data.lessonNodeId,
      status: data.status ?? 'scheduled',
      sourceMode: data.sourceMode ?? 'pdf',
      currentPage: 1,
      recordingStatus: 'idle',
      startedAt: data.status === 'active' ? now : undefined,
      endedAt: '',
      createdAt: now,
      updatedAt: now,
    };
    db.liveSessions.push(session as any);
    await writeDb(db);
    return mapSession(session);
  }
  const row = await queryRow(
    `INSERT INTO live_sessions (course_id, teacher_id, lesson_node_id, source_mode, status, started_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.courseId, data.teacherId, data.lessonNodeId, data.sourceMode ?? 'pdf', data.status ?? 'scheduled', data.status === 'active' ? now : null]
  );
  return mapSession(row!);
}

export async function updateSession(id: string, data: Partial<{
  sourceMode: string;
  status: string;
  currentPage: number;
  recordingStatus: string;
  startedAt: string;
  endedAt: string;
}>): Promise<LiveSessionDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.liveSessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    Object.assign(db.liveSessions[idx], data, { updatedAt: new Date().toISOString() });
    await writeDb(db);
    return mapSession(db.liveSessions[idx]);
  }
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (data.sourceMode !== undefined) { sets.push(`source_mode = $${i++}`); vals.push(data.sourceMode); }
  if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
  if (data.currentPage !== undefined) { sets.push(`current_page = $${i++}`); vals.push(data.currentPage); }
  if (data.recordingStatus !== undefined) { sets.push(`recording_status = $${i++}`); vals.push(data.recordingStatus); }
  if (data.startedAt !== undefined) { sets.push(`started_at = $${i++}`); vals.push(data.startedAt); }
  if (data.endedAt !== undefined) { sets.push(`ended_at = $${i++}`); vals.push(data.endedAt); }
  sets.push(`updated_at = now()`);
  vals.push(id);
  const row = await queryRow(`UPDATE live_sessions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  return row ? mapSession(row) : null;
}

// ─── Live Class Students ───

export async function findClassStudents(lessonNodeId: string): Promise<LiveClassStudentDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.liveClassStudents.filter((s) => s.lessonNodeId === lessonNodeId).map(mapClassStudent);
  }
  const rows = await queryRows(
    'SELECT * FROM live_class_students WHERE lesson_node_id = $1 AND removed_at IS NULL',
    [lessonNodeId]
  );
  return rows.map(mapClassStudent);
}

export async function addClassStudent(lessonNodeId: string, studentId: string, source = 'course_member'): Promise<LiveClassStudentDto> {
  const now = new Date().toISOString();
  if (getDbMode() === 'json') {
    const db = await readDb();
    const existing = db.liveClassStudents.find((s) => s.lessonNodeId === lessonNodeId && s.studentId === studentId);
    if (existing) return mapClassStudent(existing);
    const row = { id: crypto.randomUUID(), lessonNodeId, studentId, source, joinedAt: now };
    db.liveClassStudents.push(row as any);
    await writeDb(db);
    return mapClassStudent(row);
  }
  const row = await queryRow(
    `INSERT INTO live_class_students (lesson_node_id, student_id, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (lesson_node_id, student_id) DO UPDATE SET removed_at = NULL
     RETURNING *`,
    [lessonNodeId, studentId, source]
  );
  return mapClassStudent(row!);
}
