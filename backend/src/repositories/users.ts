/**
 * S4-T04: Users repository — JSON + Postgres dual mode
 */

import { readDb, writeDb } from '../db.ts';
import { getDbMode, query, queryRow, queryRows } from '../db/postgres.ts';
import type { UserDto, TeacherStudentLinkDto } from './types.ts';

/** Map a postgres snake_case row to camelCase UserDto */
function mapRow(row: Record<string, any>): UserDto {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    languagePref: row.language_pref,
    email: row.email ?? row.username,
  };
}

export async function findById(id: string): Promise<UserDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    return { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, email: user.email || user.username };
  }
  const row = await queryRow('SELECT id, username, role, display_name, language_pref, email FROM users WHERE id = $1', [id]);
  return row ? mapRow(row) : null;
}

export async function findByUsername(username: string): Promise<UserDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const user = db.users.find((u) => u.username === username);
    if (!user) return null;
    return { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, email: user.email || user.username };
  }
  const row = await queryRow('SELECT id, username, role, display_name, language_pref, email FROM users WHERE username = $1', [username]);
  return row ? mapRow(row) : null;
}

export async function search(queryStr: string): Promise<UserDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const q = queryStr.toLowerCase();
    return db.users
      .filter((u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
      .map((u) => ({ id: u.id, username: u.username, role: u.role, displayName: u.displayName, languagePref: u.languagePref, email: u.email || u.username }));
  }
  const rows = await queryRows(
    "SELECT id, username, role, display_name, language_pref, email FROM users WHERE username ILIKE $1 OR display_name ILIKE $1",
    [`%${queryStr}%`]
  );
  return rows.map(mapRow);
}

export async function create(data: {
  username: string;
  password: string;
  role: string;
  displayName: string;
  languagePref: string;
  email?: string;
}): Promise<UserDto> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const user = {
      id: crypto.randomUUID(),
      username: data.username,
      password: data.password,
      role: data.role as any,
      displayName: data.displayName,
      languagePref: data.languagePref as any,
      email: data.email ?? data.username,
    };
    db.users.push(user);
    await writeDb(db);
    return { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, email: user.email };
  }
  // Postgres mode: store password_hash (for now, simple SHA256)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Plaintext password storage is disabled in production. Migrate to bcrypt before deploying.');
  }
  const passwordHash = data.password; // TODO: migrate to bcrypt in later sprint
  const row = await queryRow(
    `INSERT INTO users (username, email, password_hash, role, display_name, language_pref)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, role, display_name, language_pref, email`,
    [data.username, data.email ?? data.username, passwordHash, data.role, data.displayName, data.languagePref]
  );
  return mapRow(row!);
}

export async function verifyPassword(username: string, password: string): Promise<UserDto | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const user = db.users.find((u) => u.username === username && u.password === password);
    if (!user) return null;
    return { id: user.id, username: user.username, role: user.role, displayName: user.displayName, languagePref: user.languagePref, email: user.email || user.username };
  }
  // Postgres: compare password against password_hash
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Plaintext password verification is disabled in production. Migrate to bcrypt before deploying.');
  }
  const row = await queryRow(
    'SELECT id, username, role, display_name, language_pref, email, password_hash FROM users WHERE username = $1',
    [username]
  );
  if (!row) return null;
  // TODO: bcrypt compare — for now plain text comparison
  if (row.password_hash !== password) return null;
  return mapRow(row);
}

// ─── Teacher-Student Links (S4-T08) ───

export async function findStudentIdsByTeacherId(teacherId: string): Promise<string[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    return db.teacherStudentLinks
      .filter((link) => link.teacherId === teacherId && link.status === 'active')
      .map((link) => link.studentId);
  }
  const rows = await queryRows(
    'SELECT student_id FROM teacher_student_links WHERE teacher_id = $1 AND status = $2',
    [teacherId, 'active']
  );
  return rows.map((r) => r.student_id);
}

export async function addTeacherStudentLink(teacherId: string, studentId: string, className = '文科院中文测试班'): Promise<void> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const exists = db.teacherStudentLinks.find((l) => l.teacherId === teacherId && l.studentId === studentId);
    if (exists) return;
    db.teacherStudentLinks.push({
      id: crypto.randomUUID(),
      teacherId,
      studentId,
      className,
      status: 'active',
      createdAt: new Date().toISOString()
    });
    await writeDb(db);
    return;
  }
  await query(
    `INSERT INTO teacher_student_links (teacher_id, student_id, class_name, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (teacher_id, student_id) DO NOTHING`,
    [teacherId, studentId, className]
  );
}

export async function findDefaultTeacherId(): Promise<string | null> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const teacher = db.users.find((u) => u.role === 'teacher');
    return teacher?.id ?? null;
  }
  const row = await queryRow("SELECT id FROM users WHERE role = 'teacher' ORDER BY created_at LIMIT 1");
  return row?.id ?? null;
}

export async function searchExtended(queryStr: string): Promise<UserDto[]> {
  if (getDbMode() === 'json') {
    const db = await readDb();
    const q = queryStr.toLowerCase();
    return db.users
      .filter((u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      )
      .map((u) => ({ id: u.id, username: u.username, role: u.role, displayName: u.displayName, languagePref: u.languagePref, email: u.email || u.username }));
  }
  const rows = await queryRows(
    `SELECT u.id, u.username, u.role, u.display_name, u.language_pref, u.email
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.username ILIKE $1
        OR u.display_name ILIKE $1
        OR u.email ILIKE $1
        OR sp.student_no ILIKE $1`,
    [`%${queryStr}%`]
  );
  return rows.map(mapRow);
}

