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

export async function findAssignmentNodeById(id: string): Promise<AssignmentNodeDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const node = db.assignmentNodes.find((a) => a.id === id);
    return node ? mapAssignmentNode(node) : null;
  }
  const row = await queryRow('SELECT * FROM assignment_nodes WHERE id = $1', [id]);
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

export async function findTasksByLessonNodeId(courseId: string, lessonNodeId: string): Promise<LearningTaskDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.learningTasks.filter((t) => t.courseId === courseId && t.lessonNodeId === lessonNodeId).map(mapTask);
  }
  const rows = await queryRows(
    'SELECT * FROM learning_tasks WHERE course_id = $1 AND lesson_node_id = $2 ORDER BY sort_order, id',
    [courseId, lessonNodeId]
  );
  return rows.map(mapTask);
}

export async function findTasksByCourseId(courseId: string): Promise<LearningTaskDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.learningTasks.filter((t) => t.courseId === courseId).map(mapTask);
  }
  const rows = await queryRows(
    'SELECT * FROM learning_tasks WHERE course_id = $1 ORDER BY sort_order, id',
    [courseId]
  );
  return rows.map(mapTask);
}

export async function upsertLearningTask(task: {
  courseId: string;
  lessonNodeId?: string | null;
  assignmentNodeId?: string | null;
  sourceImportId?: string | null;
  taskId: string;
  taskType: string;
  unit?: number;
  lesson?: number;
  lessonTitle?: string;
  pageNumber?: number;
  zhText: string;
  pinyin?: string;
  translationRu?: string;
  translationKk?: string;
  prompt?: string;
  answer?: string;
  initial?: string;
  final?: string;
  tone?: string;
  rhymeGroup?: string;
  difficulty?: number;
  publishToHomework?: boolean;
  publishToVocab?: boolean;
  sortOrder?: number;
}): Promise<void> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const existingIdx = db.learningTasks.findIndex(
      (t) => t.courseId === task.courseId && t.taskId === task.taskId
    );
    const now = new Date().toISOString();
    const taskRecord = {
      id: existingIdx >= 0 ? db.learningTasks[existingIdx].id : crypto.randomUUID(),
      courseId: task.courseId,
      lessonNodeId: task.lessonNodeId || undefined,
      assignmentNodeId: task.assignmentNodeId || undefined,
      taskId: task.taskId,
      taskType: task.taskType as any,
      unit: task.unit ?? 1,
      lesson: task.lesson ?? 1,
      lessonTitle: task.lessonTitle ?? '',
      pageNumber: task.pageNumber ?? 1,
      zhText: task.zhText,
      pinyin: task.pinyin ?? '',
      translationRu: task.translationRu ?? '',
      translationKk: task.translationKk ?? '',
      prompt: task.prompt ?? '',
      answer: task.answer ?? '',
      initial: task.initial ?? '',
      final: task.final ?? '',
      tone: task.tone ?? '',
      rhymeGroup: task.rhymeGroup ?? '',
      difficulty: task.difficulty ?? 1,
      publishToHomework: task.publishToHomework ?? true,
      publishToVocab: task.publishToVocab ?? false,
      sortOrder: task.sortOrder ?? 0,
      createdAt: existingIdx >= 0 ? db.learningTasks[existingIdx].createdAt : now,
      updatedAt: now
    };
    if (existingIdx >= 0) {
      const existing = db.learningTasks[existingIdx];
      Object.assign(existing, {
        taskType: task.taskType as any,
        zhText: task.zhText,
        pinyin: task.pinyin ?? '',
        translationRu: task.translationRu ?? '',
        translationKk: task.translationKk ?? '',
        prompt: task.prompt ?? '',
        answer: task.answer ?? '',
        difficulty: task.difficulty ?? 1,
        publishToHomework: task.publishToHomework ?? true,
        publishToVocab: task.publishToVocab ?? false,
        unit: task.unit ?? existing.unit,
        lesson: task.lesson ?? existing.lesson,
        lessonTitle: task.lessonTitle ?? existing.lessonTitle,
        pageNumber: task.pageNumber ?? existing.pageNumber,
        sortOrder: task.sortOrder ?? existing.sortOrder,
        lessonNodeId: task.lessonNodeId || existing.lessonNodeId,
        assignmentNodeId: task.assignmentNodeId || existing.assignmentNodeId,
        updatedAt: now
      });
    } else {
      db.learningTasks.push(taskRecord as any);
    }
    await writeDb(db);
    return;
  }
  await queryRow(
    `INSERT INTO learning_tasks (course_id, lesson_node_id, assignment_node_id, source_import_id, task_key, task_type, unit, lesson, lesson_title, page_number, zh_text, pinyin, translation_ru, translation_kk, prompt, answer, initial, final, tone, rhyme_group, difficulty, publish_to_homework, publish_to_vocab, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
     ON CONFLICT (course_id, lesson_node_id, task_key) DO UPDATE SET
       assignment_node_id = EXCLUDED.assignment_node_id,
       source_import_id = EXCLUDED.source_import_id,
       task_type = EXCLUDED.task_type,
       zh_text = EXCLUDED.zh_text,
       pinyin = EXCLUDED.pinyin,
       translation_ru = EXCLUDED.translation_ru,
       translation_kk = EXCLUDED.translation_kk,
       prompt = EXCLUDED.prompt,
       answer = EXCLUDED.answer,
       difficulty = EXCLUDED.difficulty,
       publish_to_homework = EXCLUDED.publish_to_homework,
       publish_to_vocab = EXCLUDED.publish_to_vocab,
       unit = EXCLUDED.unit,
       lesson = EXCLUDED.lesson,
       lesson_title = EXCLUDED.lesson_title,
       page_number = EXCLUDED.page_number,
       sort_order = EXCLUDED.sort_order,
       updated_at = now()`,
    [
      task.courseId,
      task.lessonNodeId || null,
      task.assignmentNodeId || null,
      task.sourceImportId || null,
      task.taskId,
      task.taskType,
      task.unit || 1,
      task.lesson || 1,
      task.lessonTitle || '',
      task.pageNumber || 1,
      task.zhText,
      task.pinyin || '',
      task.translationRu || '',
      task.translationKk || '',
      task.prompt || '',
      task.answer || '',
      task.initial || '',
      task.final || '',
      task.tone || '',
      task.rhymeGroup || '',
      task.difficulty || 1,
      task.publishToHomework ?? true,
      task.publishToVocab ?? false,
      task.sortOrder || 0
    ]
  );
}

export async function upsertVocabularyItem(item: {
  courseId: string;
  lessonNodeId?: string | null;
  taskId: string;
  zhText: string;
  pinyin?: string;
  translationRu?: string;
  translationKk?: string;
  initial?: string;
  final?: string;
  tone?: string;
  rhymeGroup?: string;
  difficulty?: number;
  tags?: string;
  sourceFileId?: string | null;
}): Promise<void> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const existingIdx = db.vocabularyItems.findIndex(
      (v) => v.courseId === item.courseId &&
             v.lessonNodeId === (item.lessonNodeId || undefined) &&
             v.zhText === item.zhText &&
             v.pinyin === (item.pinyin ?? '')
    );
    const now = new Date().toISOString();
    const vocabRecord = {
      id: existingIdx >= 0 ? db.vocabularyItems[existingIdx].id : crypto.randomUUID(),
      courseId: item.courseId,
      lessonNodeId: item.lessonNodeId || undefined,
      taskId: item.taskId,
      zhText: item.zhText,
      pinyin: item.pinyin ?? '',
      translationRu: item.translationRu ?? '',
      translationKk: item.translationKk ?? '',
      initial: item.initial ?? '',
      final: item.final ?? '',
      tone: item.tone ?? '',
      rhymeGroup: item.rhymeGroup ?? '',
      difficulty: item.difficulty ?? 1,
      tags: item.tags ?? '',
      sourceFileId: item.sourceFileId || undefined,
      createdAt: existingIdx >= 0 ? db.vocabularyItems[existingIdx].createdAt : now
    };
    if (existingIdx >= 0) {
      db.vocabularyItems[existingIdx] = vocabRecord;
    } else {
      db.vocabularyItems.push(vocabRecord);
    }
    await writeDb(db);
    return;
  }
  await queryRow(
    `DELETE FROM vocabulary_items 
     WHERE course_id = $1 
       AND (lesson_node_id = $2 OR (lesson_node_id IS NULL AND $2 IS NULL)) 
       AND zh_text = $3 
       AND pinyin = $4`,
    [
      item.courseId,
      item.lessonNodeId || null,
      item.zhText,
      item.pinyin || ''
    ]
  );
  await queryRow(
    `INSERT INTO vocabulary_items (course_id, lesson_node_id, task_id, zh_text, pinyin, translation_ru, translation_kk, initial, final, tone, rhyme_group, difficulty, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      item.courseId,
      item.lessonNodeId || null,
      null,
      item.zhText,
      item.pinyin || '',
      item.translationRu || '',
      item.translationKk || '',
      item.initial || '',
      item.final || '',
      item.tone || '',
      item.rhymeGroup || '',
      item.difficulty || 1,
      item.tags || ''
    ]
  );
}
