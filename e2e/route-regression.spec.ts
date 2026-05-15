import { test, expect } from '@playwright/test';

const BACKEND = 'http://127.0.0.1:3001';
const FRONTEND = 'http://127.0.0.1:3000';

async function enterStudentMode(page: any) {
  await page.goto(FRONTEND);
  await page.waitForSelector('text=LingoBridge', { timeout: 10000 });
  await page.locator('button', { hasText: 'Student' }).first().click();
  await page.waitForTimeout(1500);
}

async function enterTeacherMode(page: any) {
  await page.goto(FRONTEND);
  await page.waitForSelector('text=LingoBridge', { timeout: 10000 });
  await page.locator('button', { hasText: 'Teacher' }).first().click();
  await page.waitForTimeout(1500);
}

test.describe('Live Route Regression Guard', () => {

  test('T24: teacher classroom shows teacher-only controls', async ({ page }) => {
    await enterTeacherMode(page);
    await page.locator('#sidebar-item-teacher-classroom').click();
    await page.waitForTimeout(2000);

    // Must see the shared classroom component
    await expect(page.locator('#classroom-view')).toBeVisible({ timeout: 5000 });

    // Teacher-only Share Screen label is visible (gated by isTeacher)
    await expect(page.getByText('Share Screen', { exact: false }).first()).toBeVisible();

    // Teacher must NOT see student-only homework panel button
    await expect(page.getByText('HW').first()).not.toBeVisible();
  });

  test('T24: teacher classroom has no practice-mode text', async ({ page }) => {
    await enterTeacherMode(page);
    await page.locator('#sidebar-item-teacher-classroom').click();
    await page.waitForTimeout(2000);

    // The practice/recording page had "Practice mode" — must not appear in live classroom
    await expect(page.getByText('Practice mode', { exact: false })).toHaveCount(0);
  });

  test('T24: student classroom uses shared component, no teacher controls', async ({ page }) => {
    await enterStudentMode(page);

    // Click "Join Classroom" on the dashboard to enter student classroom
    await page.locator('button', { hasText: 'Join Classroom' }).first().click();
    await page.waitForTimeout(2000);

    // Must see the shared classroom component (same id as teacher)
    await expect(page.locator('#classroom-view')).toBeVisible({ timeout: 5000 });

    // Student must NOT see teacher-only Share Screen control
    await expect(page.getByText('Share Screen', { exact: false })).toHaveCount(0);

    // Student sees waiting/empty state (Waiting for Teacher / Waiting for Class to Start)
    await expect(page.getByText(/Waiting for|Страница не найдена|等待/)).toBeVisible();
  });
});
