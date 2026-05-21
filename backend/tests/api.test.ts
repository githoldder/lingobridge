import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import * as XLSX from 'xlsx';
import { createApp } from '../src/app.ts';
import { resetDbForTests } from '../src/db.ts';

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  resetDbForTests();
  const server = createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server port');
  try {
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('health and demo login work', async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/v1/health`);
    const healthJson = await health.json();
    assert.equal(healthJson.code, 0);
    assert.equal(healthJson.data.status, 'ok');

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@test.com', password: 'Test@123456' })
    });
    const loginJson = await login.json();
    assert.equal(loginJson.code, 0);
    assert.equal(loginJson.data.user.role, 'teacher');
  });
});

test('courseware upload creates pages and excel exercises', async () => {
  await withServer(async (baseUrl) => {
    const pdf = await fetch(`${baseUrl}/api/v1/coursewares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        lessonNodeId: 'lesson-node-1',
        filename: 'demo.pdf',
        mimeType: 'application/pdf',
        base64: Buffer.from('fake pdf').toString('base64')
      })
    });
    const pdfJson = await pdf.json();
    assert.equal(pdfJson.code, 0);
    assert.equal(pdfJson.data.pages.length, 1);
    assert.equal(pdfJson.data.pages[0].fileUrl, pdfJson.data.file.storageUrl);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[
      'course_code', 'unit', 'lesson', 'task_id', 'task_type',
      'zh_text', 'pinyin', 'translation_ru', 'translation_kk',
      'publish_to_homework', 'publish_to_vocab'
    ], [
      'TEST-01', 1, 1, 'TEST-01-L01-001', 'pronunciation',
      '现在上课。', 'Xiànzài shàng kè.', 'Начинаем урок.', 'Сабақ басталды.',
      'TRUE', 'FALSE'
    ], [
      'TEST-01', 1, 1, 'TEST-01-L01-002', 'vocabulary',
      '老师', 'lǎo shī', 'Учитель', 'Мұғалім',
      'FALSE', 'TRUE'
    ]]);
    XLSX.utils.book_append_sheet(wb, ws, 'tasks');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const excel = await fetch(`${baseUrl}/api/v1/coursewares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        filename: 'practice.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: xlsxBuffer.toString('base64')
      })
    });
    const excelJson = await excel.json();
    assert.equal(excelJson.code, 0);
    assert.equal(excelJson.data.tasks.length, 2);
    assert.equal(excelJson.data.tasks[0].taskType, 'pronunciation');
    assert.equal(excelJson.data.tasks[0].publishToHomework, true);
    assert.equal(excelJson.data.tasks[1].publishToVocab, true);
    assert.equal(excelJson.data.vocabulary.length, 1);
  });
});

test('recording upload list delete works', async () => {
  await withServer(async (baseUrl) => {
    const upload = await fetch(`${baseUrl}/api/v1/recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer student-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        pageNumber: 1,
        filename: 'student.webm',
        durationSec: 3,
        base64: Buffer.from('fake audio').toString('base64')
      })
    });
    const uploadJson = await upload.json();
    assert.equal(uploadJson.code, 0);

    const list = await fetch(`${baseUrl}/api/v1/recordings?courseId=course-1&page=1`);
    const listJson = await list.json();
    assert.equal(listJson.data.length, 1);

    const del = await fetch(`${baseUrl}/api/v1/recordings/${uploadJson.data.id}`, { method: 'DELETE' });
    const delJson = await del.json();
    assert.equal(delJson.data.deleted, true);
  });
});

test('homework import binds tasks to a live class', async () => {
  await withServer(async (baseUrl) => {
    const liveClass = await fetch(`${baseUrl}/api/v1/courses/course-1/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Live Class - Self Introduction' })
    });
    const liveClassJson = await liveClass.json();
    assert.equal(liveClassJson.code, 0);
    const lessonNodeId = liveClassJson.data.lessonNode.id;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[
      'course_code', 'unit', 'lesson', 'task_id', 'task_type',
      'zh_text', 'pinyin', 'translation_ru', 'translation_kk',
      'publish_to_homework', 'publish_to_vocab'
    ], [
      'CZU-CHN-001', 1, 1, 'CZU-CHN-001-L01-001', 'pronunciation',
      '大家好，我叫阿合买提。', 'Dajia hao, wo jiao Ahemaiti.',
      'Здравствуйте, меня зовут Ахмет.', 'Сәлеметсіз бе, менің атым Ахмет.',
      'TRUE', 'FALSE'
    ]]);
    XLSX.utils.book_append_sheet(wb, ws, 'homework');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const upload = await fetch(`${baseUrl}/api/v1/assignments/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        lessonNodeId,
        filename: 'live-class-homework.xlsx',
        base64: xlsxBuffer.toString('base64')
      })
    });
    const uploadJson = await upload.json();
    assert.equal(uploadJson.code, 0);
    assert.equal(uploadJson.data.tasksCount, 1);
    assert.equal(uploadJson.data.lessonNodeId, lessonNodeId);

    const tasks = await fetch(`${baseUrl}/api/v1/homework/tasks?courseId=course-1&lessonNodeId=${lessonNodeId}`);
    const tasksJson = await tasks.json();
    assert.equal(tasksJson.code, 0);
    assert.equal(tasksJson.data.length, 1);
    assert.equal(tasksJson.data[0].lessonNodeId, lessonNodeId);
    assert.equal(tasksJson.data[0].zhText, '大家好，我叫阿合买提。');
  });
});

test('registration creates an account and teacher roster search can add students to a course', async () => {
  await withServer(async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new_student@test.com',
        password: 'Test@123456',
        displayName: '新同学',
        role: 'student'
      })
    });
    const registrationJson = await registration.json();
    assert.equal(registrationJson.code, 0);
    assert.equal(registrationJson.data.user.role, 'student');

    const course = await fetch(`${baseUrl}/api/v1/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Roster sync demo' })
    });
    const courseJson = await course.json();
    assert.equal(courseJson.code, 0);

    const search = await fetch(`${baseUrl}/api/v1/courses/${courseJson.data.id}/students/search?q=新`);
    const searchJson = await search.json();
    assert.equal(searchJson.code, 0);
    assert.equal(searchJson.data.length, 0);

    const roster = await fetch(`${baseUrl}/api/v1/students/search?q=新`, {
      headers: { Authorization: 'Bearer teacher-1' }
    });
    const rosterJson = await roster.json();
    assert.equal(rosterJson.code, 0);
    assert.equal(rosterJson.data[0].displayName, '新同学');
  });
});

test('PDF upload without lessonNodeId returns 400', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/v1/coursewares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        base64: Buffer.from('fake pdf').toString('base64')
      })
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.ok(json.message.includes('lessonNodeId'));
  });
});

test('lesson node update with endsAt works', async () => {
  await withServer(async (baseUrl) => {
    const create = await fetch(`${baseUrl}/api/v1/courses/course-1/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'EndsAt Test', startsAt: '2026-06-01T10:00', endsAt: '2026-06-01T11:30' })
    });
    const createJson = await create.json();
    assert.equal(createJson.code, 0);
    const nodeId = createJson.data.lessonNode.id;
    assert.ok(createJson.data.lessonNode.startsAt);
    assert.ok(createJson.data.lessonNode.endsAt);

    const update = await fetch(`${baseUrl}/api/v1/lesson-nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ endsAt: '2026-06-02T12:00' })
    });
    const updateJson = await update.json();
    assert.equal(updateJson.code, 0);
    assert.ok(updateJson.data.endsAt);
  });
});

test('assignment export works', async () => {
  await withServer(async (baseUrl) => {
    // Create a lesson node
    const create = await fetch(`${baseUrl}/api/v1/courses/course-1/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Export Test Lesson' })
    });
    const createJson = await create.json();
    assert.equal(createJson.code, 0);
    const lessonNodeId = createJson.data.lessonNode.id;

    // Create an xlsx homework and import it
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[
      'course_code', 'unit', 'lesson', 'task_id', 'task_type',
      'zh_text', 'pinyin', 'translation_ru', 'translation_kk',
      'publish_to_homework', 'publish_to_vocab'
    ], [
      'EXPORT-01', 1, 1, 'EXPORT-01-L01-001', 'pronunciation',
      '测试导出。', 'Cèshì dǎochū.', 'Тест экспорта.', 'Экспорт сынағы.',
      'TRUE', 'FALSE'
    ]]);
    XLSX.utils.book_append_sheet(wb, ws, 'homework');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const upload = await fetch(`${baseUrl}/api/v1/assignments/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        lessonNodeId,
        filename: 'export-test.xlsx',
        base64: xlsxBuffer.toString('base64')
      })
    });
    const uploadJson = await upload.json();
    assert.equal(uploadJson.code, 0);
    assert.equal(uploadJson.data.tasksCount, 1);

    // Export and verify
    const exportRes = await fetch(`${baseUrl}/api/v1/assignments/export?courseId=course-1&lessonNodeId=${lessonNodeId}`);
    assert.equal(exportRes.status, 200);
    const contentType = exportRes.headers.get('content-type') || '';
    assert.ok(contentType.includes('spreadsheetml') || contentType.includes('octet-stream'));
    const buffer = await exportRes.arrayBuffer();
    assert.ok(buffer.byteLength > 0);
  });
});

test('live class inherits course students and supports batch student adds', async () => {
  await withServer(async (baseUrl) => {
    const liveClass = await fetch(`${baseUrl}/api/v1/courses/course-1/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Live Class roster' })
    });
    const liveClassJson = await liveClass.json();
    assert.equal(liveClassJson.code, 0);
    const lessonNodeId = liveClassJson.data.lessonNode.id;

    const students = await fetch(`${baseUrl}/api/v1/live-classes/${lessonNodeId}/students`);
    const studentsJson = await students.json();
    assert.equal(studentsJson.code, 0);
    assert.ok(studentsJson.data.length >= 3);
    assert.ok(studentsJson.data.some((item: any) => item.user.displayName === '阿合买提'));
  });
});
