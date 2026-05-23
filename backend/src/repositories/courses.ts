/**
 * S4-T04: Courses repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, query, queryRow, queryRows, transaction } from '../db/postgres.ts';
import type { AssignmentNodeDto, CourseDto, CourseMemberDto, LessonNodeDto } from './types.ts';

function mapCourse(row: Record<string, any>): CourseDto {
  return {
    id: row.id,
    teacherId: row.teacher_id ?? row.teacherId,
    classId: row.class_id ?? row.classId ?? undefined,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url ?? row.coverImageUrl ?? undefined,
    status: row.status,
    startsAt: row.starts_at ?? row.startsAt,
    endsAt: row.ends_at ?? row.endsAt,
    defaultCoursewareFileId: row.default_courseware_file_id ?? row.defaultCoursewareFileId ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapMember(row: Record<string, any>): CourseMemberDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    userId: row.user_id ?? row.userId,
    role: row.role,
    joinedAt: row.joined_at ?? row.joinedAt,
  };
}

function mapLessonNode(row: Record<string, any>): LessonNodeDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    title: row.title,
    startsAt: row.starts_at ?? row.startsAt,
    endsAt: row.ends_at ?? row.endsAt,
    styleSeed: row.style_seed ?? row.styleSeed ?? 0,
    colorToken: row.color_token ?? row.colorToken ?? 'blue',
    shapeToken: row.shape_token ?? row.shapeToken ?? 'circle',
    status: row.status,
    defaultCoursewareFileId: row.default_courseware_file_id ?? row.defaultCoursewareFileId ?? undefined,
    assignmentNodeId: row.assignment_node_id ?? row.assignmentNodeId,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapAssignmentNode(row: Record<string, any>): AssignmentNodeDto {
  return {
    id: row.id,
    courseId: row.course_id ?? row.courseId,
    lessonNodeId: row.lesson_node_id ?? row.lessonNodeId,
    title: row.title,
    dueAt: row.due_at ?? row.dueAt ?? undefined,
    status: row.status,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
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

// ─── Course CRUD ───

export async function findById(id: string): Promise<CourseDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const c = db.courses.find((c) => c.id === id);
    return c ? mapCourse(c) : null;
  }
  const row = await queryRow('SELECT * FROM courses WHERE id = $1', [id]);
  return row ? mapCourse(row) : null;
}

export async function findByTeacherId(teacherId: string): Promise<CourseDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    // Teacher's own courses + courses in classes they own
    const classIds = (db.classes || []).filter((c) => c.teacherId === teacherId).map((c) => c.id);
    return db.courses
      .filter((c) => c.teacherId === teacherId || classIds.includes(c.classId ?? ''))
      .map(mapCourse);
  }
  const rows = await queryRows(
    `SELECT DISTINCT c.* FROM courses c
     LEFT JOIN classes cl ON cl.id = c.class_id
     WHERE c.teacher_id = $1 OR cl.teacher_id = $1
     ORDER BY c.created_at DESC`,
    [teacherId]
  );
  return rows.map(mapCourse);
}

export async function findByStudentId(studentId: string): Promise<CourseDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const memberOf = db.courseMembers.filter((m) => m.userId === studentId).map((m) => m.courseId);
    // Also include courses from class membership
    const classIds = (db.classMembers || []).filter((m) => m.studentId === studentId).map((m) => m.classId);
    const classCourseIds = db.courses.filter((c) => classIds.includes(c.classId ?? '')).map((c) => c.id);
    const allIds = new Set([...memberOf, ...classCourseIds]);
    return db.courses.filter((c) => allIds.has(c.id)).map(mapCourse);
  }
  const rows = await queryRows(
    `SELECT DISTINCT c.* FROM courses c
     LEFT JOIN course_members cm ON cm.course_id = c.id AND cm.user_id = $1 AND cm.removed_at IS NULL
     LEFT JOIN class_members clm ON clm.student_id = $1 AND clm.removed_at IS NULL
     LEFT JOIN classes cl ON cl.id = c.class_id AND cl.id = clm.class_id
     WHERE cm.id IS NOT NULL OR cl.id IS NOT NULL
     ORDER BY c.created_at DESC`,
    [studentId]
  );
  return rows.map(mapCourse);
}

export async function findAll(): Promise<CourseDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.courses.map(mapCourse);
  }
  const rows = await queryRows('SELECT * FROM courses ORDER BY created_at DESC');
  return rows.map(mapCourse);
}


export async function create(data: { teacherId: string; title: string; description?: string; status?: string; classId?: string; defaultCoursewareFileId?: string }): Promise<CourseDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const now = new Date().toISOString();
    const course: any = {
      id: crypto.randomUUID(),
      teacherId: data.teacherId,
      classId: data.classId ?? null,
      title: data.title,
      description: data.description ?? '',
      coverImageUrl: (data as any).coverImageUrl ?? null,
      createdAt: now,
      updatedAt: now,
      status: data.status ?? 'published',
      defaultCoursewareFileId: data.defaultCoursewareFileId ?? null,
    };
    db.courses.push(course);
    await writeDb(db);
    return mapCourse(course);
  }
  const row = await queryRow(
    `INSERT INTO courses (teacher_id, class_id, title, description, status, default_courseware_file_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.teacherId, data.classId ?? null, data.title, data.description ?? '', data.status ?? 'published', data.defaultCoursewareFileId ?? null]
  );
  return mapCourse(row!);
}

async function ensureCourseCoverColumn() {
  if (getDbMode() !== 'json') {
    await query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url text');
  }
}

export async function update(id: string, data: Partial<{ title: string; description: string; coverImageUrl: string; status: string; startsAt: string; endsAt: string; classId: string | null; defaultCoursewareFileId: string | null }>): Promise<CourseDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.courses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    Object.assign(db.courses[idx], data, { updatedAt: new Date().toISOString() });
    await writeDb(db);
    return mapCourse(db.courses[idx]);
  }
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (data.title !== undefined) { sets.push(`title = $${i++}`); vals.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${i++}`); vals.push(data.description); }
  if (data.coverImageUrl !== undefined) {
    await ensureCourseCoverColumn();
    sets.push(`cover_image_url = $${i++}`);
    vals.push(data.coverImageUrl || null);
  }
  if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
  if (data.startsAt !== undefined) { sets.push(`starts_at = $${i++}`); vals.push(data.startsAt); }
  if (data.endsAt !== undefined) { sets.push(`ends_at = $${i++}`); vals.push(data.endsAt); }
  if (data.classId !== undefined) { sets.push(`class_id = $${i++}`); vals.push(data.classId ?? null); }
  if (data.defaultCoursewareFileId !== undefined) { sets.push(`default_courseware_file_id = $${i++}`); vals.push(data.defaultCoursewareFileId ?? null); }
  sets.push(`updated_at = now()`);
  vals.push(id);
  const row = await queryRow(`UPDATE courses SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
  return row ? mapCourse(row) : null;
}

// ─── Course Members ───

export async function findMembers(courseId: string): Promise<CourseMemberDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.courseMembers.filter((m) => m.courseId === courseId).map(mapMember);
  }
  const rows = await queryRows(
    'SELECT * FROM course_members WHERE course_id = $1 AND removed_at IS NULL',
    [courseId]
  );
  return rows.map(mapMember);
}

export async function addMember(courseId: string, userId: string, role: string): Promise<CourseMemberDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const existing = db.courseMembers.find((m) => m.courseId === courseId && m.userId === userId);
    if (existing) return mapMember(existing);
    const member = { id: crypto.randomUUID(), courseId, userId, role, joinedAt: new Date().toISOString() };
    db.courseMembers.push(member as any);
    await writeDb(db);
    return mapMember(member);
  }
  const row = await queryRow(
    `INSERT INTO course_members (course_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (course_id, user_id) DO UPDATE SET removed_at = NULL, role = EXCLUDED.role
     RETURNING *`,
    [courseId, userId, role]
  );
  return mapMember(row!);
}

export async function removeMember(courseId: string, userId: string): Promise<boolean> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.courseMembers.findIndex((m) => m.courseId === courseId && m.userId === userId);
    if (idx === -1) return false;
    db.courseMembers.splice(idx, 1);
    await writeDb(db);
    return true;
  }
  const result = await query(
    `UPDATE course_members SET removed_at = now() WHERE course_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [courseId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteById(id: string): Promise<boolean> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const idx = db.courses.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    db.courses.splice(idx, 1);
    db.courseMembers = db.courseMembers.filter((m) => m.courseId !== id);
    db.lessonNodes = db.lessonNodes.filter((n) => n.courseId !== id);
    db.assignmentNodes = db.assignmentNodes.filter((n) => n.courseId !== id);
    db.coursePages = db.coursePages.filter((p) => p.courseId !== id);
    db.exercises = db.exercises.filter((e) => e.courseId !== id);
    db.learningTasks = db.learningTasks.filter((t) => t.courseId !== id);
    db.vocabularyItems = db.vocabularyItems.filter((v) => v.courseId !== id);
    db.recordings = db.recordings.filter((r) => r.courseId !== id);
    db.lectures = db.lectures.filter((l) => l.courseId !== id);
    db.liveSessions = db.liveSessions.filter((s) => s.courseId !== id);
    db.files = db.files.filter((f) => f.courseId !== id);
    db.coursewareFiles = db.coursewareFiles.filter((f) => f.courseId !== id);
    db.homeworkImports = db.homeworkImports.filter((h) => h.courseId !== id);
    await writeDb(db);
    return true;
  }
  const result = await query('DELETE FROM courses WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Lesson Nodes ───

export async function findLessonNodes(courseId: string): Promise<LessonNodeDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const nodes = db.lessonNodes.filter((n) => n.courseId === courseId);
    return nodes.map((n) => {
      const assignmentNode = db.assignmentNodes.find((a) => a.lessonNodeId === n.id);
      return mapLessonNode({ ...n, assignmentNodeId: assignmentNode?.id });
    });
  }
  const rows = await queryRows(
    `SELECT ln.*, an.id AS assignment_node_id
     FROM lesson_nodes ln
     LEFT JOIN assignment_nodes an ON an.lesson_node_id = ln.id
     WHERE ln.course_id = $1
     ORDER BY ln.starts_at NULLS LAST, ln.created_at`,
    [courseId]
  );
  return rows.map(mapLessonNode);
}

export async function findLessonNodeById(id: string): Promise<LessonNodeDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const node = db.lessonNodes.find((n) => n.id === id);
    if (!node) return null;
    const assignmentNode = db.assignmentNodes.find((a) => a.lessonNodeId === node.id);
    return mapLessonNode({ ...node, assignmentNodeId: assignmentNode?.id });
  }
  const row = await queryRow(
    `SELECT ln.*, an.id AS assignment_node_id
     FROM lesson_nodes ln
     LEFT JOIN assignment_nodes an ON an.lesson_node_id = ln.id
     WHERE ln.id = $1`,
    [id]
  );
  return row ? mapLessonNode(row) : null;
}

export async function createLessonNode(data: {
  courseId: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  assignmentTitle?: string;
  dueAt?: string;
}): Promise<{ lessonNode: LessonNodeDto; assignmentNode: AssignmentNodeDto }> {
  const now = new Date().toISOString();
  const styleSeed = Math.floor(Math.random() * 1000000);
  const { colorToken, shapeToken } = deriveStyleTokens(styleSeed);

  if (getDbMode() === 'json') {
    const db = await readDb();
    const lessonNode: any = {
      id: crypto.randomUUID(),
      courseId: data.courseId,
      title: data.title,
      startsAt: data.startsAt || undefined,
      endsAt: data.endsAt || undefined,
      styleSeed,
      colorToken,
      shapeToken,
      status: data.status ?? 'draft',
      createdAt: now,
      updatedAt: now
    };
    const assignmentNode: any = {
      id: crypto.randomUUID(),
      courseId: data.courseId,
      lessonNodeId: lessonNode.id,
      title: data.assignmentTitle || `${lessonNode.title} - Homework`,
      dueAt: data.dueAt || undefined,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
    lessonNode.assignmentNodeId = assignmentNode.id;
    db.lessonNodes.unshift(lessonNode);
    db.assignmentNodes.unshift(assignmentNode);
    await writeDb(db);
    return {
      lessonNode: mapLessonNode(lessonNode),
      assignmentNode: mapAssignmentNode(assignmentNode)
    };
  }

  return transaction(async (client) => {
    const lessonResult = await client.query(
      `INSERT INTO lesson_nodes (course_id, title, starts_at, ends_at, style_seed, color_token, shape_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.courseId,
        data.title,
        data.startsAt || null,
        data.endsAt || null,
        styleSeed,
        colorToken,
        shapeToken,
        data.status ?? 'draft'
      ]
    );
    const lessonNode = mapLessonNode(lessonResult.rows[0]);
    const assignmentResult = await client.query(
      `INSERT INTO assignment_nodes (course_id, lesson_node_id, title, due_at, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.courseId,
        lessonNode.id,
        data.assignmentTitle || `${lessonNode.title} - Homework`,
        data.dueAt || null,
        'draft'
      ]
    );
    const assignmentNode = mapAssignmentNode(assignmentResult.rows[0]);
    return {
      lessonNode: { ...lessonNode, assignmentNodeId: assignmentNode.id },
      assignmentNode
    };
  });
}

export async function updateLessonNode(id: string, data: Partial<{
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  defaultCoursewareFileId: string | null;
}>): Promise<LessonNodeDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const node = db.lessonNodes.find((n) => n.id === id);
    if (!node) return null;
    if (data.title !== undefined) node.title = data.title;
    if (data.startsAt !== undefined) node.startsAt = data.startsAt || undefined;
    if (data.endsAt !== undefined) node.endsAt = data.endsAt || undefined;
    if (data.status !== undefined) node.status = data.status as any;
    if (data.defaultCoursewareFileId !== undefined) (node as any).defaultCoursewareFileId = data.defaultCoursewareFileId || undefined;
    node.updatedAt = new Date().toISOString();
    await writeDb(db);
    const assignmentNode = db.assignmentNodes.find((a) => a.lessonNodeId === node.id);
    return mapLessonNode({ ...node, assignmentNodeId: assignmentNode?.id });
  }

  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (data.title !== undefined) { sets.push(`title = $${i++}`); vals.push(data.title); }
  if (data.startsAt !== undefined) { sets.push(`starts_at = $${i++}`); vals.push(data.startsAt || null); }
  if (data.endsAt !== undefined) { sets.push(`ends_at = $${i++}`); vals.push(data.endsAt || null); }
  if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
  if (data.defaultCoursewareFileId !== undefined) { sets.push(`default_courseware_file_id = $${i++}`); vals.push(data.defaultCoursewareFileId || null); }
  if (sets.length === 0) return findLessonNodeById(id);
  sets.push(`updated_at = now()`);
  vals.push(id);
  const row = await queryRow(
    `UPDATE lesson_nodes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  if (!row) return null;
  const assignmentNode = await queryRow('SELECT id FROM assignment_nodes WHERE lesson_node_id = $1', [id]);
  return mapLessonNode({ ...row, assignment_node_id: assignmentNode?.id });
}
