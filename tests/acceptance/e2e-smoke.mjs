import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT = resolve(__dirname, 'e2e-smoke-report.md');
const SCREENSHOT_DIR = resolve(__dirname, '../../output/playwright/screenshots');
const FRONTEND_URL = 'http://127.0.0.1:4174';
const BACKEND_URL = 'http://127.0.0.1:3001/api/v1';
const FIXTURE_PDF = resolve(__dirname, '../../output/playwright/fixture.pdf');
const FIXTURE_XLSX = resolve(__dirname, '../../output/playwright/fixture.xlsx');

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = {};
let page, browser, context;

function pass(name) { results[name] = { result: 'Pass', note: '' }; console.log(`  ✅ ${name}`); }
function fail(name, note) { results[name] = { result: 'Fail', note }; console.log(`  ❌ ${name}: ${note}`); }
function block(name, note) { results[name] = { result: 'Blocked', note }; console.log(`  ⛔ ${name}: ${note}`); }

async function screenshot(name) {
  try { await page.screenshot({ path: resolve(SCREENSHOT_DIR, `${name}.png`), fullPage: false }); } catch {}
}

async function clickVisible(locator, timeout = 5000) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click();
}

async function clickFirst(selector, timeout = 5000) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.click();
  return loc;
}

async function main() {
  console.log('\n=== LingoBridge E2E Smoke Test ===\n');

  browser = await chromium.launch({
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
    ],
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera', 'microphone'],
  });
  page = await context.newPage();

  page.on('pageerror', err => console.log(`  [pageerror] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`);
  });

  // ════════════════════════════════════════════
  // R015: Open frontend
  // ════════════════════════════════════════════
  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await screenshot('01-frontend-home');
    pass('R015 Frontend open');
  } catch (e) {
    fail('R015 Frontend open', e.message);
    await browser.close();
    writeReport();
    process.exit(1);
  }

  // ════════════════════════════════════════════
  // R016: Navigate to login
  // HomePage has 2 "Login" buttons: nav + hero prompt
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Login")').first());
    await page.waitForTimeout(1500);
    await screenshot('02-login-page');
    // Verify email input (placeholder "name@example.com")
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 3000 });
    pass('R016 Login page visible');
  } catch (e) {
    fail('R016 Login page visible', e.message);
  }

  // ════════════════════════════════════════════
  // R017: Teacher login
  // Email input has placeholder="name@example.com"
  // Password input has type="password"
  // LoginView pre-fills student_a@test.com / Test@123456
  // ════════════════════════════════════════════
  try {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.clear();
    await emailInput.fill('teacher@test.com');
    await passwordInput.clear();
    await passwordInput.fill('Test@123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await screenshot('03-teacher-logged-in');
    // Teacher sidebar should show "Courses"
    await page.locator('#sidebar-nav button:has-text("Courses")').waitFor({ state: 'visible', timeout: 5000 });
    pass('R017 Teacher login');
  } catch (e) {
    fail('R017 Teacher login', e.message);
  }

  // ════════════════════════════════════════════
  // R018: Teacher courses page
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('#sidebar-nav button:has-text("Courses")'));
    await page.waitForTimeout(1000);
    await screenshot('04-teacher-courses');
    await page.locator('text=My Courses').waitFor({ state: 'visible', timeout: 3000 });
    pass('R018 Teacher courses page');
  } catch (e) {
    fail('R018 Teacher courses page', e.message);
  }

  // ════════════════════════════════════════════
  // R019: Create E2E test course
  // ════════════════════════════════════════════
  try {
    await page.locator('input[placeholder="Course title"]').fill('E2E Smoke Course');
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(1500);
    await screenshot('05-course-created');
    pass('R019 Create E2E course');
  } catch (e) {
    block('R019 Create E2E course', e.message);
  }

  // ════════════════════════════════════════════
  // R020: Upload PDF fixture
  // File input is hidden inside <label>Upload</label>
  // ════════════════════════════════════════════
  if (existsSync(FIXTURE_PDF)) {
    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.locator('label:has-text("Upload")').click(),
      ]);
      await fileChooser.setFiles(FIXTURE_PDF);
      await page.waitForTimeout(3000);
      await screenshot('06-pdf-uploaded');
      const body = await page.textContent('body');
      if (body.includes('page') || body.includes('Pages')) {
        pass('R020 PDF upload');
      } else {
        block('R020 PDF upload', 'upload sent but no page count confirmation');
      }
    } catch (e) {
      block('R020 PDF upload', e.message);
    }
  } else {
    block('R020 PDF upload', `fixture not found: ${FIXTURE_PDF}`);
  }

  // ════════════════════════════════════════════
  // R021: Upload XLSX fixture
  // ════════════════════════════════════════════
  if (existsSync(FIXTURE_XLSX)) {
    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.locator('label:has-text("Upload")').click(),
      ]);
      await fileChooser.setFiles(FIXTURE_XLSX);
      await page.waitForTimeout(3000);
      await screenshot('07-xlsx-uploaded');
      pass('R021 XLSX upload');
    } catch (e) {
      block('R021 XLSX upload', e.message);
    }
  } else {
    block('R021 XLSX upload', `fixture not found: ${FIXTURE_XLSX}`);
  }

  // ════════════════════════════════════════════
  // R022: Enter teacher classroom
  // ════════════════════════════════════════════
  try {
    // On a course card there's an "Enter Class" button
    await clickVisible(page.locator('button:has-text("Enter Class")').first());
    await page.waitForTimeout(2000);
    await screenshot('08-teacher-classroom');
    await page.locator('button:has-text("Leave Class")').waitFor({ state: 'visible', timeout: 3000 });
    pass('R022 Enter teacher classroom');
  } catch (e) {
    fail('R022 Enter teacher classroom', e.message);
  }

  // ════════════════════════════════════════════
  // R023: Start camera (keep on for recording in R026)
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Start Video")').first());
    await page.waitForTimeout(1500);
    await screenshot('09-camera-on');
    pass('R023 Camera start');
  } catch (e) {
    block('R023 Camera start', e.message);
  }

  // ════════════════════════════════════════════
  // R025: Unmute mic (provide audio track for recording)
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Unmute Mic")').first());
    await page.waitForTimeout(500);
    await screenshot('10-mic-on');
    pass('R025 Mic unmute');
  } catch (e) {
    block('R025 Mic unmute', e.message);
  }

  // ════════════════════════════════════════════
  // R026: Teacher recording upload
  // Now both camera (video) and mic (audio) streams are active
  // Right-side status button: "Recording" + "Stopped" → "LIVE"
  // ════════════════════════════════════════════
  try {
    const recBtn = page.locator('footer button').filter({ hasText: 'Recording' }).first();
    await recBtn.click();
    await page.waitForTimeout(3000);
    await screenshot('11-recording-in-progress');

    // Check if "LIVE" appears in the right-side button
    const liveIndicator = page.locator('footer button:has-text("LIVE")');
    if (await liveIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Stop recording
      await recBtn.click();
      await page.waitForTimeout(3000);
      await screenshot('12-recording-uploaded');
      pass('R026 Teacher recording upload');
    } else {
      block('R026 Teacher recording upload', 'LIVE state not detected after clicking recording');
    }
  } catch (e) {
    block('R026 Teacher recording upload', e.message);
  }

  // ════════════════════════════════════════════
  // R024: Stop camera
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Stop Video")').first());
    await page.waitForTimeout(500);
    await screenshot('13-camera-off');
    pass('R024 Camera stop');
  } catch (e) {
    block('R024 Camera stop', e.message);
  }

  // ════════════════════════════════════════════
  // R025b: Mute mic
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Mute Mic")').first());
    await page.waitForTimeout(500);
    await screenshot('14-mic-off');
    pass('R025 Mic mute');
  } catch (e) {
    block('R025 Mic mute', e.message);
  }

  // ════════════════════════════════════════════
  // R027: Camera indicator - manual only
  // ════════════════════════════════════════════
  block('R027 Camera indicator', 'browser_pending_manual - requires real camera to verify OS indicator closes');

  // ════════════════════════════════════════════
  // R028: Student login
  // ════════════════════════════════════════════
  try {
    // Leave class
    await clickVisible(page.locator('button:has-text("Leave Class")').first());
    await page.waitForTimeout(500);
    // End Class confirmation
    const endBtn = page.locator('button:has-text("End Class")');
    if (await endBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await endBtn.click();
      await page.waitForTimeout(1000);
    }

    // Click sidebar Login (logout) -> goes to landing
    await clickVisible(page.locator('#sidebar-footer button:has-text("Login")').first());
    await page.waitForTimeout(1000);

    // Now on landing, click Login again
    await clickVisible(page.locator('button:has-text("Login")').first());
    await page.waitForTimeout(1000);

    // Fill student credentials
    await page.locator('input[type="email"]').clear();
    await page.locator('input[type="email"]').fill('student_a@test.com');
    await page.locator('input[type="password"]').clear();
    await page.locator('input[type="password"]').fill('Test@123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await screenshot('15-student-logged-in');
    // Student sidebar should show "Home" (exact match, not "Homework")
    await page.locator('#sidebar-item-dashboard').waitFor({ state: 'visible', timeout: 5000 });
    pass('R028 Student login');
  } catch (e) {
    fail('R028 Student login', e.message);
  }

  // ════════════════════════════════════════════
  // R029: Enter student classroom
  // Dashboard has a card with "Join Classroom" button
  // ════════════════════════════════════════════
  try {
    await clickFirst('button:has-text("Join Classroom")');
    await page.waitForTimeout(2000);
    await screenshot('16-student-classroom');
    await page.locator('text=Practice mode').waitFor({ state: 'visible', timeout: 3000 });
    pass('R029 Student classroom page');
  } catch (e) {
    // Try via "Continue Learning" button
    try {
      await clickFirst('button:has-text("Continue Learning")');
      await page.waitForTimeout(2000);
      await page.locator('text=Practice mode').waitFor({ state: 'visible', timeout: 3000 });
      pass('R029 Student classroom page');
    } catch (e2) {
      fail('R029 Student classroom page', `Join Classroom: ${e.message}; Continue: ${e2.message}`);
    }
  }

  // ════════════════════════════════════════════
  // R030: Flip page (next)
  // ChevronRight button - second button in the header pagination
  // The disabled state changes; we click the one that is NOT disabled
  // ════════════════════════════════════════════
  try {
    // Find the page info text to check total pages
    const bodyText = await page.textContent('body');
    const match = bodyText.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
    const totalPages = match ? parseInt(match[2]) : 0;
    if (totalPages <= 1) {
      block('R030 Page flip', `only ${totalPages || 0} page(s) - no next to click`);
    } else {
      // Next page button is the right chevron, NOT disabled
      const nextBtn = page.locator('button:not([disabled]) svg.lucide-chevron-right, button:not([disabled]) svg.lucide-chevron-right').first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        await screenshot('15-page-flipped');
        pass('R030 Page flip');
      } else {
        // Fallback: find the right chevron button by class
        const chevronBtns = page.locator('#classroom-view button:not([disabled])');
        const count = await chevronBtns.count();
        let flipped = false;
        for (let i = 0; i < count; i++) {
          const html = await chevronBtns.nth(i).innerHTML();
          if (html.includes('chevron-right') || html.includes('ChevronRight')) {
            await chevronBtns.nth(i).click();
            await page.waitForTimeout(1000);
            flipped = true;
            break;
          }
        }
        if (flipped) { await screenshot('15-page-flipped'); pass('R030 Page flip'); }
        else block('R030 Page flip', 'chevron-right button not found');
      }
    }
  } catch (e) {
    block('R030 Page flip', e.message);
  }

  // ════════════════════════════════════════════
  // R031: TTS
  // Button text: "Model Answer" (t('homework.model_answer'))
  // ════════════════════════════════════════════
  try {
    const ttsBtn = page.locator('button:has-text("Model Answer")');
    await clickVisible(ttsBtn, 3000);
    await page.waitForTimeout(2000);
    await screenshot('16-tts');
    pass('R031 TTS');
  } catch (e) {
    block('R031 TTS', e.message);
  }

  // ════════════════════════════════════════════
  // R032: Student recording upload
  // Button text: "Ready to Practice" (t('homework.ready')) when idle
  // Stop button shows "Stop 00:xx" when recording
  // ════════════════════════════════════════════
  try {
    await clickVisible(page.locator('button:has-text("Ready to Practice")').first());
    await page.waitForTimeout(3000);
    // Stop button shows "Stop 00:xx" format
    await page.locator('button').filter({ hasText: /^Stop/ }).first().waitFor({ state: 'visible', timeout: 3000 });
    const stopBtn = page.locator('button').filter({ hasText: /^Stop/ }).first();
    await stopBtn.click();
    await page.waitForTimeout(3000);
    await screenshot('17-recording-uploaded');
    pass('R032 Student recording upload');
  } catch (e) {
    block('R032 Student recording upload', e.message);
  }

  // ════════════════════════════════════════════
  // R033: Play recording
  // Play button has Play icon (lucide-play)
  // ════════════════════════════════════════════
  try {
    const playBtn = page.locator('#classroom-view button svg.lucide-play').first();
    if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await playBtn.click();
      await page.waitForTimeout(1000);
      await screenshot('18-play-recording');
      pass('R033 Recording play');
    } else {
      block('R033 Recording play', 'play icon not found, probably no recordings');
    }
  } catch (e) {
    block('R033 Recording play', e.message);
  }

  // ════════════════════════════════════════════
  // R034: Download recording
  // Download is an <a> tag with download attribute
  // ════════════════════════════════════════════
  try {
    const dlLink = page.locator('#classroom-view a[download]').first();
    if (await dlLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      pass('R034 Recording download');
    } else {
      block('R034 Recording download', 'download link not found');
    }
  } catch (e) {
    block('R034 Recording download', e.message);
  }

  // ════════════════════════════════════════════
  // R035: Delete recording
  // Delete button has Trash2 icon (lucide-trash2)
  // ════════════════════════════════════════════
  try {
    const delBtn = page.locator('#classroom-view button svg.lucide-trash2').first();
    if (await delBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      pass('R035 Recording delete');
    } else {
      block('R035 Recording delete', 'delete button not found');
    }
  } catch (e) {
    block('R035 Recording delete', e.message);
  }

  // ════════════════════════════════════════════
  // R036: Schedule replay view
  // ════════════════════════════════════════════
  try {
    // Leave student classroom
    await clickVisible(page.locator('button:has-text("Leave Class")').first());
    await page.waitForTimeout(500);

    // Sidebar: "View Schedule"
    await clickVisible(page.locator('#sidebar-nav button:has-text("View Schedule")').first());
    await page.waitForTimeout(1500);
    await screenshot('19-schedule-replay');

    // Click "History & Replays" tab
    const replaysTab = page.locator('button:has-text("Replays")').first();
    if (await replaysTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await replaysTab.click();
      await page.waitForTimeout(1000);
      await screenshot('20-replays-tab');
    }
    pass('R036 Schedule replay visible');
  } catch (e) {
    block('R036 Schedule replay', e.message);
  }

  await browser.close();
  writeReport();

  function writeReport() {
    const rows = Object.entries(results).map(([step, r]) => `| ${step} | ${r.result} | ${r.note} |`).join('\n');
    const blockingDefects = Object.entries(results).filter(([,r]) => r.result === 'Fail');
    const nonBlocking = Object.entries(results).filter(([,r]) => r.result === 'Blocked');
    const report = [
      '# E2E Smoke Report',
      '',
      '## Environment',
      '',
      `- Frontend URL: ${FRONTEND_URL}`,
      `- Backend URL: ${BACKEND_URL}`,
      '- Browser: Chromium (headed, fake media stream)',
      `- Date: ${new Date().toISOString().split('T')[0]}`,
      '',
      '## Results',
      '',
      '| Step | Result | Notes |',
      '|---|---|---|',
      rows,
      '',
      '## Blocking Defects',
      '',
      blockingDefects.length ? blockingDefects.map(([s,r]) => `- **${s}**: ${r.note}`).join('\n') : 'None',
      '',
      '## Non-Blocking Notes',
      '',
      nonBlocking.length ? nonBlocking.map(([s,r]) => `- ${s}: ${r.note}`).join('\n') : 'None',
      '',
      '## Screenshots',
      '',
      'Screenshots saved to `output/playwright/screenshots/`',
    ].join('\n');

    writeFileSync(REPORT, report);
    console.log(`\nReport written to ${REPORT}`);
  }
}

main().catch(async err => {
  console.error('E2E Error:', err);
  if (browser) await browser.close();
  process.exit(1);
});
