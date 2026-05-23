## 1. 问题诊断

当前问题不是单个 UI bug，而是数据来源和业务边界没有完全收敛：

1. 用户身份仍混入 mock 展示，例如学生默认显示 Anna。所有用户信息必须来自登录态或游客态，不允许页面组件自带默认学生身份。
2. 落地页可直接进入产品功能，但没有统一权限门禁。游客可以预览有限功能，点击受保护动作时必须提示“想要解锁其他功能，请进行注册登录”。
3. 教师上传的作业单词能同步，但 live、课时、作业节点的关系不清。产品规则应固定为：一个 live 对应一个课时；一个课时对应一个作业节点；二者一对一。
4. 学生学习记录会在跳转后恢复未完成状态，说明完成状态、录音、学习记录的写入或读取没有统一以 `studentId + lessonNodeId + taskId` 为准。
5. 学生端 live 不应出现“作业映射到 live”“单词映射到 live”这类教师配置按钮。学生只消费课堂内容、评论、获授权的麦克风/摄像头和当前课时练习入口。
6. 教师端仍暴露 i18n key，例如 `classroom.content_mode`、`classroom.stopped`，说明渲染层没有统一经过 `t(key)` 或缺少兜底检查。
7. PDF 渲染卡顿且体验不稳定，需要把课件渲染作为独立边界处理：上传、转换/缓存、分页渲染、课堂播放分开。
8. 画笔不是教学批注所需的圆珠笔效果。应使用清晰连续线条，支持粗细调节。
9. 清除笔迹与 `classroom.canvas_inactive` 交互重复。关闭画笔模式不应清空笔迹；只有“清除笔迹”才清空当前页或当前课时的批注。
10. 教师点击课程卡片缺少编辑/管理页，需要把课程信息、学生、课件、时间、作业、live 课时管理统一起来。
11. 缺少管理端后台，无法统一管理老师、学生、课件、Excel 作业、live、录播、note 弹幕、翻译字幕、schedule、学习进度。
12. Admin 是独立后台，不是学生端或教师端的变体。admin 登录后必须直接进入后台，后台用于查看和维护后端服务、文件/多媒体存储、账号、作业、学习记录、学习进度和资源状态。
13. 游客点击完整功能后跳转登录，但登录页仍弹“解锁完整功能”，说明门禁状态没有在导航到 login/register 时清理，可能存在重复路由守卫或弹窗状态未重置。
14. 当前注册/登录仍偏 demo token 思路，缺少明确数据库 schema、唯一约束、密码存储策略和 session/token 表设计。必须先设计 schema，再写注册登录业务代码。
15. 教师与学生关系没有体现班级/Live Class 的实际管理方式。测试老师应默认绑定一批学生；添加学生不能只靠邮箱，必须支持用户名/姓名模糊搜索、选择默认班级学生。
16. 教师创建课程后，学生端课程列表未同步，说明课程创建与班级成员/学生可见性关系缺失。
17. Live Class 是核心教学容器：一个老师有多个 Live Class；一个 Live Class 可包含多个学生；一个 Live Class 可上传多个课件和多个 homework；课件只属于某一个 Live Class。
18. PDF 课件上传后无法查看，PDF.js worker/资源 URL/后端静态文件路径必须专项修复。
19. Live Class 画笔一画就白屏，说明 canvas/PDF 渲染状态耦合存在崩溃风险，必须加回归测试。

## 2. 产品边界

LingoBridge 当前阶段是中文学习 MVP，不扩展成完整 LMS。v4.0 只做关键闭环：

```text
登录/游客态
-> 教师创建课程
-> 教师上传 PDF/PPTX 课件和 Excel 作业
-> 教师为课程创建 live 课时
-> 系统生成一个课时作业节点
-> 学生进入课程/直播/作业
-> 学生录音、完成单词/作业
-> 学习记录持久化
-> 管理端可查看和维护账号、课件、作业、live、记录
```

不做：在线 PPT 编辑、复杂多租户、支付、完整 AI 评分、社交社区、实时多人白板协同。

## 3. 核心业务规则

| 编号 | 规则 | 验收标准 |
|---|---|---|
| R1 | 页面不得硬编码 Anna 等 mock 身份 | 学生名来自 `/users/me`；游客显示游客态 |
| R2 | 游客只有部分功能开放 | 受保护按钮统一弹出注册登录提示 |
| R3 | 一个 live = 一个课时 = 一个作业节点 | `liveSession.lessonNodeId` 必填且唯一 |
| R4 | 学习记录必须持久化 | 页面跳转、刷新后完成状态不回退 |
| R5 | 学生端 live 不显示教师配置按钮 | 作业/单词映射按钮仅教师课程编辑页可见 |
| R6 | 教师端 visible text 必须 i18n 渲染 | 不再出现 `classroom.*` 原始 key |
| R7 | PDF/PPTX 上传与课堂渲染解耦 | 课堂使用已缓存的 PDF/page 资源 |
| R8 | 画笔模式只控制是否可书写 | 关闭画笔不清空笔迹，清除按钮才清除 |
| R9 | 课程卡片进入课程编辑页 | 课程、学生、课件、时间、作业、live 统一管理 |
| R10 | 管理端只做运营维护 | 管理账号、资源、记录，不进入复杂教学设计 |
| R11 | 班级是老师-学生绑定核心 | 老师带多个班，班级绑定学生，课程从班级继承学生可见性 |
| R12 | 每门课有固定 classroom | 课时即 live，非上课时间学生进入为空教室/等待态 |
| R13 | 课时可选择默认 PDF | live classroom 默认打开当前课时默认 PDF 课件 |
| R14 | 每题录音保留 3 个槽位 | 切题只显示当前题录音，提交前为草稿缓存 |
| R15 | 作业有确认提交边界 | 最后一题后确认提交，提交后教师端可见 |
| R16 | 单词掌握度三段增长并会遗忘 | 每次完整学习 +1/3，三次掌握，一周不复习衰减 |
| R17 | 课时/live/schedule 同步到课程学生 | 添加学生或创建课时后学生端出现提醒和入口 |
| R18 | live 学生面板显示真实入会状态 | Students 面板来自 attendance/participants API |
| R19 | annotation 支持教学级工具 | 箭头、橡皮擦、页面内文本框、调色和取色 |

## 4. 模块边界

### 4.1 身份、注册登录与权限

前端只认四种状态：`guest`、`student`、`teacher`、`admin`。Admin 是独立后台角色，不能落到学生 dashboard。用户信息来自 auth API，不从组件默认值读取。

后端必须先补齐数据库 schema，再实现注册登录：

| 表 | 关键字段 | 说明 |
|---|---|---|
| `users` | `id, username, email, passwordHash, role, displayName, languagePref, status, createdAt, updatedAt` | 账号主表 |
| `sessions` | `id, userId, tokenHash, expiresAt, createdAt, revokedAt` | 登录会话或 token 管理 |
| `teacher_profiles` | `userId, title, department` | 老师资料 |
| `student_profiles` | `userId, studentNo, className, nationality, nativeLanguage` | 学生资料 |
| `teacher_student_links` | `id, teacherId, studentId, status, createdAt` | 老师与学生一对多管理 |

关键接口：

| 接口 | 用途 |
|---|---|
| `POST /api/v1/auth/login` | 登录并返回用户角色 |
| `GET /api/v1/users/me` | 当前用户信息 |
| `POST /api/v1/auth/register` | 注册学生/教师账号，MVP 可先做学生注册 |

门禁规则：

- 导航到 `login` / `register` 时必须关闭 `GuestGate`，避免“登录页又弹解锁完整功能”。
- 登录成功后按角色跳转：`admin -> /admin`，`teacher -> teacher-dashboard`，`student -> dashboard`。
- 非 admin 访问后台，前端拒绝且后端 `requireAdmin` 返回 403。

游客门禁规则：

- 可看落地页、课程介绍、部分 demo 预览。
- 点击录音、提交作业、进入 live、查看学习记录、课程管理、后台管理时，弹出注册登录提示。

### 4.2 Teacher、Live Class、学生、课件、homework 的关系

统一关系：

```text
teacher
  -> liveClass[]                    # 一个老师多个教学班/课堂
      <-> student[]                 # 一个 Live Class 多个学生；学生也可加入多个 Live Class
      -> coursewareFile[]           # 一个 Live Class 多个课件；课件只属于一个 Live Class
      -> homeworkImport[]           # 一个 Live Class 可上传多个 homework Excel
      -> learningTask[]             # Excel 导入后的任务
      -> liveSession[]              # 可多次开课/录播
```

关键实体：

| 实体 | 关键字段 |
|---|---|
| `course` | `id, teacherId, title, description, status` |
| `live_class` / `lesson_node` | `id, teacherId, courseId, title, startsAt, styleSeed, colorToken, shapeToken, status` |
| `live_class_student` | `id, liveClassId, studentId, status, joinedAt` |
| `live_session` | `id, courseId, liveClassId, teacherId, status, currentPage, recordingStatus` |
| `courseware_file` | `id, liveClassId, courseId, type, filename, storageUrl, renderStatus, pageCount` |
| `homework_import` | `id, liveClassId, courseId, filename, tasksCount, vocabCount, errors, createdAt` |
| `learning_task` | `id, liveClassId, sourceFileId, taskType, zhText, pinyin, translationRu, translationKk` |
| `learning_record` | `id, studentId, lessonNodeId, taskId, status, attemptsCount, lastRecordingId` |

节点颜色与样式：

- 每个 `lesson_node` 创建时生成 `styleSeed`。
- 前端根据 `styleSeed` 稳定映射颜色和节点样式。
- “随机”只发生在创建课时节点时；之后刷新不变化。
- 节点内容以教师上传录音和 Excel 单词/作业同步结果为准。

### 4.3 直播间

学生端：

- 保留：观看课件/屏幕、评论/note、举手、被授权后开麦/摄像头、进入当前课时作业。
- 移除：作业映射到 live、单词映射到 live、上传课件、清除全班笔迹、录播保存等教师控制。

教师端：

- 保留：选择课件、翻页、画笔、清除笔迹、录制、结束课程、查看学生、授权举手。
- 修复：所有文案走 i18n；PDF 使用缓存页；画笔为清晰线条；关闭画笔不清空。

画笔规则：

- `penMode=false`：不能新增笔迹，但已有笔迹继续显示。
- `clearInk`：清空当前页笔迹。
- `brushWidth`：支持至少 1/2/4/6 四档。
- `brushStyle`：默认圆珠笔线条，禁用喷墨/水墨扩散效果。

### 4.4 课程编辑页

从教师课程卡片进入 `teacher/courses/:courseId`。

页面模块：

| 模块 | 功能 |
|---|---|
| 课程信息 | 标题、描述、状态、封面 |
| 入会学生 | 学生列表、加入/移除、进度摘要 |
| 上传课件 | PDF/PPTX 上传、转换状态、课件页预览 |
| 课程时间 | 课时节点、开课时间、live 状态 |
| 课程作业 | Excel 上传、任务预览、发布状态 |
| 直播管理 | 创建/进入 live、录播记录、note/字幕记录入口 |

### 4.5 管理端后台

路由：`/admin`，仅 `admin` 可访问。

Admin 是“后端资源与业务数据控制台”，不是学生页面。它可以理解为后端数据库、文件存储和多媒体资源 API 的可视化管理界面。

MVP 管理范围：

| 模块 | 关键能力 |
|---|---|
| 老师账号 | 列表、新增、禁用、重置密码 |
| 学生账号 | 列表、课程绑定、学习记录查看 |
| 课程管理 | 课程 CRUD、状态、所属教师 |
| 课件管理 | PDF/PPTX 文件、转换状态、关联课程 |
| Excel 作业 | 上传记录、解析状态、任务数量、错误行 |
| Live 管理 | live 列表、状态、课程/课时绑定 |
| 录播记录 | 查看、删除、关联 live |
| Note 弹幕 | 查看、隐藏、导出 |
| 翻译字幕 | 查看、导出、关联录播 |
| Schedule | 课程时间、live 时间、作业截止时间 |
| 学习进度 | 作业、单词、录音、完成状态 |

Admin 必须支持：

- 账户查看、查找、新增、删除、禁用。
- 教师管理的学生名单、Live Classes、上传课件、homework 导入记录。
- 文件与多媒体资源查看：PDF/PPTX、Excel、录音、录播。
- 学生作业信息、学习记录、学习进度聚合。
- 后端服务状态查看：API health、TTS provider status、存储目录/容量概览。

## 4.6 当前 P0 缺陷清单（Sprint 3 输入）

| ID | 缺陷 | 验收标准 |
|---|---|---|
| B01 | Admin 登录进入错误页面 | admin 登录后直接进入后台，不出现学生 dashboard |
| B02 | 登录页重复弹 GuestGate | 点击登录/注册时关闭解锁弹窗；登录页不再弹完整功能提示 |
| B03 | 注册登录无真实 schema | 完成 users/sessions/profile/link schema 并接入注册登录 |
| B04 | 教师课程与学生端割裂 | 教师创建课程/Live Class 后，绑定学生可见 |
| B05 | 添加学生只能按邮箱 | 支持姓名/用户名/学号模糊搜索和默认班级学生选择 |
| B06 | PDF 上传后无法查看 | PDF 文件 URL、worker、渲染错误提示均正确 |
| B07 | 画笔导致白屏 | 画笔绘制不破坏 PDF/canvas 渲染，补回归测试 |
| B08 | Live Class 数据关系不完整 | Live Class 下可见学生、课件、homework、sessions |
| B09 | Homework Excel 上传不稳定 | samples 中的 Excel 均能导入并在学生端看到 |
| B10 | 缺少样例素材 | `tests/samples/` 提供多份 xlsx/pdf/pptx |
