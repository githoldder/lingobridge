/**
 * S5-T01: Local test data cleanup script
 * Deletes all courses, classes, and related records (via CASCADE) except the demo seed.
 * 
 * Usage: npx tsx scripts/cleanup-test-data.ts [--write]
 */

import pg from 'pg';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SEED_COURSE_ID = 'b0000000-0000-0000-0000-000000000001';
const SEED_CLASS_ID = 'd0000000-0000-0000-0000-000000000001';
const JSON_SEED_COURSE_ID = 'course-1';
const JSON_SEED_CLASS_ID = 'class-1';

async function cleanupJson(dryRun: boolean) {
  if (process.argv.includes('--reset-seed')) {
    const { resetDbForTests, writeDb } = await import('../backend/src/db.ts');
    const seed = resetDbForTests();
    const dbPath = path.resolve(process.cwd(), 'backend/data/db.json');
    const existing = JSON.parse(await readFile(dbPath, 'utf8'));
    console.log(`[cleanup] JSON reset will replace ${existing.courses?.length || 0} courses with ${seed.courses.length} seed course.`);
    if (!dryRun) {
      await writeDb(seed);
      console.log('[cleanup] ✅ JSON seed reset applied successfully.');
    }
    return;
  }

  const dbPath = path.resolve(process.cwd(), 'backend/data/db.json');
  const db = JSON.parse(await readFile(dbPath, 'utf8'));
  const keepCourseIds = new Set([JSON_SEED_COURSE_ID]);
  const keepClassIds = new Set([JSON_SEED_CLASS_ID]);
  const keepLessonIds = new Set((db.lessonNodes || []).filter((n: any) => keepCourseIds.has(n.courseId)).map((n: any) => n.id));
  const keepAssignmentIds = new Set((db.assignmentNodes || []).filter((n: any) => keepCourseIds.has(n.courseId) || keepLessonIds.has(n.lessonNodeId)).map((n: any) => n.id));
  const keepFileIds = new Set((db.files || []).filter((f: any) => keepCourseIds.has(f.courseId)).map((f: any) => f.id));

  const coursesToDelete = (db.courses || []).filter((c: any) => !keepCourseIds.has(c.id)).length;
  const classesToDelete = (db.classes || []).filter((c: any) => !keepClassIds.has(c.id)).length;
  console.log(`[cleanup] JSON found ${coursesToDelete} test courses to delete.`);
  console.log(`[cleanup] JSON found ${classesToDelete} test classes to delete.`);

  if (dryRun) return;

  db.courses = (db.courses || []).filter((c: any) => keepCourseIds.has(c.id));
  if (Array.isArray(db.classes)) db.classes = db.classes.filter((c: any) => keepClassIds.has(c.id));
  if (Array.isArray(db.classMembers)) db.classMembers = db.classMembers.filter((m: any) => keepClassIds.has(m.classId));
  db.courseMembers = (db.courseMembers || []).filter((m: any) => keepCourseIds.has(m.courseId));
  db.lessonNodes = (db.lessonNodes || []).filter((n: any) => keepCourseIds.has(n.courseId));
  db.assignmentNodes = (db.assignmentNodes || []).filter((n: any) => keepCourseIds.has(n.courseId) || keepLessonIds.has(n.lessonNodeId));
  db.coursePages = (db.coursePages || []).filter((p: any) => keepCourseIds.has(p.courseId));
  db.exercises = (db.exercises || []).filter((e: any) => keepCourseIds.has(e.courseId));
  db.learningTasks = (db.learningTasks || []).filter((t: any) => keepCourseIds.has(t.courseId) || keepLessonIds.has(t.lessonNodeId));
  db.vocabularyItems = (db.vocabularyItems || []).filter((v: any) => keepCourseIds.has(v.courseId) || keepLessonIds.has(v.lessonNodeId));
  db.learningRecords = (db.learningRecords || []).filter((r: any) => keepLessonIds.has(r.lessonNodeId) || keepAssignmentIds.has(r.assignmentNodeId));
  db.recordings = (db.recordings || []).filter((r: any) => keepCourseIds.has(r.courseId));
  db.lectures = (db.lectures || []).filter((l: any) => keepCourseIds.has(l.courseId));
  db.liveSessions = (db.liveSessions || []).filter((s: any) => keepCourseIds.has(s.courseId) || keepLessonIds.has(s.lessonNodeId));
  db.classroomComments = (db.classroomComments || []).filter((c: any) => (db.liveSessions || []).some((s: any) => s.id === c.liveSessionId));
  db.files = (db.files || []).filter((f: any) => keepCourseIds.has(f.courseId) || keepFileIds.has(f.id));
  db.coursewareFiles = (db.coursewareFiles || []).filter((f: any) => keepCourseIds.has(f.courseId) || keepLessonIds.has(f.lessonNodeId));
  db.liveClassStudents = (db.liveClassStudents || []).filter((s: any) => keepLessonIds.has(s.lessonNodeId));
  db.homeworkImports = (db.homeworkImports || []).filter((h: any) => keepCourseIds.has(h.courseId) || keepLessonIds.has(h.lessonNodeId));

  await writeFile(dbPath, JSON.stringify(db, null, 2) + '\n');
  console.log('[cleanup] ✅ JSON cleanup applied successfully.');
}

async function main() {
  const dryRun = !process.argv.includes('--write');
  const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lingobridge';

  console.log(`[cleanup] Mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}`);
  if (process.env.DB_MODE === 'json' || process.argv.includes('--json')) {
    await cleanupJson(dryRun);
    return;
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();
    
    // Count records before cleanup
    const courseCountRes = await client.query('SELECT COUNT(*) FROM courses WHERE id != $1', [SEED_COURSE_ID]);
    const classCountRes = await client.query('SELECT COUNT(*) FROM classes WHERE id != $1', [SEED_CLASS_ID]);
    
    const coursesToDelete = parseInt(courseCountRes.rows[0].count, 10);
    const classesToDelete = parseInt(classCountRes.rows[0].count, 10);
    
    console.log(`[cleanup] Found ${coursesToDelete} test courses to delete.`);
    console.log(`[cleanup] Found ${classesToDelete} test classes to delete.`);

    if (!dryRun) {
      await client.query('BEGIN');
      
      // Delete courses
      if (coursesToDelete > 0) {
        const delCourses = await client.query('DELETE FROM courses WHERE id != $1 RETURNING id', [SEED_COURSE_ID]);
        console.log(`[cleanup] Deleted ${delCourses.rowCount} courses and their cascade children (lessons, tasks, records, etc.)`);
      }

      // Delete classes
      if (classesToDelete > 0) {
        const delClasses = await client.query('DELETE FROM classes WHERE id != $1 RETURNING id', [SEED_CLASS_ID]);
        console.log(`[cleanup] Deleted ${delClasses.rowCount} classes and their members`);
      }

      // Also clean up any orphan files
      const delOrphanFiles = await client.query(`
        DELETE FROM files 
        WHERE course_id IS NULL 
        AND id NOT IN (SELECT default_courseware_file_id FROM courses WHERE default_courseware_file_id IS NOT NULL)
      `);
      console.log(`[cleanup] Deleted ${delOrphanFiles.rowCount} orphan files.`);

      await client.query('COMMIT');
      console.log('[cleanup] ✅ Cleanup applied successfully.');
    } else {
      console.log('[cleanup] Run with --write to actually delete these records.');
    }
    
    client.release();
  } catch (err: any) {
    console.error(`[cleanup] ❌ Cleanup failed: ${err.message}`);
  } finally {
    await pool.end();
  }
}

main();
