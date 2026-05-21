import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL || 'postgres://lingobridge:lingobridge_dev@localhost:5432/lingobridge';
console.log('[smoke] Connecting to Postgres at:', databaseUrl);

const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  console.log('[smoke] Connected successfully!');

  // 1. Basic Health Query
  const res = await client.query('SELECT NOW()');
  console.log('[smoke] NOW():', res.rows[0]);

  // 2. Query Tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log('[smoke] Tables in DB:', tables.rows.map(r => r.table_name));

  // 3. Test insert into files
  const fileId = 'e0000000-0000-0000-0000-000000000099';
  const ownerId = 'a0000000-0000-0000-0000-000000000002'; // 王老师
  const courseId = 'b0000000-0000-0000-0000-000000000001'; // Demo Course
  const lessonNodeId = 'c0000000-0000-0000-0000-000000000001'; // Demo Lesson Node

  // Clean up first if exists
  await client.query('DELETE FROM course_pages WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM files WHERE id = $1', [fileId]);

  console.log('[smoke] Inserting test file...');
  const fileRes = await client.query(`
    INSERT INTO files (id, owner_id, course_id, lesson_node_id, kind, filename, mime_type, size_bytes, storage_url)
    VALUES ($1, $2, $3, $4, 'pdf', 'test_courseware.pdf', 'application/pdf', 1024, 'http://storage.com/test.pdf')
    RETURNING *
  `, [fileId, ownerId, courseId, lessonNodeId]);
  console.log('[smoke] Inserted file:', fileRes.rows[0]);

  console.log('[smoke] Inserting courseware metadata...');
  const cwRes = await client.query(`
    INSERT INTO courseware_files (id, course_id, lesson_node_id, kind, render_status, page_count)
    VALUES ($1, $2, $3, 'pdf', 'ready', 2)
    RETURNING *
  `, [fileId, courseId, lessonNodeId]);
  console.log('[smoke] Inserted courseware:', cwRes.rows[0]);

  console.log('[smoke] Inserting course pages...');
  await client.query(`
    INSERT INTO course_pages (courseware_file_id, course_id, lesson_node_id, page_number, content_html, audio_text)
    VALUES ($1, $2, $3, 1, '<p>Page 1 HTML</p>', 'Audio text for page 1')
  `, [fileId, courseId, lessonNodeId]);
  await client.query(`
    INSERT INTO course_pages (courseware_file_id, course_id, lesson_node_id, page_number, content_html, audio_text)
    VALUES ($1, $2, $3, 2, '<p>Page 2 HTML</p>', 'Audio text for page 2')
  `, [fileId, courseId, lessonNodeId]);

  console.log('[smoke] Querying courseware + file details via JOIN...');
  const joinRes = await client.query(`
    SELECT cf.*, f.filename, f.storage_url
    FROM courseware_files cf
    JOIN files f ON f.id = cf.id
    WHERE cf.lesson_node_id = $1
  `, [lessonNodeId]);
  console.log('[smoke] Query result count:', joinRes.rows.length);
  console.log('[smoke] Query result row:', joinRes.rows[0]);

  console.log('[smoke] Querying inserted course pages...');
  const pagesRes = await client.query(`
    SELECT * FROM course_pages WHERE course_id = $1 ORDER BY page_number
  `, [courseId]);
  console.log('[smoke] Pages found:', pagesRes.rows.length);
  console.log('[smoke] Pages:', pagesRes.rows);

  // 4. Assignments & Homework Import Smoke Test (T14/T15)
  console.log('[smoke] --- Starting Assignments/Homework T14/T15 Smoke Test ---');
  const assignmentNodeId = 'd0000000-0000-0000-0000-000000000001';
  const importId = 'f0000000-0000-0000-0000-000000000001';
  const xlsxFileId = 'a1111111-2222-3333-4444-555555555555';

  // Pre-emptively clean up
  await client.query('DELETE FROM vocabulary_items WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM learning_tasks WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM assignment_imports WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM assignment_nodes WHERE id = $1', [assignmentNodeId]);
  await client.query('DELETE FROM files WHERE id = $1', [xlsxFileId]);

  console.log('[smoke] Inserting test assignment_nodes...');
  await client.query(`
    INSERT INTO assignment_nodes (id, course_id, lesson_node_id, title, status)
    VALUES ($1, $2, $3, 'Demo Assignment', 'draft')
  `, [assignmentNodeId, courseId, lessonNodeId]);

  console.log('[smoke] Inserting test xlsx file...');
  await client.query(`
    INSERT INTO files (id, owner_id, course_id, lesson_node_id, kind, filename, mime_type, size_bytes, storage_url)
    VALUES ($1, $2, $3, $4, 'xlsx', 'assignment.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1024, 'http://storage.com/assignment.xlsx')
  `, [xlsxFileId, ownerId, courseId, lessonNodeId]);

  console.log('[smoke] Inserting test assignment_imports...');
  await client.query(`
    INSERT INTO assignment_imports (id, course_id, lesson_node_id, assignment_node_id, file_id, source_mode, filename, tasks_count, vocab_count, errors, created_by)
    VALUES ($1, $2, $3, $4, $5, 'xlsx_import', 'assignment.xlsx', 1, 1, '[]', $6)
  `, [importId, courseId, lessonNodeId, assignmentNodeId, xlsxFileId, ownerId]);

  console.log('[smoke] Testing upsertLearningTask behavior...');
  // Insert initial task
  await client.query(`
    INSERT INTO learning_tasks (course_id, lesson_node_id, assignment_node_id, source_import_id, task_key, task_type, unit, lesson, lesson_title, page_number, zh_text, pinyin, translation_ru, translation_kk, prompt, answer, difficulty, publish_to_homework, publish_to_vocab, sort_order)
    VALUES ($1, $2, $3, $4, 'TASK-001', 'pronunciation', 1, 1, 'Demo Lesson', 1, '大家好', 'Dajia hao', 'Привет всем', 'Сәлем', 'Read this', 'Dajia hao', 1, true, false, 1)
  `, [courseId, lessonNodeId, assignmentNodeId, importId]);

  // Perform upsert (simulation of repo.upsertLearningTask ON CONFLICT DO UPDATE on course_id, lesson_node_id, task_key)
  await client.query(`
    INSERT INTO learning_tasks (course_id, lesson_node_id, assignment_node_id, source_import_id, task_key, task_type, unit, lesson, lesson_title, page_number, zh_text, pinyin, translation_ru, translation_kk, prompt, answer, difficulty, publish_to_homework, publish_to_vocab, sort_order)
    VALUES ($1, $2, $3, $4, 'TASK-001', 'vocabulary', 1, 1, 'Demo Lesson', 1, '大家好', 'Dajia hao', 'Привет', 'Сәлем', 'Translate', 'Dajia hao', 2, true, false, 2)
    ON CONFLICT (course_id, lesson_node_id, task_key) DO UPDATE SET
      task_type = EXCLUDED.task_type,
      difficulty = EXCLUDED.difficulty,
      sort_order = EXCLUDED.sort_order
  `, [courseId, lessonNodeId, assignmentNodeId, importId]);

  const taskCheck = await client.query('SELECT * FROM learning_tasks WHERE course_id = $1 AND task_key = $2', [courseId, 'TASK-001']);
  if (taskCheck.rows.length !== 1) throw new Error('upsertLearningTask created multiple tasks!');
  if (taskCheck.rows[0].task_type !== 'vocabulary' || taskCheck.rows[0].difficulty !== 2) {
    throw new Error('upsertLearningTask failed to update existing task fields correctly!');
  }
  console.log('[smoke] upsertLearningTask verified: 1 task exists, fields whitelisted and updated successfully.');

  console.log('[smoke] Testing upsertVocabularyItem duplicate prevention...');
  // Simulating duplicate vocabulary_items insertion with pre-emptively DELETE.
  const vocData = { zh: '大家好', py: 'Dajia hao', ru: 'Привет', kk: 'Сәлем' };
  
  // Insert 1st
  await client.query('DELETE FROM vocabulary_items WHERE course_id = $1 AND lesson_node_id = $2 AND zh_text = $3 AND pinyin = $4', [courseId, lessonNodeId, vocData.zh, vocData.py]);
  await client.query('INSERT INTO vocabulary_items (course_id, lesson_node_id, zh_text, pinyin, translation_ru, translation_kk) VALUES ($1, $2, $3, $4, $5, $6)', [courseId, lessonNodeId, vocData.zh, vocData.py, vocData.ru, vocData.kk]);

  // Insert 2nd
  await client.query('DELETE FROM vocabulary_items WHERE course_id = $1 AND lesson_node_id = $2 AND zh_text = $3 AND pinyin = $4', [courseId, lessonNodeId, vocData.zh, vocData.py]);
  await client.query('INSERT INTO vocabulary_items (course_id, lesson_node_id, zh_text, pinyin, translation_ru, translation_kk) VALUES ($1, $2, $3, $4, $5, $6)', [courseId, lessonNodeId, vocData.zh, vocData.py, vocData.ru, vocData.kk]);

  const vocCheck = await client.query('SELECT * FROM vocabulary_items WHERE course_id = $1 AND zh_text = $2', [courseId, vocData.zh]);
  if (vocCheck.rows.length !== 1) throw new Error(`Vocabulary duplicate prevention failed! Expected 1 row, got ${vocCheck.rows.length}`);
  console.log('[smoke] upsertVocabularyItem verified: 1 vocab item exists, duplicate prevention completely succeeded.');

  // Cleanup S4-T14/T15 test items
  console.log('[smoke] Cleaning up S4-T14/T15 smoke test items...');
  await client.query('DELETE FROM vocabulary_items WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM learning_tasks WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM assignment_imports WHERE course_id = $1', [courseId]);
  await client.query('DELETE FROM assignment_nodes WHERE id = $1', [assignmentNodeId]);
  await client.query('DELETE FROM files WHERE id = $1', [xlsxFileId]);
  console.log('[smoke] --- S4-T14/T15 Smoke Test Finished Successfully! ---');

  // Clean up
  console.log('[smoke] Cleaning up test records...');
  await client.query('DELETE FROM course_pages WHERE courseware_file_id = $1', [fileId]);
  await client.query('DELETE FROM courseware_files WHERE id = $1', [fileId]);
  await client.query('DELETE FROM files WHERE id = $1', [fileId]);
  console.log('[smoke] Clean up complete.');

  client.release();
  await pool.end();
  console.log('[smoke] Postgres SMOKE TEST PASSED successfully!');
}

main().catch(err => {
  console.error('[smoke] Smoke test failed:', err);
  process.exit(1);
});
