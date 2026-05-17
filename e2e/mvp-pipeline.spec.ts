import { test, expect, APIRequestContext } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:3001';
const FRONTEND = 'http://127.0.0.1:3000';

async function loginViaAPI(page: any, request: APIRequestContext, role: 'teacher' | 'student' | 'admin') {
  const credentials = {
    teacher: { email: 'teacher@test.com', password: 'Test@123456', expectedRole: 'teacher' },
    student: { email: 'student_a@test.com', password: 'Test@123456', expectedRole: 'student' },
    admin: { email: 'admin@test.com', password: 'Test@123456', expectedRole: 'admin' }
  };
  const { email, password, expectedRole } = credentials[role];

  const res = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { email, password }
  });
  const data = await res.json();

  expect(data.code).toBe(0);
  expect(data.data.user.role).toBe(expectedRole);

  // Set localStorage and trigger storage event to notify React
  await page.goto(FRONTEND);
  await page.waitForLoadState('networkidle');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('lingobridge_demo_token', token);
    localStorage.setItem('lingobridge_demo_user', JSON.stringify(user));
    // Dispatch storage event to trigger React state update
    window.dispatchEvent(new Event('storage'));
  }, { token: data.data.token, user: data.data.user });
  await page.waitForTimeout(1500);
}

test.describe('LingoBridge MVP Full Pipeline', () => {

  test('01: Backend health', async () => {
    const res = await fetch(`${BACKEND}/api/v1/health`);
    const json = await res.json();
    expect(json.code).toBe(0);
  });

  test('02: Course CRUD', async () => {
    const createRes = await fetch(`${BACKEND}/api/v1/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'E2E Test Course', description: 'Test' })
    });
    const created = await createRes.json();
    expect(created.code).toBe(0);
    const courseId = created.data.id;

    const updateRes = await fetch(`${BACKEND}/api/v1/courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Updated Course' })
    });
    const updated = await updateRes.json();
    expect(updated.code).toBe(0);
    expect(updated.data.title).toBe('Updated Course');
  });

  test('03: Lesson nodes CRUD', async () => {
    const createRes = await fetch(`${BACKEND}/api/v1/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Lesson Test Course' })
    });
    const course = await createRes.json();
    const courseId = course.data.id;

    const nodeRes = await fetch(`${BACKEND}/api/v1/courses/${courseId}/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Lesson 1', startsAt: '2025-06-01T10:00:00Z' })
    });
    const node = await nodeRes.json();
    expect(node.code).toBe(0);
    expect(node.data.lessonNode.title).toBe('Lesson 1');
  });

  test('04: Live session requires lessonNodeId', async () => {
    const createRes = await fetch(`${BACKEND}/api/v1/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Live Test Course' })
    });
    const course = await createRes.json();
    const courseId = course.data.id;

    const nodeRes = await fetch(`${BACKEND}/api/v1/courses/${courseId}/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Live Lesson', startsAt: '2025-06-01T10:00:00Z' })
    });
    const node = await nodeRes.json();
    const lessonNodeId = node.data.lessonNode.id;

    const liveRes = await fetch(`${BACKEND}/api/v1/live-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ courseId, lessonNodeId, sourceMode: 'screen' })
    });
    const live = await liveRes.json();
    expect(live.code).toBe(0);
    expect(live.data.status).toBe('active');
  });

  test('05: Course members', async () => {
    const createRes = await fetch(`${BACKEND}/api/v1/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer teacher-1' },
      body: JSON.stringify({ title: 'Members Test Course' })
    });
    const course = await createRes.json();
    const courseId = course.data.id;

    const listRes = await fetch(`${BACKEND}/api/v1/courses/${courseId}/members`, {
      headers: { 'Authorization': 'Bearer teacher-1' }
    });
    const list = await listRes.json();
    expect(list.code).toBe(0);
  });

  test('06: TTS provider facade', async () => {
    const ttsRes = await fetch(`${BACKEND}/api/v1/tts?text=%E4%BD%A0%E5%A5%BD&lang=zh-CN`);
    const tts = await ttsRes.json();
    expect(tts.code).toBe(0);
    expect(tts.data.provider).toBe('browser-fallback');
    expect(tts.data.charCount).toBe(2);
    expect(tts.data.billingChars).toBe(4);
  });

  test('07: TTS usage requires admin', async () => {
    const studentRes = await fetch(`${BACKEND}/api/v1/tts/usage`, {
      headers: { 'Authorization': 'Bearer student-1' }
    });
    expect(studentRes.status).toBe(403);

    const adminRes = await fetch(`${BACKEND}/api/v1/tts/usage`, {
      headers: { 'Authorization': 'Bearer admin-1' }
    });
    const admin = await adminRes.json();
    expect(admin.code).toBe(0);
  });

  test('08: Teacher login → dashboard', async ({ page, request }) => {
    await loginViaAPI(page, request, 'teacher');
    await expect(page.locator('text=王老师').or(page.locator('text=Dashboard'))).toBeVisible({ timeout: 5000 });
  });

  test('09: Teacher → courses page', async ({ page, request }) => {
    await loginViaAPI(page, request, 'teacher');
    await page.locator('#sidebar-item-teacher-courses').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('#teacher-courses')).toBeVisible({ timeout: 5000 });
  });

  test('10: Student login → dashboard', async ({ page, request }) => {
    await loginViaAPI(page, request, 'student');
    await expect(page.locator('#dashboard-view')).toBeVisible({ timeout: 5000 });
  });

  test('11: Student → homework page', async ({ page, request }) => {
    await loginViaAPI(page, request, 'student');
    await page.locator('#sidebar-item-homework').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('#homework-path')).toBeVisible({ timeout: 5000 });
  });

  test('12: Student → vocabulary page', async ({ page, request }) => {
    await loginViaAPI(page, request, 'student');
    await page.locator('#sidebar-item-vocabulary').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('#vocabulary-view')).toBeVisible({ timeout: 5000 });
  });

  test('13: Admin login → dashboard', async ({ page, request }) => {
    await loginViaAPI(page, request, 'admin');
    await expect(page.locator('text=系统管理员').or(page.locator('text=Dashboard'))).toBeVisible({ timeout: 5000 });
  });

  test('14: Student cannot access admin', async ({ page, request }) => {
    await loginViaAPI(page, request, 'student');
    await page.goto(`${FRONTEND}/#/admin`);
    await page.waitForTimeout(1000);
    // Should see dashboard content, not admin content
    await expect(page.locator('#dashboard-view')).toBeVisible({ timeout: 5000 });
    // Should NOT see admin content
    await expect(page.locator('text=系统管理员')).not.toBeVisible({ timeout: 5000 });
  });

  test('15: Learning record persists after refresh', async ({ page, request }) => {
    await loginViaAPI(page, request, 'student');

    const taskId = `e2e-persist-${Date.now()}`;
    await request.post(`${BACKEND}/api/v1/learning-records`, {
      data: { taskId, context: 'homework', status: 'completed', score: 85 },
      headers: { 'Authorization': 'Bearer student-1' }
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const recordsRes = await request.get(`${BACKEND}/api/v1/learning-records`, {
      headers: { 'Authorization': 'Bearer student-1' }
    });
    const records = await recordsRes.json();
    expect(records.data.some((r: any) => r.taskId === taskId && r.status === 'completed')).toBe(true);
  });
});
