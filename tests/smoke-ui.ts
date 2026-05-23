import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const ROLES = [
  { name: 'student', email: 'student_a@test.com', password: 'Test@123456', expectedText: '阿合买提', tabs: ['查看日程', '作业', '词汇'] },
  { name: 'teacher', email: 'teacher@test.com', password: 'Test@123456', expectedText: '王老师', tabs: ['首页', '课程', '学生', '报告'] },
  { name: 'admin',   email: 'admin@test.com',   password: 'Test@123456', expectedText: '管理后台', tabs: [] },
];

async function uiLogin(page, email: string, password: string) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 10000 });

  const loginBtn = page.locator('a, button', { hasText: '登录' }).first();
  await loginBtn.click();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let pass = 0, fail = 0;

  // Pre-navigate to establish the context
  await page.goto(BASE, { waitUntil: 'load', timeout: 10000 });

  for (const role of ROLES) {
    console.log(`\n=== ${role.name} ===`);
    try {
      await page.evaluate(() => localStorage.clear());
      await uiLogin(page, role.email, role.password);
      await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });
      await page.getByText(role.expectedText).first().waitFor({ timeout: 10000 });

      const bodyText = await page.locator('body').innerText();

      // Verify expected user name
      if (bodyText.includes(role.expectedText)) {
        console.log(`  ✓ UI login shows "${role.expectedText}"`);
        pass++;
      } else {
        console.log(`  ✗ "${role.expectedText}" not found`);
        fail++;
      }

      // Verify landing page is gone
      if (bodyText.includes('全球公民的中文桥梁')) {
        console.log(`  ✗ Still on landing page — login failed`);
        fail++;
      } else {
        console.log(`  ✓ Navigated away from landing`);
        pass++;
      }

      // Verify tabs exist
      for (const tab of role.tabs) {
        if (bodyText.includes(tab)) {
          console.log(`  ✓ Tab "${tab}" visible`);
          pass++;
        } else {
          console.log(`  ✗ Tab "${tab}" missing`);
          fail++;
        }
      }

      // Click through each tab
      for (const tab of role.tabs) {
        const tabBtn = page.locator(`a, button`, { hasText: tab }).first();
        if (await tabBtn.isVisible().catch(() => false)) {
          await tabBtn.click();
          await page.locator('body').waitFor({ state: 'visible', timeout: 5000 });
          console.log(`  → Clicked "${tab}"`);
        }
      }
    } catch (err: any) {
      console.log(`  ✗ Error: ${err.message}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\n=== Results: ${pass} pass, ${fail} fail ===`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
