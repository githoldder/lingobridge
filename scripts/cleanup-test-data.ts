/**
 * S5-T01: Local test data cleanup script
 * Deletes all courses, classes, and related records (via CASCADE) except the demo seed.
 * 
 * Usage: npx tsx scripts/cleanup-test-data.ts [--write]
 */

import pg from 'pg';

const SEED_COURSE_ID = 'b0000000-0000-0000-0000-000000000001';
const SEED_CLASS_ID = 'd0000000-0000-0000-0000-000000000001';

async function main() {
  const dryRun = !process.argv.includes('--write');
  const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lingobridge';

  console.log(`[cleanup] Mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}`);
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
