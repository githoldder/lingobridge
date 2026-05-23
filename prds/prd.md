# LingoBridge PRD v4.6 Class-Live-Learning Cache

> 更新日期：2026-05-23  
> 目标：在 Sprint 4 课件/PDF/批注修复基础上，收敛班级-课程-课时-live classroom 主模型，并把默认课件、学生同步、作业录音缓存、单词掌握遗忘、真实入会状态写成下一阶段可执行需求。  
> 原则：简洁、可维护；只覆盖关键逻辑；重点写清模块交界点；每个任务必须能落到具体文件、接口、验证步骤。

## 0. 2026-05-23 最新产品决策

本次 PRD 更新与 `prd.json` v4.6 保持一致。优先级顺序为：先清理教师端测试数据和固化班级/课程/live 模型，再做默认课件、学生同步、作业录音缓存、单词遗忘曲线和课堂 annotation 体验。

### 0.1 教师端测试数据清理

教师端课程列表当前被大量测试课程污染，影响手动验收。下一阶段必须提供至少一种清理路径：

- 本地开发清理脚本：删除无用 `course`、`lesson_node`、`courseware_file`、`assignment_node`、`learning_task`、`learning_record`、上传文件元数据。
- Admin 清理入口：可按测试前缀、创建时间、课程 owner、孤儿关系进行 dry-run 和确认删除。
- 保留最小 demo seed：至少一位老师、一个班级、两到三名学生、一门课程、一个课时、一份 PDF、一份 Excel 作业。

验收：老师登录后课程列表不再被历史 E2E/手动测试数据刷屏。

### 0.2 班级是老师-学生绑定的核心容器

当前系统不能只依赖“课程直接加学生”的临时关系。产品模型应调整为：

```text
teacher
  -> class/cohort[]                 # 一个老师可带多个班
      <-> student[]                 # 一个班级有多个学生，学生可加入多个班
      -> course[]                   # 一个班级可有多门课
          -> stable classroom       # 每门课有固定教室
          -> lesson_node[]          # 每个课时就是一次 live
          -> courseware_file[]      # 课程/课时课件
          -> assignment_node[]      # 课时作业
```

关键规则：

- 老师与学生是主从关系，但实际管理通过班级/班级成员发生。
- 老师可以创建多个班级，每个班级可以开多门课。
- 老师把阿合买提加入班级或课程后，阿合买提学生端必须同步看到对应课程、课时提醒、schedule 和 live 入口。
- 课程成员可由班级继承，也可以保留课程级覆盖，但学生端可见性必须有唯一可信来源。

### 0.3 课程、课时与 live classroom

课程信息页必须支持编辑：

- 课程标题、描述、状态
- 课程封面
- 所属班级
- 创建时间、更新时间
- 课程时间或课时计划

课程与 live 规则：

- 每门课有一个固定 classroom。
- 老师创建上课时间，就是创建一个 `lesson_node`。
- 每个 `lesson_node` 对应一次 live，可在上课时间进入。
- 非上课时间，学生进入该课程 classroom 时应看到空教室/等待态，而不是错误或假数据。
- `lesson_node.startsAt/endsAt` 是 schedule、通知和 live 入口的统一来源。

### 0.4 默认 PDF 课件机制

课程信息页上传课件后，必须支持选择默认课件：

- 默认课件优先是 PDF。
- 默认课件可以设在课程级，也可以设在课时级；课时级覆盖课程级。
- 进入 live classroom 时，默认打开当前课时设置的 PDF。
- 若没有默认课件，教师端提示上传或选择默认课件，学生端显示等待老师准备课件。

建议字段：

| 实体 | 字段 |
|---|---|
| `course` | `defaultCoursewareFileId` |
| `lesson_node` | `defaultCoursewareFileId` |
| `courseware_file` | `isDefault` |

### 0.5 学生作业录音：题目级三槽位与三级缓存

学生自学时必须有明显节点变化，尤其是录音答题。

每道录音题：

- 最多保留 3 个录音槽位。
- 每次录音先进入本地缓存和应用状态。
- 用户点击“重置”时删除当前题当前槽位缓存。
- 用户点击确认/✅ 后，才进入 AI 评分和后端持久化。
- 录音记录按“第几题第几次练习”标号。
- 点击下一题后，只显示当前题目的录音、评分、缓存和完成状态，不显示全局录音。

作业末尾：

- 到最后一题后显示“完成作业并确认提交”。
- 点击提交后才推送教师端。
- 未提交前是学生端草稿，浏览器刷新或意外退出后应恢复。

三级缓存策略：

| 层级 | 作用 |
|---|---|
| 浏览器缓存 | 快速恢复未提交录音槽位和当前题位置 |
| 应用缓存 | 当前 session 内切题、重绘、评分状态不丢 |
| 数据库缓存 | 刷新、换设备或意外退出后恢复草稿/已提交记录 |

建议新增实体：

| 实体 | 关键字段 |
|---|---|
| `homework_submission` | `studentId, courseId, lessonNodeId, assignmentNodeId, status, submittedAt` |
| `homework_recording_attempt` | `studentId, lessonNodeId, taskId, slotIndex, audioUrl, localCacheKey, scoreStatus, scorePayload` |

### 0.6 单词学习：三段掌握与遗忘曲线

单词不是一次性作业，而是长期巩固学习。

规则：

- 每完成一次完整学习，只增加约 `1/3` 掌握度。
- 完成三次后，该单词才算完全掌握。
- 超过 1 周未复习，掌握度开始衰减。
- 长期不复习时，最低回落到“第一次接触完成”后的 `1/3` 状态，而不是归零。

建议实体：

| 实体 | 字段 |
|---|---|
| `vocabulary_progress` | `studentId, lessonNodeId, taskId, masteryStep, reviewCount, lastReviewedAt, decayState` |

### 0.7 学生同步、课时通知与 schedule

老师在课程里执行以下操作时，相关学生端必须同步：

- 上传课程封面
- 添加学生
- 上传课件
- 选择默认课件
- 上传作业
- 创建/修改课时
- 开始 live

学生端入口：

- Dashboard 显示最新课时/live 提醒。
- Schedule 同步课程课时。
- 课程详情页显示可进入的课时。
- 当前 live 进行中时显示明确进入按钮。

### 0.8 真实入会状态

教师在 live classroom 右上角点击 Students 时，必须看到真实入会情况，而不是 mock 数据。

应显示：

- 已加入课程/班级学生
- 当前在线
- 已离开
- 举手状态
- 最近心跳/最后在线时间

建议接口：

| 接口 | 用途 |
|---|---|
| `POST /api/v1/live-sessions/:id/join` | 学生进入课堂 |
| `POST /api/v1/live-sessions/:id/leave` | 学生离开课堂 |
| `GET /api/v1/live-sessions/:id/participants` | 教师查看真实入会状态 |

### 0.9 Annotation 工具增强

课堂 annotation 是正式教学工具，不是简单画笔。

已有能力继续保留：

- 画笔
- 直线
- 矩形
- 圆/椭圆
- 文本
- 调色板与取色

下一步需要补：

- 箭头
- 橡皮擦
- 页面内动态文本输入框，不能再使用浏览器 `prompt`
- 设置按钮移动到最左上角，展开后不被下层 layer 遮挡
- 橡皮擦应支持对象级或区域级删除

验收：老师在 live classroom 内批注 PDF 时，摄像头不闪烁、PDF 不重渲染、工具栏不遮挡主要内容。

## 0. 当前进度与风险重估

截至 2026-05-22，Sprint 3 已形成演示闭环，Sprint 4 进入“缺陷收敛 + 可验收闭环”阶段。Admin logout 已由用户确认可用，从 P0 阻断项移出。当前执行合同以 `prd.json` 的 `sprint4ExecutionPlan` 为准；agent 派活时必须引用具体 task id，并按 `operations` 逐条执行和验收。

本轮明确后置：`O6：PPTX 策略 Spike`，即 `S4-T28` 到 `S4-T31`。当前不做 `pptx.js`、PPTX 转 PDF/图片评估、Microsoft 365 Embed 或 PPTX MVP 决策。PPTX 可以保留上传入口和清晰提示，但不能阻塞 PDF、课程、作业、Live 和 Admin 主线。

| 模块 | 状态 | 说明 |
|---|---|---|
| 身份与游客门禁 | 已完成 | `AuthContext`、`GuestGate` 已接入；Anna mock 已清理 |
| live/课时/作业一对一 | 已完成 | 新增 `lesson_node`、`assignment_node`，live 创建要求 `lessonNodeId` |
| 学习记录持久化 | 已完成 | homework 保存传入 `lessonNodeId`，录音上传带 `taskId` |
| 学生/教师 live 权限分离 | 已完成 | 学生端隐藏教师配置按钮，教师端保留控制 |
| i18n key 暴露修复 | 已完成 | 教师端关键 `classroom.*` 已清理 |
| PDF 与画笔 | P0 收敛中 | 已补上传绑定课时、PDF 渲染错误定位；drawing 白屏仍需 Playwright 复现验收 |
| 教师课程编辑页 | 已完成 | 课程信息、学生、课件、时间、作业、live 六模块 |
| 管理端后台 | 已完成 | Admin 全宽布局和核心运营模块已接入；logout 用户已确认可用 |
| 作业俄语 TTS | 已完成 | 作业页和 Live 作业面板均提供 `ru-RU` 播放入口 |
| 学习记录清理 | P1 收敛中 | 已补 dryRun/write 清理接口、脚本和 Admin 入口 |
| 验证 | 部分通过 | `npm run lint`、`npm run build` 可通过；后端/E2E 需补充覆盖当前缺陷 |

非阻断 warning：

- Vite build 中 PDF.js 使用 eval 的安全/压缩 warning。
- 主 bundle 超过 500KB 的 chunk warning。

## 0.1 Agent 防回归规则

后续 agent 必须遵守以下规则，防止重复出现本轮低级错误：

1. 组件内不得硬编码 `http://127.0.0.1:3001`。除 `apiClient.ts` 的默认 fallback 外，所有 API 调用都必须走 `src/services/apiClient.ts`。
2. 不允许导入不存在的扩展名，例如 `apiClient.tsx`。新增文件后必须跑 `npm run build`，不能只跑 TypeScript。
3. 新增前端调用前，必须确认 `backend/src/app.ts` 里有对应接口；新增接口后至少补一个 smoke/API 验证。
4. API 字段名变更必须端到端同步：backend type、db seed、apiClient type、组件 local type、请求 body、渲染字段一起改。
5. `liveSessionsApi.create` 必须传 `lessonNodeId`；没有课时节点时不能创建 live。
6. 课时相关的学习记录写入必须传 `lessonNodeId`；录音上传必须传 `taskId`。
7. Admin 入口必须前后端双重鉴权：前端 `user.role === admin`，后端 `requireAdmin`。
8. 课程时间字段统一使用 `startsAt/endsAt`，不要再引入 `scheduledAt`。
9. 完成声明前必须跑：`npm run lint`、`npm run build`、`npm run backend:test`。若 sandbox 下 `backend:test` 因 `tsx` IPC pipe 失败，可提权重跑。

## 0.2 OKRTS 最小可行拆解

优先级规则：`P0 演示阻断 > P1 数据一致性 > P1 可观测清理 > P2 体验增强 > P3 后置 Spike`。Admin logout 已确认，不再占用 P0。

| 里程碑 | Objective | Key Result | 关联任务 | 最小步骤 |
|---|---|---|---|---|
| M1 | 课堂课件稳定 | PDF 上传后老师/学生均可看到第 1 页；失败可定位阶段和 URL | S4-T13, S4-T22, S4-T35 | 选择课时 -> 上传 PDF -> 写入 `lessonNodeId` -> PDF.js 本地渲染 -> clamp 页码 |
| M2 | drawing 白屏清零 | 绘制、清除、翻页返回后 PDF 背景不消失 | S4-T23, S4-T27, S4-T32 | PDF canvas 与 annotation canvas 分层 -> 画笔只写 strokes -> 清除当前页 -> Playwright 复现 |
| M3 | 作业朗读体验 | 中文原文和俄语释义均可播放 | S4-T21, S4-T40 | `zh-CN` 按钮 -> `ru-RU` 按钮 -> 空俄语隐藏 -> 云失败 fallback |
| M4 | 学习记录可信 | Admin 可预检/清理僵尸记录，progress 不被孤儿记录污染 | S4-T44, S4-T45 | 定义 zombie 条件 -> dryRun -> write 清理 -> Admin 入口 -> API 测试 |
| M5 | 三角色验收 | admin/teacher/student 每条主路径至少 1 个 smoke 通过 | S4-T45 | admin logout -> teacher upload PDF -> teacher drawing -> student homework -> 保存记录 |

## 0.3 阶段提示词

**Phase 1 - PDF/Drawing Stabilizer**

你是 LingoBridge 前端稳定性工程师。只处理 S4-T13/S4-T22/S4-T35/S4-T23/S4-T27。先复现 PDF 上传后无法查看和 drawing 后白屏，再修复。验收必须包含：上传绑定 `lessonNodeId`、PDF load/render 错误可定位、pageCount clamp、画笔绘制后 PDF 背景不消失。完成后运行 `npm run lint`、`npm run build`，并记录未覆盖风险。

**Phase 2 - Homework Russian TTS**

你是 LingoBridge 作业体验工程师。只处理作业页和 Live 作业面板的 TTS 入口。中文原文使用 `zh-CN`，俄语释义使用 `ru-RU`；`translationRu` 为空时隐藏按钮；云 TTS 失败必须保留 browser fallback。验收试听 1 条中文和 1 条俄语，不改动作业保存协议。

**Phase 3 - Learning Record Cleanup**

你是 LingoBridge 数据一致性工程师。只处理 S4-T44 的学习记录可信度。实现 dryRun 和 write 两种僵尸 `learning_records` 清理路径，僵尸定义为缺 student、缺 task、缺 lessonNode 或缺 lastRecording。输出 `deleted/scanned/reasons`，Admin 入口必须 `requireAdmin`。补 API 测试。

**Phase 4 - Three-role Acceptance**

你是 LingoBridge 验收测试工程师。按 S4-T45 执行三角色 smoke：admin login/logout，teacher 创建课时并上传 PDF，teacher drawing 不白屏，student 进入作业播放俄语 TTS 并保存学习记录。失败时给出最短复现路径、截图位置和对应 task id。

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

## 5. API 边界

只新增或修正关键接口：

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/users/me` | 当前用户，替代前端默认 Anna |
| `GET` | `/api/v1/courses/:id` | 课程详情 |
| `PATCH` | `/api/v1/courses/:id` | 编辑课程 |
| `GET` | `/api/v1/courses/:id/lesson-nodes` | 课时节点列表 |
| `POST` | `/api/v1/courses/:id/lesson-nodes` | 创建课时，同时创建作业节点 |
| `PATCH` | `/api/v1/lesson-nodes/:id` | 修改时间/标题/状态 |
| `POST` | `/api/v1/coursewares` | 上传 PDF/PPTX |
| `POST` | `/api/v1/assignments/import` | 上传 Excel 作业 |
| `GET` | `/api/v1/assignments?lessonNodeId=` | 当前课时作业节点 |
| `GET` | `/api/v1/homework/tasks?assignmentNodeId=` | 作业任务 |
| `POST` | `/api/v1/learning-records` | upsert 学习记录 |
| `GET` | `/api/v1/learning-records?studentId=&lessonNodeId=` | 学生学习状态 |
| `POST` | `/api/v1/live-sessions` | 创建 live，绑定 lessonNodeId |
| `PATCH` | `/api/v1/live-sessions/:id` | 翻页/状态/录制状态 |
| `GET` | `/api/v1/admin/*` | 管理端聚合接口，按模块拆分实现 |

## 6. Sprint 4 任务拆分

详细可执行操作已写入 `prd.json` 的 `sprint4ExecutionPlan.tasks[].operations`。`prd.md` 只保留派工摘要，避免人工读文档时过载。

### O1：Postgres Schema 与数据访问层

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T01 | 新增 Postgres docker service | done | 已完成，后续只验证 |
| S4-T02 | 定义业务 schema | done | 已完成，后续只验证 |
| S4-T03 | 引入数据库连接层 | done | `DATABASE_URL`、pool、transaction helper、health |
| S4-T04 | Repository 抽象 | done | users/courses/assignments/live/files repositories |
| S4-T05 | Seed 迁移 | done | admin/teacher/students/demo course 进入 Postgres seed |
| S4-T06 | JSON DB 兼容策略 | done | 明确 Postgres 优先，JSON fallback 或废弃 |

### O2：账号、课程、学生关系

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T07 | 登录注册接入 Postgres | done_with_followup | users/sessions/password_hash/token_hash |
| S4-T08 | 教师学生关系落库 | done_with_followup | `teacher_student_links` 默认学生池 |
| S4-T09 | 学生模糊搜索 | done_with_followup | 姓名、username、email、student_no 搜索 |
| S4-T10 | 课程成员 CRUD | done_with_followup | `course_members` 批量加入、移除、去重 |
| S4-T11 | 课程编辑保存 | done_with_followup | title/description/status/starts_at/ends_at |

### O3：课程编辑页功能闭环

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T12 | 优化教师课程编辑 UI | todo | 模块清晰、状态收敛、移动端不重叠 |
| S4-T13 | 上传课件绑定课时 | in_progress_patch_landed / P0 | PDF/PPTX 元数据写入 lesson_node_id；PPTX 不做预览策略 |
| S4-T14 | 上传作业绑定作业节点 | todo | Excel 导入写 assignment_imports/learning_tasks |
| S4-T15 | 下载作业表格 | todo | 导出当前 assignment tasks |
| S4-T16 | 设定 live 时间 | todo | startsAt/endsAt + live scheduled 状态 |

### O4：学生端真实数据

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T17 | 移除学生端静态 schedule | todo | `ScheduleView` 读取真实 student course/live 数据 |
| S4-T18 | 移除固定 `course-1` fallback | done_with_followup | 入口必须带 courseId/lessonNodeId |
| S4-T19 | 学生课程列表过滤 | done_with_followup | 只显示 `course_members` 里该学生加入的课程 |
| S4-T20 | 学生 live 入口 | todo / P0 | 从 active/scheduled live session 进入课堂 |
| S4-T21 | 学生作业入口 | todo / P0 | 根据 assignment_node 读取任务和学习记录 |

### O5：PDF.js 与批注专项

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T22 | 抽离 PDF stage | in_progress_patch_landed / P0 | `PdfViewer` 只负责 PDF 渲染、worker、cache、page count |
| S4-T23 | 建立 annotation model | todo / P0 | text/ink/shape/highlight 与 normalized 坐标 |
| S4-T24 | Konva annotation layer Spike | todo | 批注层不污染 PDF canvas |
| S4-T25 | 批注存储接口 | todo | lessonNode + courseware + page annotations |
| S4-T26 | 打印导出 | todo | 输出课件页 + 批注视图 |
| S4-T27 | PDF 回归测试 | todo / P0 | 翻页、画笔、清除、打印 smoke |

### O6：PPTX 策略 Spike

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T28 | `pptx.js` 翻页验证 | deferred | 后置，不执行 |
| S4-T29 | PPTX 转 PDF/图片评估 | deferred | 后置，不引入转换依赖 |
| S4-T30 | Microsoft 365 Embed 决策备忘 | deferred | 后置，不接入 iframe/embed |
| S4-T31 | PPTX MVP 决策 | deferred | 后置，不阻塞本轮 |

### O7：Live Class 翻页与同步

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T32 | 合并翻页 UI | todo | 删除重复分页，只保留主控制 |
| S4-T33 | 教师翻页写 live state | todo | `PATCH /live-sessions/:id currentPage` 唯一可信 |
| S4-T34 | 学生跟随页码 | todo | 学生读取 live currentPage |
| S4-T35 | PDF 页数边界修复 | in_progress_patch_landed / P0 | pageCount 未加载禁用下一页，页码 clamp |

### O8：Excel 作业双模式

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T36 | 统一作业 row schema | todo | Excel 和手动表单共享 validator |
| S4-T37 | Excel 导入预览 | todo | 错误行、有效行、确认发布 |
| S4-T38 | 手动表单 UI | todo | 表格录入 zh/pinyin/translation/taskType |
| S4-T39 | 手动创建接口 | todo | `POST /assignments/manual` |
| S4-T40 | 学生作业创建验证 | todo / P1 | 两种模式发布后学生端均可见；包含俄语 TTS |

### O9：Admin UI 和验收

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| S4-T41 | Admin 顶栏优化 | done_confirmed_by_user | 当前用户、刷新、logout、模块导航 |
| S4-T42 | Admin 账号模块 | todo | 用户搜索、新增、禁用、删除接入真实 DB |
| S4-T43 | Admin 资源模块 | todo | PDF/PPTX/XLSX/录音/录播可查 |
| S4-T44 | Admin 学习进度模块 | in_progress_cleanup_endpoint_landed / P1 | course/student/lesson 维度查询；僵尸学习记录清理 |
| S4-T45 | E2E 三角色回归 | todo / P1 | admin logout、teacher create course、student see course |

### 执行顺序

1. P0：先验收 PDF 上传绑定课时、PDF 渲染错误可定位、drawing 不再导致白屏。
2. P0：再验收学生 Live/作业入口和 `learning_record` 不串课时。
3. P1：清理僵尸学习记录，保证 Admin 学习进度可信。
4. P1：补三角色 E2E，覆盖 admin logout、teacher upload PDF、student homework Russian TTS。
5. P2：继续课程编辑页、作业双模式、Admin 资源视图体验优化。
6. P3：PPTX 策略 Spike 继续后置，不进入当前修复窗口。

## 6.1 候选 Sprint：语音演示与中俄双语字幕 Spike

> 状态：`proposed_after_sprint4_core_green`  
> 前置条件：先修复当前 TypeScript errors、`backend:test` 失败和 dirty task 状态；Sprint 4 主链路至少达到 `npm run lint`、`npm run build`、`npm run backend:test` green。  
> 原则：语音能力服务演示，不反过来打断课程、作业、Live、PDF、Admin 主线。

### Objective

在不打断 Sprint 4 课程/作业/Live/PDF/Admin 主链路的前提下，为上台演示提供高音质、低翻车风险的中俄语音播报和可选实时字幕验证。

### Key Results

| KR | 指标 | 验收口径 |
|---|---|---|
| KR-SD1 | 演示 TTS 稳定 | 中文和俄语演示语句均提前生成 MP3，本地/后端缓存播放；断网时核心播报仍可演示 |
| KR-SD2 | Provider 可替换 | 后端 TTS facade 支持至少一个国内中文 provider 和一个俄语 provider，前端不直接依赖厂商 SDK |
| KR-SD3 | 额度与限流风险透明 | 记录火山、百度、ElevenLabs、Azure、DeepL 的官方额度、认证门槛、并发/限速风险和控制台实测结果 |
| KR-SD4 | 实时字幕 Spike 可回退 | ASR/翻译字幕 demo 支持实时模式和预录音频 fallback；实时失败不影响主产品演示 |
| KR-SD5 | 不污染 Sprint 4 主线 | 所有语音 Spike 代码通过 feature flag 或 `scripts/demo` 隔离，不改坏课程、作业、Live、PDF 和 Admin E2E |

### 技术评审结论

| 方案 | 判断 |
|---|---|
| 火山引擎/豆包语音 | 中文 TTS 和 ASR Spike 首选候选，但额度需按官方控制台复核。官方豆包语音试用口径包含 TTS 约 20000 字符/半年、流式 ASR 约 20 小时/半年；不能写成 100 万字符/月或 500 小时/月 |
| 百度智能云语音 | 中文 TTS/ASR 可作为国内备选。免费资源按认证状态和接口类型区分，个人账号常见并非 50 万字符/月；俄语能力需单独实测 |
| ElevenLabs | 俄语音质候选，适合网页或脚本提前生成 MP3；免费额度、署名和商用限制必须以当前 pricing/account 为准 |
| Azure Speech | 中文/俄语质量和多语言生态稳，官方 F0 常见口径为 TTS 0.5M neural characters/month、STT 5 audio hours/month；国内网络建议预生成 |
| DeepL | 俄语翻译候选；官方 DeepL API Free 为 500000 characters/month，不是每日 5000 |
| Edge TTS / Browser TTS / 本地开源 TTS | 不作为上台演示主链路。可保留 browser fallback 兜底，但音质、限流、算力和稳定性不足以承诺演示级 |

### Non-goals

- 不在 Sprint 4 内把实时 ASR/翻译字幕接入正式课堂主链路。
- 不承诺任何云厂商永久免费、不限流或无边界并发。
- 不使用 Edge TTS、浏览器 TTS 或本地开源 TTS 作为上台演示主音源。
- 不把 Python 字幕 demo 当作正式产品功能交付。

### Task Breakdown

| ID | 任务 | 状态 | 派工重点 |
|---|---|---|---|
| SD-T01 | TTS provider 官方额度与控制台实测审计 | todo_after_sprint4_core_green | 复核火山、百度、ElevenLabs、Azure 的额度、认证、并发、商用限制；输出 provider audit |
| SD-T02 | 离线生成中俄 MP3 演示资产 | todo_after_sprint4_core_green | 建立 `scripts/demo/tts-manifest.json` 和生成脚本；音频写入缓存目录；不提交真实密钥 |
| SD-T03 | TTS facade 多 provider hardening | todo_after_sprint4_core_green | 后端接 Volcengine/Baidu/Azure/ElevenLabs adapter 或 stub；前端继续只调 LingoBridge TTS API |
| SD-T04 | ASR/翻译 provider 审计与最小字幕 demo | todo_after_sprint4_core_green | 火山/Azure/百度 ASR 与火山/DeepL 翻译只做独立 demo；必须有预录音频 fallback |
| SD-T05 | 语音演示 runbook 与 E2E smoke | todo_after_sprint4_core_green | 写演示前检查、断网 fallback、音量/设备检查；补 demo audio smoke |

### 执行顺序

1. 先做离线 TTS 预生成和缓存播放，解决上台音质和断网风险。
2. 再做 provider adapter hardening，把火山/百度/Azure/ElevenLabs 放到同一 facade 后面。
3. 最后做 ASR + 翻译 + 字幕独立 demo，不进入正式课堂主链路。
4. 完成后只把成熟能力并入正式产品；实时字幕若不稳定，保留为演示 Spike 和后续版本候选。

## 7. 验收清单

- [x] 学生账号默认不再显示 Anna，登录后显示测试账号个人信息。
- [x] 从落地页直接进入时，游客只能预览；受保护操作弹注册登录提示。
- [x] 每个 live 必须绑定且只绑定一个课时节点。
- [x] 每个课时节点有且只有一个作业节点。
- [x] 课时节点颜色/样式创建后稳定，不随刷新变化。
- [x] 学生完成第一个节点作业后，跳转页面再回来仍是已完成。
- [x] 学生端 live 不显示作业/单词映射按钮。
- [x] 教师端不暴露 `classroom.content_mode`、`classroom.stopped` 等 key。
- [x] PDF/PPTX 课件上传后课堂可流畅翻页，失败时有明确状态。
- [x] 画笔为清晰圆珠笔效果，可调粗细。
- [x] 关闭画笔不会清空笔迹，清除笔迹按钮才清空。
- [x] 教师点击课程卡片进入课程编辑页。
- [x] 课程编辑页统一管理课程信息、学生、课件、时间、作业、live。
- [x] 管理端可管理老师、学生、课程、课件、Excel、live、录播、note、字幕、schedule、学习进度。

## 8. 下一阶段方向问题

下一阶段不应继续扩大自研 live 课堂，而应先做技术路线决策：

1. 直播课堂是否改为“外部会议平台集成优先”：Teams 或腾讯会议负责音视频会议、入会链接、录制/转写能力，本系统负责课程、作业、学习记录、权限与后台。
2. TTS 上台演示是否采用“云服务预生成 MP3 + 本地缓存播放”：结论是采用。中文候选火山/百度，俄语候选 ElevenLabs/Azure；后端保留 provider adapter，前端只调用本项目 TTS facade，避免以后更换服务影响页面。
3. 录音波形与 AI 评测应拆开：波形图本地生成或脚本预处理，AI 评测走异步任务，不阻塞录音提交。
4. ASR/实时翻译不应在 MVP 中直接押注自部署大模型，也不应在 Sprint 4 内接入正式课堂主链路。优先用托管 ASR/翻译服务做独立 Spike，并提供预录音频/预生成字幕 fallback，再评估是否进入后续版本。

建议下一轮 PRD 保留两个互不阻塞的 Spike：

- 比较 Teams、腾讯会议、Azure Speech、腾讯云/其他 ASR 的集成成本、权限门槛、费用、数据可控性。
- 输出“自研课堂 vs 外部会议平台”的取舍表。
- 做一个最小 adapter demo：课程页创建会议链接、学生点击入会、会后把录播/字幕/出勤元数据回填到课程课时。
- 语音演示与字幕 Spike：先用火山/百度/ElevenLabs/Azure 预生成 MP3，后做 ASR + 翻译 + 双语字幕独立 demo；不承诺未经官方核验的免费额度或“不限流”。

PPTX 策略 Spike 另行排期，不和本轮 Sprint 4 主线混在一起。
