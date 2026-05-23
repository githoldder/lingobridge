import { queryRow, queryRows, query, getDbMode } from '../db/postgres.ts';
import { readDb, writeDb } from '../db.ts';
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

export async function findByTeacherId(teacherId: string): Promise<ClassDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return (db as any).classes?.filter((c: any) => c.teacherId === teacherId).map(mapClass) || [];
  }
  const rows = await queryRows('SELECT * FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC', [teacherId]);
  return rows.map(mapClass);
}

export async function findById(id: string): Promise<ClassDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const c = (db as any).classes?.find((c: any) => c.id === id);
    return c ? mapClass(c) : null;
  }
  const row = await queryRow('SELECT * FROM classes WHERE id = $1', [id]);
  return row ? mapClass(row) : null;
}

export async function create(data: { teacherId: string; name: string; description?: string }): Promise<ClassDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    if (!(db as any).classes) (db as any).classes = [];
    const cls = {
      id: crypto.randomUUID(),
      teacherId: data.teacherId,
      name: data.name,
      description: data.description ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    (db as any).classes.push(cls);
    await writeDb(db);
    return mapClass(cls);
  }
  const row = await queryRow(
    `INSERT INTO classes (teacher_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [data.teacherId, data.name, data.description ?? '']
  );
  return mapClass(row!);
}

export async function update(id: string, data: Partial<{ name: string; description: string }>): Promise<ClassDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = ((db as any).classes || []).findIndex((c: any) => c.id === id);
    if (idx === -1) return null;
    Object.assign((db as any).classes[idx], data, { updatedAt: new Date().toISOString() });
    await writeDb(db);
    return mapClass((db as any).classes[idx]);
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
    const before = ((db as any).classes || []).length;
    (db as any).classes = ((db as any).classes || []).filter((c: any) => c.id !== id);
    await writeDb(db);
    return before !== ((db as any).classes || []).length;
  }
  const result = await query(`DELETE FROM classes WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function findMembers(classId: string): Promise<ClassMemberDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return ((db as any).classMembers || []).filter((m: any) => m.classId === classId).map(mapClassMember);
  }
  const rows = await queryRows(
    'SELECT * FROM class_members WHERE class_id = $1 AND removed_at IS NULL',
    [classId]
  );
  return rows.map(mapClassMember);
}

export async function addMember(classId: string, studentId: string): Promise<ClassMemberDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    if (!(db as any).classMembers) (db as any).classMembers = [];
    const existing = (db as any).classMembers.find((m: any) => m.classId === classId && m.studentId === studentId);
    if (existing) return mapClassMember(existing);
    const member = { id: crypto.randomUUID(), classId, studentId, joinedAt: new Date().toISOString() };
    (db as any).classMembers.push(member);
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
    const idx = ((db as any).classMembers || []).findIndex((m: any) => m.classId === classId && m.studentId === studentId);
    if (idx === -1) return false;
    (db as any).classMembers.splice(idx, 1);
    await writeDb(db);
    return true;
  }
  const result = await query(
    `UPDATE class_members SET removed_at = now() WHERE class_id = $1 AND student_id = $2 AND removed_at IS NULL`,
    [classId, studentId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function findClassesByStudentId(studentId: string): Promise<ClassDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const classIds = ((db as any).classMembers || []).filter((m: any) => m.studentId === studentId).map((m: any) => m.classId);
    return ((db as any).classes || []).filter((c: any) => classIds.includes(c.id)).map(mapClass);
  }
  const rows = await queryRows(
    `SELECT c.* FROM classes c
     JOIN class_members cm ON cm.class_id = c.id
     WHERE cm.student_id = $1 AND cm.removed_at IS NULL
     ORDER BY c.created_at DESC`,
    [studentId]
  );
  return rows.map(mapClass);
}

export async function findAll(): Promise<ClassDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return ((db as any).classes || []).map(mapClass);
  }
  const rows = await queryRows('SELECT * FROM classes ORDER BY created_at DESC');
  return rows.map(mapClass);
}

export async function findClassIdsByStudentId(studentId: string): Promise<string[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return ((db as any).classMembers || [])
      .filter((m: any) => m.studentId === studentId)
      .map((m: any) => m.classId);
  }
  const rows = await queryRows(
    `SELECT class_id FROM class_members WHERE student_id = $1 AND removed_at IS NULL`,
    [studentId]
  );
  return rows.map((r) => r.class_id);
}

export async function findClassIdsByTeacherId(teacherId: string): Promise<string[]> {
  const list = await findByTeacherId(teacherId);
  return list.map((c) => c.id);
}

export { create as createClass, update as updateClass };

