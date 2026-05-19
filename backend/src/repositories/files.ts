/**
 * S4-T04: Files repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, queryRow, queryRows } from '../db/postgres.ts';
import type { FileDto, CoursewareFileDto } from './types.ts';

function mapFile(row: Record<string, any>): FileDto {
  return {
    id: row.id,
    ownerId: row.owner_id ?? row.ownerId,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    kind: row.kind,
    filename: row.filename,
    mimeType: row.mime_type ?? row.mimeType,
    sizeBytes: row.size_bytes ?? row.sizeBytes ?? 0,
    storageUrl: row.storage_url ?? row.storageUrl,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapCourseware(row: Record<string, any>): CoursewareFileDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    kind: row.kind,
    filename: row.filename ?? '',
    storageUrl: row.storage_url ?? row.storageUrl ?? '',
    renderStatus: row.render_status ?? row.renderStatus ?? 'pending',
    pageCount: row.page_count ?? row.pageCount ?? 0,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export async function findById(id: string): Promise<FileDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const f = db.files.find((f) => f.id === id);
    return f ? mapFile(f) : null;
  }
  const row = await queryRow('SELECT * FROM files WHERE id = $1', [id]);
  return row ? mapFile(row) : null;
}

export async function createFile(data: {
  ownerId: string;
  courseId?: string;
  lessonNodeId?: string;
  kind: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  checksumSha256?: string;
}): Promise<FileDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const file = {
      id: crypto.randomUUID(),
      ownerId: data.ownerId,
      courseId: data.courseId,
      lessonNodeId: data.lessonNodeId,
      kind: data.kind,
      filename: data.filename,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storageUrl: data.storageUrl,
      createdAt: new Date().toISOString(),
    };
    db.files.push(file as any);
    await writeDb(db);
    return mapFile(file);
  }
  const row = await queryRow(
    `INSERT INTO files (owner_id, course_id, lesson_node_id, kind, filename, mime_type, size_bytes, storage_url, checksum_sha256)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [data.ownerId, data.courseId, data.lessonNodeId, data.kind, data.filename, data.mimeType, data.sizeBytes, data.storageUrl, data.checksumSha256]
  );
  return mapFile(row!);
}

export async function findCoursewareByLessonNodeId(lessonNodeId: string): Promise<CoursewareFileDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.coursewareFiles.filter((f) => f.lessonNodeId === lessonNodeId).map(mapCourseware);
  }
  const rows = await queryRows(
    `SELECT cf.*, f.filename, f.storage_url
     FROM courseware_files cf
     JOIN files f ON f.id = cf.id
     WHERE cf.lesson_node_id = $1
     ORDER BY cf.created_at DESC`,
    [lessonNodeId]
  );
  return rows.map(mapCourseware);
}
