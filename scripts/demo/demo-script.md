# LingoBridge 上台演示流程 (Sprint 6 Prelaunch)

> 时长约 5-8 分钟。角色：演示者 (Presenter), 观众 (Audience)
> 假定服务已在本地运行 (`npm run dev` + `npm run backend:dev`)

---

## 0. 事前准备 (Pre-flight)

```bash
# 确认服务运行
curl -s http://127.0.0.1:3001/api/v1/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"Test@123456"}' | jq .

# 确认前端可访问
open http://localhost:3000

# 确认 ASR Demo 页
open "http://localhost:3000/?demo=asr"
```

---

## 1. 开场 (30s)

> **Presenter**: "大家好！欢迎来到 LingoBridge 的产品演示。LingoBridge 是一个专为俄语和哈萨克语使用者设计的中文学习平台。今天我将为大家展示从学生、老师到管理员的核心流程，以及我们的 ASR 语音识别和翻译 Demo。"

- 浏览器显示 Landing Page (`http://localhost:3000`)
- 展示: 教学法、课程宣传、语音识别展示、"明天见" 录音动画
- **截图**: `scripts/demo/screenshots/01-landing.png`

---

## 2. 学生端 (1.5min)

> **Presenter**: "我们先切换到学生视角。"

1. 点击 "登录" → 进入 Login 页面
   - 默认预填: student_a@test.com / Test@123456

2. 点击登录 → 进入学生 Dashboard
   - **截图**: `scripts/demo/screenshots/02-student-dashboard.png`
   - 展示: 学习天数 (28天), 积分 (2,860), 继续学习按钮

3. 点击 "查看日程" → ScheduleView
   - 展示课程安排、课时节点

4. 点击 "作业" → HomeworkView
   - 展示待完成作业列表

5. 点击 "词汇" → VocabularyView
   - 展示已学词汇

> **Presenter**: "学生可以看到学习进度、日程、作业和词汇，所有界面都已中文本地化。"

---

## 3. 老师端 (1.5min)

> **Presenter**: "现在切换到老师视角。"

1. 退出 → 用 teacher@test.com / Test@123456 登录
   - **截图**: `scripts/demo/screenshots/03-teacher-dashboard.png`
   - 展示: 王老师, 教学概况 (课程+12%, 124 学生, +2)

2. 点击 "课程" → TeacherCoursesView
   - 展示课程列表

3. 点击课程 → TeacherCourseDetailView
   - 展示课时节点

4. 点击 "学生" → TeacherStudentsView
   - 展示学生列表和管理

5. 点击 "报告" → TeacherReportsView
   - 展示学习报告

> **Presenter**: "老师可以管理课程、学生，查看学习报告。"

---

## 4. 管理员端 (1.5min)

> **Presenter**: "最后是管理后台。"

1. 退出 → 用 admin@test.com / Test@123456 登录
   - **截图**: `scripts/demo/screenshots/04-admin-dashboard.png`
   - 展示: 管理后台, 直播管理, 录播记录, 弹幕笔记, 翻译字幕, 课件管理, Excel 导入, 学习进度

2. 点击各个 Tab:
   - 课件管理: 展示已上传的课件
   - 学习进度: 展示各学生的学习进度
   - 用户管理: 展示/管理用户

> **Presenter**: "管理后台支持用户管理、课件管理、学习进度追踪等功能。"

---

## 5. ASR + 翻译 Demo (2min)

> **Presenter**: "最后，让我展示我们的 ASR 语音识别和实时翻译演示功能。"

1. 打开 ASR Demo: 在地址栏输入 `http://localhost:3000/?demo=asr`
   - **截图**: `scripts/demo/screenshots/05-asr-demo-start.png`

2. 选择 Scenario: "自我介绍"
   - 目标语言: Русский

3. 点击 "▶ Start Demo"
   - 浏览器 TTS 播放中文句子
   - ASR 文本逐字出现 (模拟)
   - 翻译在句子完成后显示
   - **截图**: `scripts/demo/screenshots/06-asr-demo-running.png`

4. 切换到 "日常用语" 场景
   - 目标语言: Қазақша
   - **截图**: `scripts/demo/screenshots/07-asr-demo-kk.png`

5. 展示 Transcript 区域 — 显示完整的对话日志

> **Presenter**: "ASR Demo 展示了语音识别 + 实时翻译的完整流程。当前使用浏览器 TTS 模拟语音输入，未来可接入腾讯云 ASR 或 Azure Speech 实现真实语音识别。翻译支持俄语、哈萨克语和英语。"

---

## 6. 结尾 (30s)

> **Presenter**: "以上就是 LingoBridge 的核心功能演示。感谢大家的观看！有任何问题欢迎交流。"

---

## 截图清单

| # | 文件名 | 内容 |
|---|--------|------|
| 1 | `scripts/demo/screenshots/01-landing.png` | Landing Page |
| 2 | `scripts/demo/screenshots/02-student-dashboard.png` | 学生 Dashboard |
| 3 | `scripts/demo/screenshots/03-teacher-dashboard.png` | 老师 Dashboard |
| 4 | `scripts/demo/screenshots/04-admin-dashboard.png` | 管理后台 |
| 5 | `scripts/demo/screenshots/05-asr-demo-start.png` | ASR Demo 初始状态 |
| 6 | `scripts/demo/screenshots/06-asr-demo-running.png` | ASR Demo 运行中 (RU) |
| 7 | `scripts/demo/screenshots/07-asr-demo-kk.png` | ASR Demo 运行中 (KK) |

## 回滚步骤

如果部署后发现问题:

```bash
# 前端回滚 - 用上一个构建覆盖
coscli sync ./dist_previous/ cos://lingobridge-demo/ -r

# 代码回滚
git log --oneline -5
git revert HEAD  # 或 git reset --hard <previous-tag>

# 重新构建部署
./scripts/deploy.sh cos lingobridge-demo ap-guangzhou
```
