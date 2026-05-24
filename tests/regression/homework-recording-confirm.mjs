import { chromium } from 'playwright';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const FRONTEND = process.env.FRONTEND || 'http://127.0.0.1:3000';
const BACKEND = process.env.BACKEND || 'http://127.0.0.1:3001';

// ─── 每次执行 E2E 前重置后端 JSON 沙箱并重启 PM2 服务，保障 100% 环境纯净 ───
const dbPath = 'backend/data/db.json';
if (fs.existsSync(dbPath)) {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.learningRecords = [];
    db.homeworkSubmissions = [];
    db.recordings = [];
    db.learningTasks = [];
    db.vocabularyItems = [];
    db.lessonNodes = db.lessonNodes.filter(n => n.id === 'lesson-node-1');
    db.assignmentNodes = db.assignmentNodes.filter(n => n.id === 'assignment-node-1');
    db.files = [];
    db.coursewareFiles = [];
    db.homeworkImports = [];
    db.liveClassStudents = [];
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('[E2E-Prep] Cleaned backend JSON database successfully!');
    
    // 重启 PM2 进程 4 (lingobridge-backend)
    execSync('pm2 restart 4', { stdio: 'inherit' });
    console.log('[E2E-Prep] Restarted PM2 backend server successfully!');
    // 稍微等待 2 秒确保服务恢复响应并完成端口绑定
    execSync('sleep 2');
  } catch (err) {
    console.warn('[E2E-Prep] Failed to clean backend JSON database or restart server:', err);
  }
}


// ─── 轮询健康检查，确保后端完全启动并绑定端口 ───
let ok = false;
for (let i = 0; i < 90; i++) {
  try {
    const res = await fetch(`${BACKEND}/api/v1/health`);
    if (res.ok) {
      ok = true;
      console.log('[E2E-Prep] Backend is fully online and responsive!');
      break;
    }
  } catch {
    await new Promise(r => setTimeout(r, 500));
  }
}
if (!ok) throw new Error('[E2E-Prep] Backend failed to start within timeout.');

const courseRes = await fetch(`${BACKEND}/api/v1/courses`, {
  headers: { Authorization: 'Bearer student-1' }
});
const courses = (await courseRes.json()).data || [];
if (!courses[0]) throw new Error('No student course available for homework regression.');

let selectedCourse = null;
let selectedTasks = [];
let assignmentNodeId = '';
for (const course of courses) {
  const tasksRes = await fetch(`${BACKEND}/api/v1/homework/tasks?courseId=${course.id}&includeAll=true`, {
    headers: { Authorization: 'Bearer student-1' }
  });
  const tasks = (await tasksRes.json()).data || [];
  if (tasks.length > 0) {
    selectedCourse = course;
    selectedTasks = tasks;
    assignmentNodeId = tasks[0].assignmentNodeId;
    break;
  }
}
if (!selectedCourse || !selectedTasks[0]) {
  selectedCourse = courses.find((course) => course.id === 'course-1') || courses[0];
  const lessonRes = await fetch(`${BACKEND}/api/v1/courses/${selectedCourse.id}/lesson-nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
    body: JSON.stringify({ title: `E2E 作业录音 ${Date.now()}` })
  });
  const lessonJson = await lessonRes.json();
  const lessonNodeId = lessonJson.data.lessonNode.id;
  assignmentNodeId = lessonJson.data.assignmentNode.id;
  const filename = 'homework-tones-practice.xlsx';
  const base64 = fs.readFileSync(`tests/samples/generated/${filename}`).toString('base64');
  await fetch(`${BACKEND}/api/v1/assignments/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
    body: JSON.stringify({
      courseId: selectedCourse.id,
      lessonNodeId,
      assignmentNodeId,
      filename,
      base64
    })
  });
  const tasksRes = await fetch(`${BACKEND}/api/v1/homework/tasks?courseId=${selectedCourse.id}&lessonNodeId=${lessonNodeId}`, {
    headers: { Authorization: 'Bearer student-1' }
  });
  selectedTasks = (await tasksRes.json()).data || [];
}
if (!selectedCourse || !selectedTasks[0]) throw new Error('Unable to create homework task for homework regression.');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));


await page.addInitScript(({ courseId, lessonNodeId }) => {
  localStorage.setItem('lingobridge_demo_token', 'student-1');
  localStorage.setItem('lingobridge_demo_user', JSON.stringify({
    id: 'student-1',
    username: 'student@test.com',
    role: 'student',
    displayName: 'Student A',
    languagePref: 'zh'
  }));
  localStorage.setItem('lingobridge_courseId', courseId);
  localStorage.removeItem('lingobridge_hw_recording_slots_v1');
  sessionStorage.setItem('__lingobridge_nav__', JSON.stringify({
    tab: 'homework',
    ctx: { courseId, lessonNodeId }
  }));

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
    getUserMedia: async () => ({
      getTracks: () => [{ stop() {} }]
    })
    }
  });

  Object.defineProperty(window, 'MediaRecorder', {
    configurable: true,
    value: class MockMediaRecorder {
    constructor() {
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['mock-audio'], { type: 'audio/webm' }) });
      this.onstop?.();
    }
    }
  });
}, { courseId: selectedCourse.id, lessonNodeId: selectedTasks[0].lessonNodeId });

await page.goto(FRONTEND, { waitUntil: 'networkidle' });
await page.locator('#homework-path').waitFor({ state: 'visible', timeout: 10000 });

// 智能适配 Focus Locator：检查是否已经自动弹出选定课时的关卡 Modal，未弹出时则手动点击关卡节点
const taskButton = page.locator('.fixed button[class*="w-12"][class*="h-12"]').first();
try {
  await taskButton.waitFor({ state: 'visible', timeout: 3000 });
  console.log('[E2E] Focus Locator worked successfully! Homework lesson modal was automatically popped up.');
} catch {
  console.log('[E2E] Homework lesson modal did not pop up automatically. Manually clicking the first pathway node...');
  await page.locator('#homework-path button').first().click();
  await taskButton.waitFor({ state: 'visible', timeout: 5000 });
}

await taskButton.click();
await page.locator('#homework-task-view').waitFor({ state: 'visible', timeout: 10000 });

// 循环答完所有题，每道题均打满 3 分，然后切下一题，直至完成提交
const totalTasks = selectedTasks.length;
for (let i = 0; i < totalTasks; i++) {
  console.log(`[E2E] Answering Task ${i + 1} of ${totalTasks}`);
  for (let slot = 0; slot < 3; slot++) {
    await page.getByTestId('homework-record-button').click();
    await page.waitForTimeout(100);
    await page.getByTestId('homework-stop-button').click();
    await page.getByText('录音待确认').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByTestId('homework-confirm-recording').click();
    await page.getByTestId('homework-ai-analysis').waitFor({ state: 'visible', timeout: 5000 });

    const slotText = await page.locator(`button:has-text("Slot ${slot + 1}")`).first().textContent();
    if (!slotText || (!slotText.includes('得分') && !slotText.includes('Score') && !slotText.includes('待确认'))) {
      throw new Error(`Slot ${slot + 1} did not load score: "${slotText}"`);
    }
  }
  // 点击下一题或完成提交
  await page.getByTestId('homework-next-task').click();
  if (i < totalTasks - 1) {
    await page.locator('button:has-text("Slot 1")').getByText('Empty').waitFor({ state: 'visible', timeout: 5000 });
    console.log(`[E2E] Switched to Task ${i + 2} successfully! Slot 1 reset to Empty.`);
  }
}

// 等待跳回 path 页
await page.locator('#homework-path').waitFor({ state: 'visible', timeout: 15000 });
console.log('[E2E] Answering loops completed and returned back to homework pathway!');

await browser.close();

// ─── 校验后端数据库落库与统一上传 ───
console.log('[E2E] Starting backend verification...');

const checkRes = await fetch(`${BACKEND}/api/v1/homework-submissions?studentId=student-1&assignmentNodeId=${assignmentNodeId}`, {
  headers: { Authorization: 'Bearer student-1' }
});
const latestSub = (await checkRes.json()).data;
if (!latestSub || latestSub.status !== 'submitted') {
  throw new Error(`Submission failed or status is not submitted: ${JSON.stringify(latestSub)}`);
}
console.log('[E2E] Backend submission status successfully verified: SUBMITTED!');

const recordsRes = await fetch(`${BACKEND}/api/v1/learning-records?courseId=${selectedCourse.id}&context=homework`, {
  headers: { Authorization: 'Bearer student-1' }
});
const records = (await recordsRes.json()).data || [];
if (records.length < totalTasks) {
  throw new Error(`Expected at least ${totalTasks} completed learning records, found ${records.length}`);
}
console.log(`[E2E] Backend learning records verified successfully: ${records.length} items logged!`);

console.log('homework recording confirm regression passed');
