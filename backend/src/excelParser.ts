import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import type { LearningTask, VocabularyItem, Database } from './types.ts';

export interface ParseResult {
  learningTasks: LearningTask[];
  vocabularyItems: VocabularyItem[];
  errors: string[];
}

const REQUIRED_COLUMNS = [
  'course_code', 'unit', 'lesson', 'task_id', 'task_type',
  'zh_text', 'pinyin', 'translation_ru', 'translation_kk',
  'publish_to_homework', 'publish_to_vocab'
];

const VALID_TASK_TYPES = ['pronunciation', 'vocabulary', 'sentence_reading', 'dialogue', 'listening'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, '_');
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  return false;
}

function toNum(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function str(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function parseExcel(filePath: string, courseId: string, sourceFileId: string): ParseResult {
  const errors: string[] = [];
  let fileBuffer: Buffer;
  try {
    fileBuffer = readFileSync(filePath);
  } catch (err) {
    return { learningTasks: [], vocabularyItems: [], errors: [`Failed to read Excel file: ${err}`] };
  }
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  } catch (err) {
    return { learningTasks: [], vocabularyItems: [], errors: [`Failed to parse Excel file: ${err}`] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { learningTasks: [], vocabularyItems: [], errors: ['Excel file has no sheets'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    return { learningTasks: [], vocabularyItems: [], errors: ['No data rows found in the first sheet'] };
  }

  const headers = Object.keys(rawRows[0] as object);
  const normalizedHeaders = headers.map(normalizeHeader);

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));
  if (missingColumns.length > 0) {
    return { learningTasks: [], vocabularyItems: [], errors: [`Missing required columns: ${missingColumns.join(', ')}`] };
  }

  const colIndex = (name: string): number => {
    const idx = normalizedHeaders.indexOf(name);
    return idx >= 0 ? idx : -1;
  };

  const now = new Date().toISOString();
  const learningTasks: LearningTask[] = [];
  const vocabularyItems: VocabularyItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 2;
    const vals = headers.map((h) => row[h]);

    const get = (colName: string): unknown => {
      const idx = colIndex(colName);
      return idx >= 0 ? vals[idx] : undefined;
    };

    const taskType = str(get('task_type'));
    if (!VALID_TASK_TYPES.includes(taskType)) {
      errors.push(`Row ${rowNum}: invalid task_type "${taskType}". Must be one of: ${VALID_TASK_TYPES.join(', ')}`);
      continue;
    }

    const taskId = str(get('task_id'));
    if (!taskId) {
      errors.push(`Row ${rowNum}: task_id is required`);
      continue;
    }

    const zhText = str(get('zh_text'));
    if (!zhText) {
      errors.push(`Row ${rowNum}: zh_text is required`);
      continue;
    }

    const publishToHomework = toBool(get('publish_to_homework'));
    const publishToVocab = toBool(get('publish_to_vocab'));

    const learningTask: LearningTask = {
      id: crypto.randomUUID(),
      courseId,
      sourceFileId,
      taskId,
      taskType: taskType as LearningTask['taskType'],
      unit: toNum(get('unit'), 1),
      lesson: toNum(get('lesson'), 1),
      lessonTitle: str(get('lesson_title')),
      pageNumber: toNum(get('page_number'), 1),
      zhText,
      pinyin: str(get('pinyin')),
      translationRu: str(get('translation_ru')),
      translationKk: str(get('translation_kk')),
      prompt: str(get('prompt')),
      answer: str(get('answer')),
      initial: str(get('initial')),
      final: str(get('final')),
      tone: str(get('tone')),
      rhymeGroup: str(get('rhyme_group')),
      difficulty: toNum(get('difficulty'), 1),
      dueAt: str(get('due_at')),
      publishToHomework,
      publishToVocab,
      sortOrder: toNum(get('sort_order'), i + 1),
      createdAt: now,
      updatedAt: now
    };
    learningTasks.push(learningTask);

    if (publishToVocab) {
      const vocabItem: VocabularyItem = {
        id: crypto.randomUUID(),
        courseId,
        taskId,
        zhText,
        pinyin: str(get('pinyin')),
        translationRu: str(get('translation_ru')),
        translationKk: str(get('translation_kk')),
        initial: str(get('initial')),
        final: str(get('final')),
        tone: str(get('tone')),
        rhymeGroup: str(get('rhyme_group')),
        difficulty: toNum(get('difficulty'), 1),
        tags: str(get('tags')),
        sourceFileId,
        createdAt: now
      };
      vocabularyItems.push(vocabItem);
    }
  }

  return { learningTasks, vocabularyItems, errors };
}

export function upsertTasks(db: Database, tasks: LearningTask[]): void {
  for (const task of tasks) {
    const existing = db.learningTasks.find(
      (t) => t.courseId === task.courseId && t.taskId === task.taskId
    );
    if (existing) {
      Object.assign(existing, task, { id: existing.id, createdAt: existing.createdAt });
    } else {
      db.learningTasks.push(task);
    }
  }
}

export function upsertVocabulary(db: Database, items: VocabularyItem[]): void {
  for (const item of items) {
    const existing = db.vocabularyItems.find(
      (v) => v.courseId === item.courseId && v.taskId === item.taskId
    );
    if (existing) {
      Object.assign(existing, item, { id: existing.id, createdAt: existing.createdAt });
    } else {
      db.vocabularyItems.push(item);
    }
  }
}
