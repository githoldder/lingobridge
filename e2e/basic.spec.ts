import { test, expect } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:3001';
const FRONTEND = 'http://127.0.0.1:3000';

async function enterStudentMode(page: any) {
  await page.goto(FRONTEND);
  await page.waitForSelector('text=LingoBridge', { timeout: 10000 });
  // Click the big "Student" CTA button that goes directly into student dashboard
  await page.locator('button', { hasText: 'Student' }).first().click();
  await page.waitForTimeout(1500);
}

async function enterTeacherMode(page: any) {
  await page.goto(FRONTEND);
  await page.waitForSelector('text=LingoBridge', { timeout: 10000 });
  // Click the "Teacher" CTA button
  await page.locator('button', { hasText: 'Teacher' }).first().click();
  await page.waitForTimeout(1500);
}

test.describe('LingoBridge E2E', () => {

  test('backend health check', async () => {
    const res = await fetch(`${BACKEND}/api/v1/health`);
    const json = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('ok');
  });

  test('teacher can view courses page', async ({ page }) => {
    await enterTeacherMode(page);

    // Navigate to courses
    await page.locator('#sidebar-item-teacher-courses').click();
    await page.waitForTimeout(1500);

    // Should see the teacher courses view
    await expect(page.locator('#teacher-courses')).toBeVisible({ timeout: 5000 });

    // Course cards should exist or the page shows loading/empty state
    await expect(page.locator('#teacher-courses')).toBeVisible();
  });

  test('student homework page loads', async ({ page }) => {
    await enterStudentMode(page);

    // Navigate to homework via sidebar
    await page.locator('#sidebar-item-homework').click();
    await page.waitForTimeout(2000);

    // The page should render with the main homework content
    await expect(page.locator('#homework-path')).toBeVisible({ timeout: 5000 });
  });

  test('student vocabulary page loads', async ({ page }) => {
    await enterStudentMode(page);

    // Navigate to vocabulary
    await page.locator('#sidebar-item-vocabulary').click();
    await page.waitForTimeout(2000);

    // The page should render the vocabulary view
    await expect(page.locator('#vocabulary-view')).toBeVisible({ timeout: 5000 });
  });

  test('learning record API persists', async () => {
    const taskId = `e2e-test-${Date.now()}`;
    // Create an in_progress record
    const createRes = await fetch(`${BACKEND}/api/v1/learning-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer student-1' },
      body: JSON.stringify({ taskId, context: 'homework', status: 'in_progress', score: 0 })
    });
    const created = await createRes.json();
    expect(created.code).toBe(0);
    expect(created.data.taskId).toBe(taskId);

    // Complete the record
    const updateRes = await fetch(`${BACKEND}/api/v1/learning-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer student-1' },
      body: JSON.stringify({ taskId, context: 'homework', status: 'completed', score: 85 })
    });
    const updated = await updateRes.json();
    expect(updated.code).toBe(0);
    expect(updated.data.status).toBe('completed');
    expect(updated.data.score).toBe(85);

    // Verify by listing all records (no courseId filter to avoid missing it)
    const listRes = await fetch(`${BACKEND}/api/v1/learning-records`);
    const list = await listRes.json();
    const record = list.data.find((r: any) => r.taskId === taskId);
    expect(record).toBeTruthy();
    expect(record.status).toBe('completed');
    expect(record.score).toBe(85);
  });
});
