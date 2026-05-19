/**
 * S4-T04: Assignments repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, query, queryRow, queryRows } from '../db/postgres.ts';
import type { AssignmentNodeDto, LearningTaskDto, LearningRecordDto, HomeworkImportDto } from './types.ts';

function mapAssignmentNode(row: Record<string, any>): AssignmentNodeDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    title: row.title,
    dueAt: row.due_at ?? row.dueAt,
    status: row.status,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapTask(row: Record<string, any>): LearningTaskDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    assignmentNodeId: row.assignment_node_id ?? row.assignmentNodeId,
    taskKey: row.task_key ?? row.taskKey,
    taskType: row.task_type ?? row.taskType,
    unit: row.unit ?? 1,
    lesson: row.lesson ?? 1,
    lessonTitle: row.lesson_title ?? row.lessonTitle ?? '',
    pageNumber: row.page_number ?? row.pageNumber ?? 1,
    zhText: row.zh_text ?? row.zhText,
    pinyin: row.pinyin ?? '',
    translationRu: row.translation_ru ?? row.translationRu ?? '',
    translationKk: row.translation_kk ?? row.translationKk ?? '',
    prompt: row.prompt ?? '',
    answer: row.answer ?? '',
    initial: row.initial ?? '',
    final: row.final ?? '',
    tone: row.tone ?? '',
    rhymeGroup: row.rhyme_group ?? row.rhymeGroup ?? '',
    difficulty: row.difficulty ?? 1,
    publishToHomework: row.publish_to_homework ?? row.publishToHomework ?? true,
    publishToVocab: row.publish_to_vocab ?? row.publishToVocab ?? false,
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapRecord(row: Record<string, any>): LearningRecordDto {
  return {
    id: row.id,
    studentId: row.student_id ?? row.studentId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    assignmentNodeId: row.assignment_node_id ?? row.assignmentNodeId,
    taskId: row.task_id ?? row.taskId,
    context: row.context,
    status: row.status,
    score: parseFloat(row.score ?? row.score ?? 0),
    attemptsCount: row.attempts_count ?? row.attemptsCount ?? 0,
    lastRecordingId: row.last_recording_id ?? row.lastRecordingId,
    completedAt: row.completed_at ?? row.completedAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapImport(row: Record<string, any>): HomeworkImportDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    assignmentNodeId: row.assignment_node_id ?? row.assignmentNodeId,
    fileId: row.file_id ?? row.fileId,
    sourceMode: row.source_mode ?? row.sourceMode,
    filename: row.filename,
    tasksCount: row.tasks_count ?? row.tasksCount ?? 0,
    vocabCount: row.vocab_count ?? row.vocabCount ?? 0,
    errors: row.errors ?? [],
    createdAt: row.created_at ?? row.createdAt,
  };
}

// ─── Assignment Nodes ───

export async function findAssignmentNodeByLessonNodeId(lessonNodeId: string): Promise<AssignmentNodeDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const node = db.assignmentNodes.find((a) => a.lessonNodeId === lessonNodeId);
    return node ? mapAssignmentNode(node) : null;
  }
  const row = await queryRow('SELECT * FROM assignment_nodes WHERE lesson_node_id = $1', [lessonNodeId]);
  return row ? mapAssignmentNode(row) : null;
}

// ─── Learning Tasks ───

export async function findTasksByAssignmentNodeId(assignmentNodeId: string): Promise<LearningTaskDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    // JSON mode: learning tasks don't have assignmentNodeId directly; filter via lesson node
    const assignmentNode = db.assignmentNodes.find((a) => a.id === assignmentNodeId);
    if (!assignmentNode) return [];
    return db.learningTasks.filter((t) => t.lessonNodeId === assignmentNode.lessonNodeId).map(mapTask);
  }
  const rows = await queryRows(
    'SELECT * FROM learning_tasks WHERE assignment_node_id = $1 ORDER BY sort_order, id',
    [assignmentNodeId]
  );
  return rows.map(mapTask);
}

// ─── Learning Records ───

export async function findLearningRecords(studentId: string, lessonNodeId?: string): Promise<LearningRecordDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    let records = db.learningRecords.filter((r) => r.studentId === studentId);
    if (lessonNodeId) records = records.filter((r) => r.lessonNodeId === lessonNodeId);
    return records.map(mapRecord);
  }
  const sql = lessonNodeId
    ? 'SELECT * FROM learning_records WHERE student_id = $1 AND lesson_node_id = $2 ORDER BY updated_at DESC'
    : 'SELECT * FROM learning_records WHERE student_id = $1 ORDER BY updated_at DESC';
  const params = lessonNodeId ? [studentId, lessonNodeId] : [studentId];
  const rows = await queryRows(sql, params);
  return rows.map(mapRecord);
}

export async function upsertLearningRecord(data: {
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
}): Promise<LearningRecordDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.learningRecords.findIndex((r) => r.studentId === data.studentId && r.taskId === data.taskId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      const existing = db.learningRecords[idx];
      Object.assign(existing, {
        context: data.context as any,
        status: data.status as any,
        score: data.score,
        attemptsCount: data.attemptsCount,
        lastRecordingId: data.lastRecordingId ?? existing.lastRecordingId,
        completedAt: data.completedAt ?? existing.completedAt,
        updatedAt: now,
      });
      await writeDb(db);
      return mapRecord(existing);
    }
    const record = {
      id: crypto.randomUUID(),
      studentId: data.studentId,
      taskId: data.taskId,
      lessonNodeId: data.lessonNodeId,
      context: data.context as any,
      status: data.status as any,
      score: data.score,
      attemptsCount: data.attemptsCount,
      lastRecordingId: data.lastRecordingId ?? '',
      completedAt: data.completedAt ?? '',
      updatedAt: now,
    };
    db.learningRecords.push(record as any);
    await writeDb(db);
    return mapRecord(record);
  }
  const row = await queryRow(
    `INSERT INTO learning_records (student_id, lesson_node_id, assignment_node_id, task_id, context, status, score, attempts_count, last_recording_id, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (student_id, lesson_node_id, task_id) DO UPDATE SET
       status = EXCLUDED.status,
       score = EXCLUDED.score,
       attempts_count = EXCLUDED.attempts_count,
       last_recording_id = EXCLUDED.last_recording_id,
       completed_at = EXCLUDED.completed_at,
       updated_at = now()
     RETURNING *`,
    [data.studentId, data.lessonNodeId, data.assignmentNodeId, data.taskId, data.context, data.status, data.score, data.attemptsCount, data.lastRecordingId, data.completedAt]
  );
  return mapRecord(row!);
}

// ─── Assignment Imports ───

export async function createAssignmentImport(data: {
  courseId: string;
  lessonNodeId?: string;
  assignmentNodeId?: string;
  fileId?: string;
  sourceMode: string;
  filename?: string;
  tasksCount: number;
  vocabCount: number;
  errors: string[];
  createdBy: string;
}): Promise<HomeworkImportDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const imp = {
      id: crypto.randomUUID(),
      courseId: data.courseId,
      lessonNodeId: data.lessonNodeId,
      assignmentNodeId: data.assignmentNodeId,
      fileId: data.fileId,
      sourceMode: data.sourceMode,
      filename: data.filename,
      tasksCount: data.tasksCount,
      vocabCount: data.vocabCount,
      errors: data.errors,
      createdAt: new Date().toISOString(),
    };
    db.homeworkImports.push(imp as any);
    await writeDb(db);
    return mapImport(imp);
  }
  const row = await queryRow(
    `INSERT INTO assignment_imports (course_id, lesson_node_id, assignment_node_id, file_id, source_mode, filename, tasks_count, vocab_count, errors, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.courseId, data.lessonNodeId, data.assignmentNodeId, data.fileId, data.sourceMode, data.filename, data.tasksCount, data.vocabCount, JSON.stringify(data.errors), data.createdBy]
  );
  return mapImport(row!);
}
