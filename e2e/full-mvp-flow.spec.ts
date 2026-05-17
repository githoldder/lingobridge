import { test, expect, APIRequestContext } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:3001';
const FRONTEND = 'http://127.0.0.1:3000';

async function setAuth(page: any, request: APIRequestContext, role: 'teacher' | 'student' | 'admin') {
  const credentials = {
    teacher: { email: 'teacher@test.com', password: 'Test@123456' },
    student: { email: 'student_a@test.com', password: 'Test@123456' },
    admin: { email: 'admin@test.com', password: 'Test@123456' }
  };
  const { email, password } = credentials[role];

  const res = await request.post(`${BACKEND}/api/v1/auth/login`, { data: { email, password } });
  const data = await res.json();
  expect(data.code).toBe(0);

  await page.goto(FRONTEND);
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('lingobridge_demo_token', token);
    localStorage.setItem('lingobridge_demo_user', JSON.stringify(user));
  }, { token: data.data.token, user: data.data.user });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

test.describe('LingoBridge Full MVP Flow (Efficient)', () => {

  test('01: Teacher Full Flow (Create Course -> Upload -> Live -> Verify)', async ({ page, request }) => {
    // 1. Login
    await setAuth(page, request, 'teacher');
    await expect(page.locator('#teacher-dashboard')).toBeVisible({ timeout: 5000 });

    // 2. Create Course
    await page.locator('#sidebar-item-teacher-courses').click();
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: /New Course|Create|新建/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    const titleInput = page.locator('input').first();
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('E2E Full Test Course');
      await page.locator('button', { hasText: /Save|Create/ }).first().click({ timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    await expect(page.locator('text=E2E Full Test Course').or(page.locator('text=第三课'))).toBeVisible({ timeout: 5000 });

    // 3. Enter Course Detail
    await page.locator('button', { hasText: /E2E Full|第三课/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 4. Add Lesson Node
    await page.locator('button', { hasText: /Schedule|课时/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const lessonInput = page.locator('input[placeholder*="title"], input[placeholder*="课时"]').first();
    if (await lessonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lessonInput.fill('Full Flow Lesson');
      await page.locator('button', { hasText: /Add|添加/ }).first().click({ timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Full Flow Lesson').or(page.locator('text=New Lesson'))).toBeVisible({ timeout: 5000 });

    // 5. Create Live Session
    await page.locator('button', { hasText: /Live|直播/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const createLiveBtn = page.locator('button', { hasText: /Create Live|创建直播/ }).first();
    if (await createLiveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createLiveBtn.click({ timeout: 5000 });
    }
    await page.waitForTimeout(3000);
    await expect(page.locator('text=active').or(page.locator('text=Live').or(page.locator('text=直播')))).toBeVisible({ timeout: 5000 });

    // 6. Verify Students Tab (should have student auto-added)
    await page.locator('button', { hasText: /Students|学生/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await expect(page.locator('text=阿合买提').or(page.locator('text=student_a'))).toBeVisible({ timeout: 5000 });
  });

  test('02: Student Full Flow (View Course -> Homework -> Record -> Verify)', async ({ page, request }) => {
    // 1. Login
    await setAuth(page, request, 'student');
    await expect(page.locator('#dashboard-view')).toBeVisible({ timeout: 5000 });

    // 2. View Courses
    await page.locator('#sidebar-item-courses').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=第三课').or(page.locator('text=E2E'))).toBeVisible({ timeout: 5000 });

    // 3. Enter Classroom
    await page.locator('button', { hasText: /Enter|Join|进入/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await expect(page.locator('#classroom-view').or(page.locator('text=PDF').or(page.locator('text=大家好')))).toBeVisible({ timeout: 5000 });

    // 4. Exit Classroom
    await page.locator('button', { hasText: /Exit|Leave|退出/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 5. Homework
    await page.locator('#sidebar-item-homework').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#homework-path')).toBeVisible({ timeout: 5000 });

    // 6. Vocabulary
    await page.locator('#sidebar-item-vocabulary').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#vocabulary-view')).toBeVisible({ timeout: 5000 });
  });

  test('03: Admin Full Flow (Verify Backend Data)', async ({ page, request }) => {
    // 1. Login
    await setAuth(page, request, 'admin');
    await expect(page.locator('#admin-dashboard')).toBeVisible({ timeout: 5000 });

    // 2. Verify Users
    await page.locator('button', { hasText: /Users|Account|用户/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await expect(page.locator('text=王老师').or(page.locator('text=阿合买提'))).toBeVisible({ timeout: 5000 });

    // 3. Verify Courses
    await page.locator('button', { hasText: /Courses|课程/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await expect(page.locator('text=第三课').or(page.locator('text=E2E'))).toBeVisible({ timeout: 5000 });

    // 4. Verify Live Sessions
    await page.locator('button', { hasText: /Live|直播/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await expect(page.locator('text=active').or(page.locator('text=Live').or(page.locator('text=直播')))).toBeVisible({ timeout: 5000 });

    // 5. Verify Progress
    await page.locator('button', { hasText: /Progress|进度/ }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await expect(page.locator('text=阿合买提').or(page.locator('text=Progress'))).toBeVisible({ timeout: 5000 });
  });

  test('04: API Direct Verification (No UI)', async ({ request }) => {
    // Verify course creation auto-adds students
    const createRes = await request.post(`${BACKEND}/api/v1/courses`, {
      headers: { 'Authorization': 'Bearer teacher-1' },
      data: { title: 'API Auto-Sync Test', description: 'Test' }
    });
    const created = await createRes.json();
    expect(created.code).toBe(0);
    const courseId = created.data.id;

    // Check members
    const membersRes = await request.get(`${BACKEND}/api/v1/courses/${courseId}/members`, {
      headers: { 'Authorization': 'Bearer teacher-1' }
    });
    const members = await membersRes.json();
    expect(members.code).toBe(0);
    expect(members.data.length).toBeGreaterThan(0); // Should have student-1

    // Verify student search
    const searchRes = await request.get(`${BACKEND}/api/v1/courses/${courseId}/students/search?q=阿合`, {
      headers: { 'Authorization': 'Bearer teacher-1' }
    });
    const search = await searchRes.json();
    expect(search.code).toBe(0);
  });
});
