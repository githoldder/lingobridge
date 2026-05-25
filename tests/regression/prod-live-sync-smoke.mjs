import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = (process.env.LINGOBRIDGE_BASE_URL || 'https://lingobridge-lake.vercel.app').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/v1`;
const TEACHER_EMAIL = process.env.LINGOBRIDGE_TEACHER_EMAIL || 'teacher@test.com';
const STUDENT_EMAIL = process.env.LINGOBRIDGE_STUDENT_EMAIL || 'student_a@test.com';
const PASSWORD = process.env.LINGOBRIDGE_DEMO_PASSWORD || 'Test@123456';
const OUT_DIR = resolve('output/playwright');
const REPORT_PATH = resolve(OUT_DIR, 'prod-live-sync-smoke-report.md');

mkdirSync(OUT_DIR, { recursive: true });

const results = [];
let teacherToken = '';
let studentToken = '';
let sessionId = '';
let courseId = '';
let lessonNodeId = '';

function record(name, status, note = '') {
  results.push({ name, status, note });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${note ? ` - ${note}` : ''}`);
}

async function api(path, options = {}, token = teacherToken) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch {}
  if (!response.ok || body?.code !== 0) {
    const preview = text.trim().slice(0, 220).replace(/\s+/g, ' ');
    throw new Error(`${response.status} ${response.statusText}: ${body?.message || preview || 'non-json response'}`);
  }
  return body.data;
}

async function login(email) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await response.json();
  if (!response.ok || body.code !== 0) throw new Error(body.message || `login failed: ${response.status}`);
  return body.data;
}

async function findOrCreateLiveFixture() {
  const courses = await api('/courses');
  const course = courses[0];
  if (!course) throw new Error('teacher has no course');
  courseId = course.id;

  const nodes = await api(`/courses/${courseId}/lesson-nodes`);
  let node = nodes[0];
  if (!node) {
    const created = await api(`/courses/${courseId}/lesson-nodes`, {
      method: 'POST',
      body: JSON.stringify({ title: `Prod live smoke ${new Date().toISOString().slice(0, 10)}` }),
    });
    node = created.lessonNode;
  }
  lessonNodeId = node.id;

  try {
    const session = await api('/live-sessions', {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonNodeId, sourceMode: 'pdf' }),
    });
    sessionId = session.id;
  } catch (error) {
    const active = await api(`/live-sessions/active?courseId=${courseId}`);
    if (!active?.id) throw error;
    sessionId = active.id;
  }
}

async function apiSmoke() {
  const health = await api('/health', {}, '');
  record('Production API health', health.status === 'ok' ? 'PASS' : 'FAIL', `db=${health.db?.mode}/${health.db?.connected}`);

  const teacher = await login(TEACHER_EMAIL);
  teacherToken = teacher.token;
  record('Teacher login', 'PASS', teacher.user.displayName);

  const student = await login(STUDENT_EMAIL);
  studentToken = student.token;
  record('Student login', 'PASS', student.user.displayName);

  await findOrCreateLiveFixture();
  record('Live session available', 'PASS', sessionId);

  await api(`/live-sessions/${sessionId}/join`, { method: 'POST' }, studentToken);
  const presence = await api(`/live-sessions/${sessionId}/presence`, {
    method: 'POST',
    body: JSON.stringify({ handRaised: true, cameraOn: false, micOn: false }),
  }, studentToken);
  record('Student presence heartbeat', presence.handRaised ? 'PASS' : 'FAIL', presence.displayName);

  const participants = await api(`/live-sessions/${sessionId}/participants`);
  const participant = participants.find((p) => p.studentId === student.user.id);
  record('Teacher sees joined student', participant ? 'PASS' : 'FAIL', participant ? `${participant.displayName} joined` : 'student missing');

  const granted = await api(`/live-sessions/${sessionId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ studentId: student.user.id, mediaGranted: true }),
  });
  record('Teacher grants student media', granted.mediaGranted ? 'PASS' : 'FAIL', granted.displayName);

  await api(`/live-sessions/${sessionId}/signals`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId: student.user.id, type: 'page-sync', payload: { page: 2, liveMode: 'multimedia', isPdfType: true } }),
  });
  const signals = await api(`/live-sessions/${sessionId}/signals?since=0`, {}, studentToken);
  record('Student receives page-sync signal', signals.some((s) => s.type === 'page-sync') ? 'PASS' : 'FAIL', `${signals.length} signal(s)`);
}

async function loginUi(page, email) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const login = page.getByText(/登录|Login/i).first();
  await login.click({ timeout: 10_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1800);
}

async function uiSmoke() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox'],
  });
  const teacherContext = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1440, height: 900 } });
  const studentContext = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1440, height: 900 } });
  const teacherPage = await teacherContext.newPage();
  const studentPage = await studentContext.newPage();

  try {
    await loginUi(teacherPage, TEACHER_EMAIL);
    const teacherBody = await teacherPage.locator('body').innerText({ timeout: 10_000 });
    record('Teacher UI login', /王老师|Courses|课程/.test(teacherBody) ? 'PASS' : 'FAIL');

    await loginUi(studentPage, STUDENT_EMAIL);
    const studentBody = await studentPage.locator('body').innerText({ timeout: 10_000 });
    record('Student UI login', /阿合买提|课程|Dashboard|日程/.test(studentBody) ? 'PASS' : 'FAIL');
  } finally {
    await browser.close();
  }
}

function writeReport() {
  const rows = results.map((r) => `| ${r.name} | ${r.status} | ${r.note.replace(/\|/g, '\\|')} |`).join('\n');
  const failed = results.filter((r) => r.status === 'FAIL');
  const report = `# Production Live Sync Smoke Report

Base URL: ${BASE_URL}
Generated: ${new Date().toISOString()}

${failed.length ? `**Gate: FAIL** - ${failed.length} check(s) failed.` : '**Gate: PASS**'}

| Check | Status | Note |
| --- | --- | --- |
${rows}
`;
  writeFileSync(REPORT_PATH, report);
  console.log(`\nReport: ${REPORT_PATH}`);
}

async function main() {
  try {
    await apiSmoke();
    await uiSmoke();
  } catch (error) {
    record('Smoke runner', 'FAIL', error.message);
  } finally {
    writeReport();
  }
  if (results.some((r) => r.status === 'FAIL')) process.exit(1);
}

main();
