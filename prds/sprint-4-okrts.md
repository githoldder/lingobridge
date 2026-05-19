# Sprint 4 OKRTS：真实数据落库、课件批注稳定与课程闭环

> 日期：2026-05-19  
> 状态：待启动  
> 输入：Sprint 4 技术评审、当前 `prd.md/prd.json`、代码扫描结果。

## Objective

把 LingoBridge 从“JSON demo 可演示”推进到“老师创建的课程、课件、作业、Live Class 能真实同步到学生端，并可由 Admin 退出和核查”的 MVP 闭环。

## Key Results

| KR | 指标 | 验收口径 |
|---|---|---|
| KR1 | Postgres 数据边界完成 | schema 覆盖账号、课程、学生、课件、作业、live、学习记录、索引和约束 |
| KR2 | 教师课程编辑闭环 | 老师创建/修改课程，可模糊搜索真实学生、批量加入、设定 live 时间 |
| KR3 | 学生端真实同步 | 学生只看到自己加入的课程、课时、作业、live，不再依赖固定 `course-1` |
| KR4 | PDF.js 课件稳定 | PDF 可翻页、可批注、可打印导出，画笔不破坏 PDF canvas |
| KR5 | Live 翻页唯一可信 | 教师端只有一个主翻页状态；学生默认跟随 live session current page |
| KR6 | 作业双模式上线 | Excel 导入和手动表单都能生成同一类 learning tasks |
| KR7 | Admin 可退出可核查 | Admin 页面有 logout，并能查看用户、资源、作业、live、学习进度 |

## Task Breakdown

### O1：Postgres Schema 与数据访问层

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T01 | 新增 Postgres docker service | `docker/docker-compose.yml` 包含 postgres、healthcheck、init schema | done |
| S4-T02 | 定义业务 schema | `backend/db/init/001_lingobridge_schema.sql` 覆盖实体、关系、约束、索引 | done |
| S4-T03 | 引入数据库连接层 | `DATABASE_URL`、连接池、健康检查、事务 helper | done |
| S4-T04 | Repository 抽象 | users/courses/lessons/assignments/live files repositories（结构完成，handler 接线在 S4-T07~T11） | done_with_followup |
| S4-T05 | Seed 迁移 | admin/teacher/students/demo course 从 JSON seed 迁入 Postgres seed | done |
| S4-T06 | JSON DB 兼容策略 | 模式框架与双模启动完成；handler 接线在 S4-T07~T11 逐步收口至 repository | done_with_followup |

### O2：账号、课程、学生关系

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T07 | 登录注册接入 Postgres | users/sessions/password_hash/token_hash 生效；仅 dev 环境允许明文密码，NODE_ENV=production 时强制拒绝明文读写（抛异常） | done_with_followup |
| S4-T08 | 教师学生关系落库 | `teacher_student_links` 作为默认学生池 | done_with_followup |
| S4-T09 | 学生模糊搜索 | 按姓名、username、email、student_no 搜索真实学生 | done_with_followup |
| S4-T10 | 课程成员 CRUD | `course_members` 支持批量加入、移除、去重 | done_with_followup |
| S4-T11 | 课程编辑保存 | title/description/status/starts_at/ends_at patch 到 DB | done_with_followup |

### O3：课程编辑页功能闭环

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T12 | 优化教师课程编辑 UI | 信息、学生、课件、作业、live 时间模块减少混乱状态 | todo |
| S4-T13 | 上传课件绑定课时 | PDF/PPTX 写入 files/courseware_files/lesson_node_id | todo |
| S4-T14 | 上传作业绑定作业节点 | Excel 导入写入 assignment_imports/learning_tasks | todo |
| S4-T15 | 下载作业表格 | 教师可导出当前 assignment tasks 为 xlsx | todo |
| S4-T16 | 设定 live 时间 | lesson_nodes starts_at/ends_at + live session scheduled 状态 | todo |

### O4：学生端真实数据

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T17 | 移除学生端静态 schedule | `ScheduleView` 改为读取学生 course/live 数据 | todo |
| S4-T18 | 移除固定 `course-1` fallback | `entryResolver`、homework、recordings 入口必须带 courseId/lessonNodeId | todo |
| S4-T19 | 学生课程列表过滤 | 只显示 `course_members` 中该学生加入的课程 | todo |
| S4-T20 | 学生 live 入口 | 从 active/scheduled live session 进入共享课堂 | todo |
| S4-T21 | 学生作业入口 | 根据 assignment_node 读取任务和学习记录 | todo |

### O5：PDF.js 与批注专项

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T22 | 抽离 PDF stage | `PdfViewer` 只负责 PDF 渲染、worker、cache、page count | todo |
| S4-T23 | 建立 annotation model | text/ink/shape/highlight 数据结构与坐标系统 | todo |
| S4-T24 | Konva annotation layer Spike | 文字、画笔、高亮分层渲染，不污染 PDF canvas | todo |
| S4-T25 | 批注存储接口 | 保存/读取 lessonNode + courseware + page annotations | todo |
| S4-T26 | 打印导出 | 浏览器 print/download 输出课件页 + 批注视图 | todo |
| S4-T27 | PDF 回归测试 | PDF 翻页、画笔、清除、打印视图 smoke | todo |

### O6：PPTX 策略 Spike

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T28 | `pptx.js` 翻页验证 | 文本 + 图片 PPTX 样例可按 slide index 展示 | todo |
| S4-T29 | PPTX 转 PDF/图片评估 | 服务端转换方案与保真度报告 | todo |
| S4-T30 | Microsoft 365 Embed 决策备忘 | 账号、OneDrive、iframe、权限、隐私、学校网络成本评估 | todo |
| S4-T31 | PPTX MVP 决策 | 选择 `pptx.js` 预览、转 PDF、或延后 Embed | todo |

### O7：Live Class 翻页与同步

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T32 | 合并翻页 UI | 删除设置面板内重复分页，保留底部主控制或反向选择 | todo |
| S4-T33 | 教师翻页写 live state | `PATCH /live-sessions/:id currentPage` 成为唯一真实页码 | todo |
| S4-T34 | 学生跟随页码 | 学生轮询/SSE/WebSocket 读取 live currentPage，不本地越界翻页 | todo |
| S4-T35 | PDF 页数边界修复 | pageCount 未加载时禁用下一页，不允许翻到 999 | todo |

### O8：Excel 作业双模式

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T36 | 统一作业 row schema | Excel 和手动表单共享 validator | todo |
| S4-T37 | Excel 导入预览 | 上传后展示错误行、可确认发布 | todo |
| S4-T38 | 手动表单 UI | Handsontable 或简化表格录入 zh/pinyin/translation/taskType | todo |
| S4-T39 | 手动创建接口 | `POST /assignments/manual` 生成 assignment_import + tasks | todo |
| S4-T40 | 学生作业创建验证 | 两种模式发布后学生端均可见并可保存记录 | todo |

### O9：Admin UI 和验收

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S4-T41 | Admin 顶栏优化 | 当前用户、刷新、logout、模块导航更清晰 | todo |
| S4-T42 | Admin 账号模块 | 用户搜索、新增、禁用、删除接入真实 DB | todo |
| S4-T43 | Admin 资源模块 | PDF/PPTX/XLSX/录音/录播可查 | todo |
| S4-T44 | Admin 学习进度模块 | course/student/lesson 维度查询 | todo |
| S4-T45 | E2E 三角色回归 | admin logout、teacher create course、student see course | todo |

## Execution Order

1. S4-T01 到 S4-T06：先完成 Postgres 和 repository 轨道。
2. S4-T07 到 S4-T21：先打通真实账户、课程、学生端可见性。
3. S4-T32 到 S4-T35：修 Live Class 翻页，避免继续叠加重复控制。
4. S4-T22 到 S4-T27：集中突破 PDF.js 和批注。
5. S4-T36 到 S4-T40：作业双模式收敛到统一任务模型。
6. S4-T41 到 S4-T45：Admin 和 E2E 收尾验收。

## S4-T07~T11 Handler 迁移路线图（最小风险）

> 原则：每次只改一个 endpoint，改完跑 `npm run backend:test` + `curl` 回归，再进入下一个。

### Step 1：S4-T07 — Auth endpoints（2 个 handler）
**影响范围**：`POST /auth/login`、`POST /auth/register`
**迁移动作**：
- `login`：用 `users.findByUsername()` + `users.verifyPassword()` 替换 `readDb().users.find()`
- `register`：用 `users.create()` 替换 `readDb()/writeDb()` 手动 push
**回归**：
  1. `curl -X POST /api/v1/auth/login` 用 seed 账号验证登录
  2. `curl -X POST /api/v1/auth/register` 注册新账号，再登录验证
  3. `NODE_ENV=production` 启动，确认注册/登录抛异常（明文保护生效）

### Step 2：S4-T08 + S4-T09 — 学生搜索（2 个 handler）
**影响范围**：`GET /students/search`
**迁移动作**：
- 用 `users.search()` 替换 `readDb().users.filter()`
- 保留 `teacherStudentLinks` 的 JSON 读取（S4-T08 再迁移）
**回归**：
  1. 按 username/displayName 搜索，结果与之前一致

### Step 3：S4-T10 — 课程成员 CRUD（4 个 handler）
**影响范围**：`GET /courses/:id/members`、`POST /courses/:id/members`、`POST /courses/:id/members/batch`、`DELETE /courses/:id/members/:memberId`
**迁移动作**：
- 用 `courses.findMembers()` / `courses.addMember()` / `courses.removeMember()` 替换
- 读取用户信息时混用 `users.findById()`（已迁移）+ JSON users 表（过渡态可接受）
**回归**：
  1. 创建课程 → 搜索学生 → 批量加入 → 查看成员列表 → 移除成员

### Step 4：S4-T11 — 课程编辑（2 个 handler）
**影响范围**：`GET /courses`、`POST /courses`、`PATCH /courses/:id`
**迁移动作**：
- 用 `courses.findByTeacherId()` / `courses.create()` / `courses.update()` 替换
- `GET /courses` 列表的 pagesCount/exercisesCount/recordingsCount 暂保留 JSON 聚合（后续 T18 再改）
**回归**：
  1. 创建课程 → 修改 title/description → 验证列表更新

### Step 5：收尾 — 剩余 readDb/writeDb 调用
**影响范围**：coursewares、exercises、homework、recordings、lectures、lesson-nodes、live-sessions、admin routes
**策略**：按 S4-T12~T14 任务顺序逐个迁移，每步同上述回归模式。

### 风险缓解
| 风险 | 缓解 |
|---|---|
| 迁移中 JSON 与 Postgres 数据不一致 | `DB_MODE=json` 时 repository 自动走 JSON 路径，双模同源 |
| 某个 handler 改坏 | 每次只改 1-2 个 handler，git commit 粒度小，可 revert |
| 明文密码遗漏 | `NODE_ENV=production` 时 repository 层直接抛异常，阻断上线 |

## Definition Of Done

- `docker compose` 能启动 Postgres，schema 初始化无错误。
- `npm run lint`、`npm run build`、`npm run backend:test` 通过。
- 老师创建课程后，添加真实学生，学生登录后能看到该课程。
- 老师设定 live 时间、上传 PDF、上传或手动作业后，学生端能进入对应课时。
- PDF 翻页、批注、打印导出 smoke 通过。
- Admin 能从 `/admin` 页面退出登录。
