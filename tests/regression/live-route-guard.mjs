import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../../output/playwright');
const SCREENSHOT_DIR = resolve(OUTPUT_DIR, 'screenshots');
const FRONTEND_URL = 'http://127.0.0.1:4174';
const REPORT = resolve(OUTPUT_DIR, 'live-route-guard-report.md');

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

let page, browser, context;
const results = {};

function pass(name) { results[name] = 'Pass'; console.log(`  ✅ ${name}`); }
function fail(name, msg) { results[name] = `Fail: ${msg}`; console.log(`  ❌ ${name}: ${msg}`); }

async function main() {
  console.log('\n=== T24: Route Regression Guard ===\n');

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera', 'microphone'],
  });
  page = await context.newPage();
  page.on('pageerror', err => console.log(`  [pageerror] ${err.message}`));

  // ─── Helper ────────────────────────────────────
  async function loginAs(email, password) {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.locator('button:has-text("Login")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').clear();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').clear();
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  }
  async function enterStudentClassroom() {
    const joinBtn = page.locator('button:has-text("Join Classroom")');
    if (await joinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinBtn.click();
    } else {
      await page.locator('button:has-text("Continue Learning")').click();
    }
    await page.waitForTimeout(2000);
  }

  // ══════════════════════════════════════════
  // Test 1: Student live entry → #classroom-view
  // ══════════════════════════════════════════
  console.log('--- Test 1: Student live entry → #classroom-view ---');
  try {
    await loginAs('student_a@test.com', 'Test@123456');
    await enterStudentClassroom();
    const classroomView = page.locator('#classroom-view');
    const classroomVisible = await classroomView.isVisible({ timeout: 3000 }).catch(() => false);
    if (classroomVisible) {
      pass('T1a Student enters #classroom-view');
    } else {
      fail('T1a Student enters #classroom-view', '#classroom-view not visible');
    }

    // Verify "Practice mode" is absent (that text is in StudentClassroomView, not live route)
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Practice mode')) {
      fail('T1b No Practice mode text in live route', `Found "Practice mode" in live classroom`);
    } else {
      pass('T1b No Practice mode text in live route');
    }
    await page.screenshot({ path: resolve(SCREENSHOT_DIR, 't24-student-live.png') });
  } catch (e) {
    fail('Test 1 student live entry', e.message);
  }

  // ══════════════════════════════════════════
  // Test 2: Student role hides teacher-only controls
  // ══════════════════════════════════════════
  console.log('\n--- Test 2: Student role hides teacher-only controls ---');
  try {
    // Recording control should be absent for student
    const teacherRecordingBtn = page.locator('footer button:has-text("Recording")');
    const teacherRecordingVisible = await teacherRecordingBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (teacherRecordingVisible) {
      fail('T2a Recording not hidden', 'Student sees Recording button');
    } else {
      pass('T2a Recording hidden for student');
    }

    // Screen share should be absent for student
    const screenShareBtn = page.locator('footer span:has-text("SHARE SCREEN"), footer button:has-text("Share Screen")');
    const screenShareVisible = await screenShareBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (screenShareVisible) {
      fail('T2b Screen share not hidden', 'Student sees screen share button');
    } else {
      pass('T2b Screen share hidden for student');
    }

    // Raise hand should be visible for student
    const raiseHandBtn = page.locator('button:has-text("Raise Hand")');
    const raiseHandVisible = await raiseHandBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (raiseHandVisible) {
      pass('T2c Raise hand visible for student');
    } else {
      fail('T2c Raise hand student', 'Raise Hand button not found');
    }

    await page.screenshot({ path: resolve(SCREENSHOT_DIR, 't24-student-controls.png') });
  } catch (e) {
    fail('Test 2 student controls', e.message);
  }

  // ══════════════════════════════════════════
  // Test 3: Teacher role shows teacher controls
  // ══════════════════════════════════════════
  console.log('\n--- Test 3: Teacher role shows teacher controls ---');
  try {
    // Logout → login as teacher
    await page.locator('button:has-text("Leave Class")').click();
    await page.waitForTimeout(500);
    const endBtn = page.locator('button:has-text("End Class")');
    if (await endBtn.isVisible({ timeout: 1000 }).catch(() => false)) await endBtn.click();
    await page.waitForTimeout(500);
    await page.locator('#sidebar-footer button:has-text("Login")').click();
    await page.waitForTimeout(1000);

    await loginAs('teacher@test.com', 'Test@123456');
    await page.locator('#sidebar-nav button:has-text("Courses")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Enter Class")').first().click();
    await page.waitForTimeout(2000);

    // Verify recording button is present for teacher
    const teacherRecBtn = page.locator('footer button:has-text("Recording")');
    const teacherRecVisible = await teacherRecBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (teacherRecVisible) {
      pass('T3a Recording visible for teacher');
    } else {
      fail('T3a Recording visible for teacher', 'Recording button not found');
    }

    // Verify screen share is present for teacher (use the center control text)
    const teacherScreenBtn = page.locator('footer span:has-text("SHARE SCREEN"), footer span:has-text("STOP SHARE")');
    const teacherScreenVisible = await teacherScreenBtn.isVisible({ timeout: 1000 }).catch(() => false);
    if (teacherScreenVisible) {
      pass('T3b Screen share visible for teacher');
    } else {
      fail('T3b Screen share visible for teacher', 'Screen share text not found');
    }

    await page.screenshot({ path: resolve(SCREENSHOT_DIR, 't24-teacher-controls.png') });
  } catch (e) {
    fail('Test 3 teacher controls', e.message);
  }

  // ══════════════════════════════════════════
  // Test 4: Code comment check
  // ══════════════════════════════════════════
  console.log('\n--- Test 4: Code comment check ---');
  const appTsx = readFileSync(resolve(__dirname, '../../src/components/App.tsx'), 'utf8');
  const teacherClassroomLines = appTsx.split('\n').filter(l => l.includes('teacher-classroom') || l.includes('student-classroom'));
  const studentClassroomNotLive = teacherClassroomLines.some(l =>
    l.includes('TeacherClassroomView') && l.includes('student-classroom')
  );

  if (studentClassroomNotLive) {
    pass('T4a student-classroom uses shared TeacherClassroomView');
  } else {
    fail('T4a student-classroom routing', 'Could not verify route uses shared classroom');
  }

  // Check StudentClassroomView mentions
  const studentCvPath = resolve(__dirname, '../../src/components/StudentClassroomView.tsx');
  if (existsSync(studentCvPath)) {
    const studentCv = readFileSync(studentCvPath, 'utf8');
    // Check it has a practice/homework purpose line
    if (studentCv.includes('Practice mode') || studentCv.includes('practice')) {
      pass('T4b StudentClassroomView is practice-only (has "Practice mode")');
    } else {
      fail('T4b StudentClassroomView practice-only', 'No practice indicator found');
    }
  } else {
    fail('T4b StudentClassroomView exists', 'File not found');
  }

  await browser.close();
  writeReport();
}

function writeReport() {
  const rows = Object.entries(results).map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const allPass = Object.values(results).every(v => v === 'Pass');
  const summary = allPass ? '**Gate: PASS** — all route guard checks pass' : '**Gate: FAIL** — see individual results';

  const report = `# T24 Live Route Guard Report

## Summary

${summary}

## Results

| Test | Result |
|---|---|
${rows}

## Details

### Test 1: Student live entry
- Navigates to frontend, logs in as student, clicks Join Classroom
- Verifies \`#classroom-view\` element is rendered (shared live classroom component)
- Verifies "Practice mode" text is **absent** (ensuring old StudentClassroomView is not the live route)

### Test 2: Student role hides teacher-only controls
- Recording button absent
- Screen share absent
- Raise hand present (student-only control)

### Test 3: Teacher role shows teacher controls
- Recording button present
- Screen share present

### Test 4: Code structure
- \`student-classroom\` route renders \`TeacherClassroomView role="student"\`
- \`StudentClassroomView\` contains practice-only indicators, not used for live routing

## Proof

Screenshots saved to \`output/playwright/screenshots/t24-*.png\`
`;

  writeFileSync(REPORT, report);
  console.log(`\nReport written to ${REPORT}`);
}

main().catch(async err => {
  console.error('Route guard error:', err);
  if (browser) await browser.close();
  process.exit(1);
});
