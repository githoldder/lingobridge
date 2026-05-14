import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
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
        filename: 'demo.pdf',
        mimeType: 'application/pdf',
        base64: Buffer.from('fake pdf').toString('base64')
      })
    });
    const pdfJson = await pdf.json();
    assert.equal(pdfJson.code, 0);
    assert.equal(pdfJson.data.pages.length, 3);

    const excel = await fetch(`${baseUrl}/api/v1/coursewares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify({
        courseId: 'course-1',
        filename: 'practice.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        base64: Buffer.from('fake excel').toString('base64')
      })
    });
    const excelJson = await excel.json();
    assert.equal(excelJson.code, 0);
    assert.equal(excelJson.data.exercises.length, 2);
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

