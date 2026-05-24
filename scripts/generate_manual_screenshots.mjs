import { chromium } from 'playwright';
import fsSync from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { execSync } from 'child_process';

const BASE_URL = 'http://127.0.0.1:3000';
const BACKEND = 'http://127.0.0.1:3001';
const ATTACHMENTS_DIR = '/Users/caolei/Desktop/Obsidian_root/011_项目经验/互联网+/lingobridge/Records&Drafts/attachments';
const STUDENT_HOMEWORK_SCREENSHOTS = [
  '11-01-student-dashboard-homework-card.png',
  '11-02-student-schedule-homework.png',
  '11-03-student-homework-pathway.png',
  '11-04-student-homework-modal.png',
  '11-05-student-homework-3slot.png',
  '11-06-student-homework-completed-path.png',
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForVisible(locator, label, timeout = 15000) {
  await locator.waitFor({ state: 'visible', timeout }).catch((error) => {
    throw new Error(`Timed out waiting for ${label}: ${error.message}`);
  });
  return locator;
}

async function screenshotLocatorOrPage(page, locator, filename, label) {
  const targetPath = path.join(ATTACHMENTS_DIR, filename);
  try {
    await waitForVisible(locator, label, 8000);
    await locator.screenshot({ path: targetPath });
  } catch (error) {
    console.warn(`[Shot] ${label} element capture failed, falling back to full page:`, error.message);
    await page.screenshot({ path: targetPath, fullPage: true });
  }
  console.log(`Captured ${filename}`);
}

async function captureFullPage(page, filename) {
  await page.screenshot({ path: path.join(ATTACHMENTS_DIR, filename), fullPage: true });
  console.log(`Captured ${filename}`);
}

async function login(page, email, password = 'Test@123456') {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.click('text=登录');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

async function recordThreeSlots(page) {
  for (let slot = 0; slot < 3; slot++) {
    await page.getByTestId('homework-record-button').click();
    await delay(700);
    await page.getByTestId('homework-stop-button').click();
    await waitForVisible(page.getByTestId('homework-confirm-recording'), `slot ${slot + 1} confirm button`, 5000);
    await page.getByTestId('homework-confirm-recording').click();
    await waitForVisible(page.getByTestId('homework-ai-analysis'), `slot ${slot + 1} AI analysis`, 5000);
    await delay(350);
  }
}

function normalizeHomeworkWorkbook(sourcePath) {
  const workbook = XLSX.readFile(sourcePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  const normalizedRows = rows.map((row, index) => {
    const unit = row.unit || 1;
    const lesson = row.lesson || 1;
    return {
      course_code: row.course_code || 'LB-TONES-DEMO',
      unit,
      lesson,
      lesson_title: row.lesson_title || '中文声调自测作业',
      task_id: row.task_id || `LB-TONES-U${unit}-L${lesson}-${String(index + 1).padStart(3, '0')}`,
      task_type: row.task_type || 'pronunciation',
      zh_text: row.zh_text,
      pinyin: row.pinyin,
      translation_ru: row.translation_ru,
      translation_kk: row.translation_kk,
      prompt: row.prompt,
      answer: row.answer,
      initial: row.initial,
      final: row.final,
      tone: row.tone,
      rhyme_group: row.rhyme_group,
      difficulty: row.difficulty || 1,
      due_at: row.due_at,
      publish_to_homework: row.publish_to_homework === '' ? true : row.publish_to_homework,
      publish_to_vocab: row.publish_to_vocab === '' ? false : row.publish_to_vocab,
      sort_order: row.sort_order || index + 1,
    };
  });
  const nextWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(nextWorkbook, XLSX.utils.json_to_sheet(normalizedRows), 'Sheet1');
  const normalizedPath = path.join('/tmp', 'lingobridge-homework_unit1_2-normalized.xlsx');
  XLSX.writeFile(nextWorkbook, normalizedPath);
  return normalizedPath;
}

// 确保附件目录存在
if (!fsSync.existsSync(ATTACHMENTS_DIR)) {
  fsSync.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

async function prepareDatabaseAndImportHomework() {
  console.log('[Prep] Resetting database sandbox to guarantee clean state...');
  const dbPath = 'backend/data/db.json';
  if (fsSync.existsSync(dbPath)) {
    try {
      const db = JSON.parse(fsSync.readFileSync(dbPath, 'utf8'));
      db.learningRecords = [];
      db.homeworkSubmissions = [];
      db.recordings = [];
      db.learningTasks = [];
      db.vocabularyItems = [];
      // 保留默认课程及账号
      db.lessonNodes = db.lessonNodes.filter(n => n.id === 'lesson-node-1');
      db.assignmentNodes = db.assignmentNodes.filter(n => n.id === 'assignment-node-1');
      db.files = [];
      db.coursewareFiles = [];
      db.homeworkImports = [];
      db.liveClassStudents = [];
      fsSync.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      console.log('[Prep] Database sandbox cleaned.');

      // PM2 后端在长跑演示中可能保留旧状态；重启后再导入，保证每轮截图都是干净路径。
      execSync('pm2 restart lingobridge-backend', { stdio: 'inherit' });
      console.log('[Prep] Backend PM2 service restarted.');
      await delay(2000);
    } catch (err) {
      console.warn('[Prep] Reset failed:', err);
    }
  }

  // 轮询健康检查
  let healthOk = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BACKEND}/api/v1/health`);
      if (res.ok) {
        healthOk = true;
        console.log('[Prep] Backend is fully online and healthy!');
        break;
      }
    } catch {
      await delay(500);
    }
  }
  if (!healthOk) throw new Error('[Prep] Health check timeout.');

  // 创建四节连续课时，第四课绑定真实 Excel 作业，保证地铁大路有完整的课程序列。
  console.log('[Prep] Creating sorted lesson nodes and binding sample Excel assignment...');
  const courseId = 'course-1'; // Default seeded demo course

  const now = new Date();
  const makeStartsAt = (offsetDays, hour = 9) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  for (const node of [
    { title: '第二课：家庭成员复习', startsAt: makeStartsAt(-2) },
    { title: '第三课：自我介绍巩固', startsAt: makeStartsAt(-1) },
  ]) {
    const res = await fetch(`${BACKEND}/api/v1/courses/${courseId}/lesson-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
      body: JSON.stringify(node)
    });
    const json = await res.json();
    if (!json.data) throw new Error(`Failed to create filler lesson node: ${node.title}`);
  }

  const lessonRes = await fetch(`${BACKEND}/api/v1/courses/${courseId}/lesson-nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
    body: JSON.stringify({
      title: '第四课：中文声调自测作业',
      startsAt: makeStartsAt(0, 19),
      endsAt: makeStartsAt(0, 20),
      assignmentTitle: '中文声调自测作业'
    })
  });
  const lessonJson = await lessonRes.json();
  if (!lessonJson.data) throw new Error('Failed to create lesson node');

  const lessonNodeId = lessonJson.data.lessonNode.id;
  const assignmentNodeId = lessonJson.data.assignmentNode.id;
  
  const filename = 'homework_unit1_2.xlsx';
  const sourceXlsxPath = path.join('samples', filename);
  const xlsxPath = normalizeHomeworkWorkbook(sourceXlsxPath);
  const base64 = fsSync.readFileSync(xlsxPath).toString('base64');
  
  const importRes = await fetch(`${BACKEND}/api/v1/assignments/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer teacher-1' },
    body: JSON.stringify({
      courseId,
      lessonNodeId,
      assignmentNodeId,
      filename,
      base64
    })
  });
  const importJson = await importRes.json();
  if (!importJson.data) throw new Error(`Excel import failed: ${JSON.stringify(importJson)}`);
  console.log(`[Prep] Excel assignment imported successfully from ${sourceXlsxPath} via normalized temp workbook. Tasks count: ${importJson.data.tasksCount}`);

  return { courseId, lessonNodeId, assignmentNodeId };
}

async function run() {
  console.log('Starting Playwright manual screenshot generation...');
  
  // 1. 初始化测试数据环境
  const hwContext = await prepareDatabaseAndImportHomework();

  // Launch browser with camera & microphone permissions granted
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['microphone', 'camera'],
    deviceScaleFactor: 2, // Make screenshots high-DPI / ultra-crisp!
    locale: 'zh-CN'
  });

  const page = await context.newPage();
  
  try {
    // ----------------------------------------------------
    // Step 1: Landing Page
    // ----------------------------------------------------
    console.log('Navigating to landing page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await delay(1500);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '01-home-page.png') });
    console.log('Captured 01-home-page.png');

    // ----------------------------------------------------
    // Step 2: Login Page
    // ----------------------------------------------------
    console.log('Navigating to login page...');
    await page.click('text=登录');
    await page.waitForLoadState('networkidle');
    await delay(1000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '02-login-page.png') });
    console.log('Captured 02-login-page.png');

    // ----------------------------------------------------
    // Step 3: Admin Dashboard
    // ----------------------------------------------------
    console.log('Logging in as Admin...');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await delay(2000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '03-admin-dashboard.png') });
    console.log('Captured 03-admin-dashboard.png');

    // Logout Admin
    console.log('Logging out Admin...');
    await page.click('text=退出登录');
    await page.waitForLoadState('networkidle');
    await delay(1000);

    // ----------------------------------------------------
    // Step 4: Teacher Dashboard & Course List
    // ----------------------------------------------------
    console.log('Logging in as Teacher...');
    await page.click('text=登录');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await delay(2000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '04-teacher-dashboard.png') });
    console.log('Captured 04-teacher-dashboard.png');

    // ----------------------------------------------------
    // Step 5: Teacher Course Details (Info Tab)
    // ----------------------------------------------------
    console.log('Navigating to Course list tab...');
    await page.click('text=课程');
    await delay(1500);

    console.log('Entering a course details view...');
    await page.click('h3:has-text("自我介绍")');
    await page.waitForLoadState('networkidle');
    await delay(2500);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '05-teacher-course-detail.png') });
    console.log('Captured 05-teacher-course-detail.png');

    // ----------------------------------------------------
    // Step 6: Teacher Course Details (Courseware Tab)
    // ----------------------------------------------------
    console.log('Switching to Courseware tab...');
    await page.click('text=/上传课件|Courseware/');
    await delay(1000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '06-teacher-courseware.png') });
    console.log('Captured 06-teacher-courseware.png');

    // ----------------------------------------------------
    // Step 7: Teacher Course Details (Schedule Tab / Live Class)
    // ----------------------------------------------------
    console.log('Switching to Schedule / Live Class tab...');
    await page.click('text=/Live Class|Live Classes/');
    await delay(1000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '07-teacher-schedule.png') });
    console.log('Captured 07-teacher-schedule.png');

    // ----------------------------------------------------
    // Step 8: Teacher Live Classroom
    // ----------------------------------------------------
    console.log('Entering Teacher Live Classroom...');
    const enterLiveBtn = page.locator('text=/进入直播|Enter Live/').first();
    if (await enterLiveBtn.isVisible()) {
      await enterLiveBtn.click();
    } else {
      const createLiveBtn = page.locator('text=/创建直播|Create Live/').first();
      await createLiveBtn.click();
    }
    await page.waitForLoadState('networkidle');
    await delay(3000);
    
    // Draw some simple strokes on the whiteboard
    console.log('Drawing on teacher whiteboard...');
    await page.click('[data-testid="btn-settings"]');
    await delay(800);
    await page.click('[data-testid="btn-pen-toggle"]');
    await delay(500);
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();
      }
    }
    await delay(1000);
    await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '08-teacher-classroom.png') });
    console.log('Captured 08-teacher-classroom.png');

    // Keep classroom active in teacher page, and spin up a separate student page to test sync!
    console.log('Spinning up student page...');
    const studentContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      permissions: ['microphone', 'camera'],
      deviceScaleFactor: 2,
      locale: 'zh-CN'
    });
    
    // 模拟录音相关 Web Audio API
    await studentContext.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
        configurable: true
      });
      Object.defineProperty(window, 'MediaRecorder', {
        value: class MockRecorder {
          constructor() { this.state = 'inactive'; this.ondataavailable = null; this.onstop = null; }
          start() { this.state = 'recording'; }
          stop() {
            this.state = 'inactive';
            this.ondataavailable?.({ data: new Blob(['mock-audio'], { type: 'audio/webm' }) });
            this.onstop?.();
          }
        },
        configurable: true
      });
    });

    const studentPage = await studentContext.newPage();

    // ----------------------------------------------------
    // Step 9: Student Classroom Active & Synchronized
    // ----------------------------------------------------
    console.log('Student logging in...');
    await login(studentPage, 'student_a@test.com');
    await studentPage.evaluate(() => {
      localStorage.removeItem('lingobridge_hw_draft');
      localStorage.removeItem('lingobridge_hw_recording_slots_v1');
      sessionStorage.clear();
    });
    await delay(1500);

    // 今日作业预警大片截图 A
    console.log('Capturing Student Dashboard Homework Alert Card...');
    await screenshotLocatorOrPage(
      studentPage,
      studentPage.locator('#today-tasks .grid > div').nth(2),
      '11-01-student-dashboard-homework-card.png',
      'student dashboard homework alert card'
    );

    // 导航至 Schedule，截图 B
    console.log('Navigating to student Schedule calendar page...');
    await studentPage.click('#sidebar-item-schedule');
    const homeworkScheduleItem = studentPage.locator('h4:has-text("第四课：中文声调自测作业")')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"group")][1]');
    await waitForVisible(homeworkScheduleItem, 'today schedule homework lesson');
    await delay(800);
    await screenshotLocatorOrPage(
      studentPage,
      homeworkScheduleItem,
      '11-02-student-schedule-homework.png',
      'student schedule homework row'
    );

    // 进入直播大厅截图 10
    console.log('Entering student live sync room...');
    await studentPage.click('#sidebar-item-dashboard');
    await delay(1000);
    await studentPage.click('text=/进入课堂|Enter Classroom/');
    await studentPage.waitForLoadState('networkidle');
    await delay(3000);
    await studentPage.screenshot({ path: path.join(ATTACHMENTS_DIR, '10-student-classroom-active.png') });
    console.log('Captured 10-student-classroom-active.png');

    // 离开直播大厅
    console.log('Leaving student live sync room...');
    await studentPage.click('text=/离开课堂|Leave Classroom/');
    await delay(800);
    await studentPage.click('text=/离开课堂|Leave Classroom/');
    await delay(1500);
    await studentPage.reload({ waitUntil: 'domcontentloaded' });
    await waitForVisible(studentPage.locator('#dashboard-view'), 'fresh student dashboard after leaving classroom');
    await studentPage.evaluate(() => {
      localStorage.removeItem('lingobridge_courseId');
      localStorage.removeItem('lingobridge_lessonNodeId');
    });
    await delay(800);

    // ----------------------------------------------------
    // Step 11: Student Homework Pathway (Zero Focus Locator)
    // ----------------------------------------------------
    console.log('Navigating to homework pathway page...');
    // 我们先故意进入 Homework 且不带 navigationContext，以便截图干净完整的地铁通关大地图！
    await studentPage.click('#sidebar-item-homework');
    await studentPage.waitForLoadState('networkidle');
    await waitForVisible(studentPage.locator('#homework-path'), 'homework pathway');
    await waitForVisible(studentPage.locator('#homework-path button').filter({ hasText: '' }).nth(3), 'fourth pathway node', 15000).catch(() => {});
    await delay(1200);
    // 截图大路全景图截图 C
    await captureFullPage(studentPage, '11-03-student-homework-pathway.png');

    // 回到日程，通过“进入作业”携带 lessonNodeId 进入，触发 Focus Locator 自动弹出当前课时 Modal。
    console.log('Re-entering homework from schedule to trigger Focus Locator modal...');
    await studentPage.click('#sidebar-item-schedule');
    const focusScheduleItem = studentPage.locator('h4:has-text("第四课：中文声调自测作业")')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"group")][1]');
    await waitForVisible(focusScheduleItem, 'today schedule homework lesson');
    await focusScheduleItem
      .locator('button:has-text("进入作业"), button:has-text("Enter Homework")')
      .click();
    await waitForVisible(studentPage.locator('#homework-path .fixed h2:has-text("第四课：中文声调自测作业")').first(), 'focus locator homework modal');
    await delay(1000);
    // 截图高亮弹出的关卡 Modal 控制中枢截图 D
    await captureFullPage(studentPage, '11-04-student-homework-modal.png');

    // 进入第一个任务答题界面
    console.log('Entering speaking task workspace...');
    await studentPage.getByTestId('homework-enter-task').first().click();
    await studentPage.locator('#homework-task-view').waitFor({ state: 'visible', timeout: 5000 });
    await delay(1500);

    // 循环录制 3 卡槽自测并获取 AI 打分 (测试用 1 个任务即可)
    console.log('Executing 3-slot self-test voice recording sequence...');
    await recordThreeSlots(studentPage);
    
    // 截图 E (细节高亮图 3卡槽自测跟读，双重保存为原图以防老链接断裂)
    console.log('Capturing 3-slot details highlight dashboard card...');
    await captureFullPage(studentPage, '11-05-student-homework-3slot.png');
    await captureFullPage(studentPage, '11-student-homework.png');
    console.log('Captured 11-05-student-homework-3slot.png & 11-student-homework.png');

    // 补齐同一作业下剩余任务的三卡槽，最后提交并退回到大地图，截图 F (变绿通关大地图)。
    console.log('Completing remaining tasks so the lesson node can turn green...');
    let safety = 12;
    while (safety-- > 0) {
      const label = (await studentPage.getByTestId('homework-next-task').innerText()).trim();
      const isSubmit = label.includes('完成并提交') || label.includes('Submit');
      await studentPage.getByTestId('homework-next-task').click();
      if (isSubmit) break;
      await waitForVisible(studentPage.locator('#homework-task-view'), 'next homework task');
      await delay(500);
      await recordThreeSlots(studentPage);
    }
    await waitForVisible(studentPage.locator('#homework-path'), 'completed homework pathway', 15000);
    await delay(1800);
    await captureFullPage(studentPage, '11-06-student-homework-completed-path.png');

    // 关闭 student 页面
    await studentPage.close();
    await studentContext.close();

    try {
      // ----------------------------------------------------
      // Step 10: Student Wait Screen (Demo: end active session to capture wait screen)
      // ----------------------------------------------------
      console.log('Exiting teacher classroom & preparing optional wait/review screenshots...');
      await page.click('text=/离开课堂|Leave Classroom/', { timeout: 8000 });
      await delay(1000);
      await page.click('text=/结束课程|End Class|End Course/', { timeout: 8000 });
      await delay(1500);

      // 教师端：导航至 Students 标签，打开刚刚学生提交的作业批阅 Modal 12
      console.log('Teacher checking student progress modal...');
      await page.click('text=课程');
      await delay(1000);
      const teacherCourseCard = page.locator('h3').filter({ hasText: /自我介绍|中文声调|第四课/ }).first();
      await teacherCourseCard.click({ timeout: 8000 });
      await delay(1500);
      await page.click('text=/入会学生|Students/');
      await delay(1000);
      await page.click('text=检查进度与作业', { timeout: 8000 });
      await delay(2000);
      await page.screenshot({ path: path.join(ATTACHMENTS_DIR, '12-teacher-check-homework-modal.png') });
      console.log('Captured 12-teacher-check-homework-modal.png');
      await page.click('button:has-text("✕")', { timeout: 8000 });
      await delay(1000);

      // 开辟无感轮询等待雷达大厅截图 09
      const waitContext = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
        locale: 'zh-CN'
      });
      const waitPage = await waitContext.newPage();
      await login(waitPage, 'student_a@test.com');
      await delay(1500);

      await waitPage.click('text=/进入课堂|Enter Classroom/');
      await delay(2000);
      await waitPage.screenshot({ path: path.join(ATTACHMENTS_DIR, '09-student-wait-classroom.png') });
      console.log('Captured 09-student-wait-classroom.png');

      await waitPage.close();
      await waitContext.close();
    } catch (optionalError) {
      console.warn('[Optional screenshots] 09/12 capture skipped:', optionalError.message);
    }

    console.log('All manual and workflow screenshots captured successfully!');
  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

run();
