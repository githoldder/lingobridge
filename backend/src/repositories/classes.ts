/**
 * S5-T02: Classes repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, query, queryRow, queryRows } from '../db/postgres.ts';
import type { ClassDto, ClassMemberDto } from './types.ts';

function mapClass(row: Record<string, any>): ClassDto {
  return {
    id: row.id,
    teacherId: row.teacher_id ?? row.teacherId,
    name: row.name,
    description: row.description,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapClassMember(row: Record<string, any>): ClassMemberDto {
  return {
    id: row.id,
    classId: row.class_id ?? row.classId,
    studentId: row.student_id ?? row.studentId,
    joinedAt: row.joined_at ?? row.joinedAt,
  };
}

// ─── Class CRUD ───

export async function findById(id: string): Promise<ClassDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const c = db.classes.find((c) => c.id === id);
    return c ? mapClass(c) : null;
  }
  const row = await queryRow('SELECT * FROM classes WHERE id = $1', [id]);
  return row ? mapClass(row) : null;
}

export async function findByTeacherId(teacherId: string): Promise<ClassDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.classes.filter((c) => c.teacherId === teacherId).map(mapClass);
  }
  const rows = await queryRows('SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC', [teacherId]);
  return rows.map(mapClass);
}

export async function findAll(): Promise<ClassDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.classes.map(mapClass);
  }
  const rows = await queryRows('SELECT * FROM classes ORDER BY created_at DESC');
  return rows.map(mapClass);
}

export async function createClass(data: { teacherId: string; name: string; description?: string }): Promise<ClassDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const now = new Date().toISOString();
    const cls = {
      id: crypto.randomUUID(),
      teacherId: data.teacherId,
      name: data.name,
      description: data.description ?? '',
      createdAt: now,
      updatedAt: now,
    };
    db.classes.push(cls as any);
    await writeDb(db);
    return mapClass(cls);
  }
  const row = await queryRow(
    `INSERT INTO classes (teacher_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.teacherId, data.name, data.description ?? '']
  );
  return mapClass(row!);
}

export async function updateClass(id: string, data: Partial<{ name: string; description: string }>): Promise<ClassDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    Object.assign(db.classes[idx], data, { updatedAt: new Date().toISOString() });
    await writeDb(db);
    return mapClass(db.classes[idx]);
  }
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name); }
  if (data.description !== undefined) { sets.push(`description = $${i++}`); vals.push(data.description); }
  sets.push(`updated_at = now()`);
  vals.push(id);
  const row = await queryRow(`UPDATE classes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  return row ? mapClass(row) : null;
}

export async function deleteClass(id: string): Promise<boolean> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.classes.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    db.classes.splice(idx, 1);
    // class_members with this classId will be removed (matches CASCADE)
    db.classMembers = db.classMembers.filter((m) => m.classId !== id);
    await writeDb(db);
    return true;
  }
  // CASCADE on class_members and SET NULL on courses.class_id handled by DB
  const result = await query('DELETE FROM classes WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Class Members ───

export async function findMembers(classId: string): Promise<ClassMemberDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.classMembers.filter((m) => m.classId === classId).map(mapClassMember);
  }
  const rows = await queryRows(
    'SELECT * FROM class_members WHERE class_id = $1 AND removed_at IS NULL ORDER BY joined_at',
    [classId]
  );
  return rows.map(mapClassMember);
}

export async function addMember(classId: string, studentId: string): Promise<ClassMemberDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const existing = db.classMembers.find((m) => m.classId === classId && m.studentId === studentId);
    if (existing) return mapClassMember(existing);
    const member = {
      id: crypto.randomUUID(),
      classId,
      studentId,
      joinedAt: new Date().toISOString(),
    };
    db.classMembers.push(member as any);
    await writeDb(db);
    return mapClassMember(member);
  }
  const row = await queryRow(
    `INSERT INTO class_members (class_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT (class_id, student_id) DO UPDATE SET removed_at = NULL
     RETURNING *`,
    [classId, studentId]
  );
  return mapClassMember(row!);
}

export async function removeMember(classId: string, studentId: string): Promise<boolean> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.classMembers.findIndex((m) => m.classId === classId && m.studentId === studentId);
    if (idx === -1) return false;
    db.classMembers.splice(idx, 1);
    await writeDb(db);
    return true;
  }
  const result = await query(
    `UPDATE class_members SET removed_at = now() WHERE class_id = $1 AND student_id = $2 AND removed_at IS NULL`,
    [classId, studentId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findClassIdsByStudentId(studentId: string): Promise<string[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.classMembers.filter((m) => m.studentId === studentId).map((m) => m.classId);
  }
  const rows = await queryRows(
    'SELECT class_id FROM class_members WHERE student_id = $1 AND removed_at IS NULL',
    [studentId]
  );
  return rows.map((r: any) => r.class_id);
}

export async function findClassIdsByTeacherId(teacherId: string): Promise<string[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.classes.filter((c) => c.teacherId === teacherId).map((c) => c.id);
  }
  const rows = await queryRows(
    'SELECT id FROM classes WHERE teacher_id = $1',
    [teacherId]
  );
  return rows.map((r: any) => r.id);
}
