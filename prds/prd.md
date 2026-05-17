# LingoBridge PRD v4.1 修复、后台管理与下一阶段方向

> 更新日期：2026-05-17  
> 目标：清理前端 mock、修正 live/课时/作业边界、补齐课程编辑与管理后台。  
> 原则：简洁、可维护；只覆盖关键逻辑；重点写清模块交界点，不展开内部实现细节。

## 0. 当前进度

截至 2026-05-17，v4 的 15 个任务已完成并经过三轮 audit。当前状态：

| 模块 | 状态 | 说明 |
|---|---|---|
| 身份与游客门禁 | 已完成 | `AuthContext`、`GuestGate` 已接入；Anna mock 已清理 |
| live/课时/作业一对一 | 已完成 | 新增 `lesson_node`、`assignment_node`，live 创建要求 `lessonNodeId` |
| 学习记录持久化 | 已完成 | homework 保存传入 `lessonNodeId`，录音上传带 `taskId` |
| 学生/教师 live 权限分离 | 已完成 | 学生端隐藏教师配置按钮，教师端保留控制 |
| i18n key 暴露修复 | 已完成 | 教师端关键 `classroom.*` 已清理 |
| PDF 与画笔 | 已完成 | PDF 预缓存/DPI 优化，画笔按页存储、清晰线条、粗细调节 |
| 教师课程编辑页 | 已完成 | 课程信息、学生、课件、时间、作业、live 六模块 |
| 管理端后台 | 已完成 | Admin 全宽布局和核心运营模块已接入 |
| 验证 | 通过 | `npm run lint`、`npm run build`、`npm run backend:test` 3/3 通过 |

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

## 4. 模块边界

### 4.1 身份与权限

前端只认三种状态：`guest`、`student`、`teacher/admin`。用户信息来自 auth API，不从组件默认值读取。

关键接口：

| 接口 | 用途 |
|---|---|
| `POST /api/v1/auth/login` | 登录并返回用户角色 |
| `GET /api/v1/users/me` | 当前用户信息 |
| `POST /api/v1/auth/register` | 注册学生/教师账号，MVP 可先做学生注册 |

游客门禁规则：

- 可看落地页、课程介绍、部分 demo 预览。
- 点击录音、提交作业、进入 live、查看学习记录、课程管理、后台管理时，弹出注册登录提示。

### 4.2 课程、课件、作业、live 的关系

统一关系：

```text
course
  -> lessonNode[]            # 课时节点
      -> liveSession?        # 一对一
      -> assignmentNode      # 一对一
      -> coursewarePages[]   # 当前课时使用的课件页
      -> learningTask[]      # Excel 导入的任务/单词/录音题
```

关键实体：

| 实体 | 关键字段 |
|---|---|
| `course` | `id, teacherId, title, description, status` |
| `lesson_node` | `id, courseId, title, startsAt, styleSeed, colorToken, shapeToken` |
| `live_session` | `id, courseId, lessonNodeId, status, currentPage, recordingStatus` |
| `assignment_node` | `id, courseId, lessonNodeId, title, dueAt` |
| `learning_task` | `id, assignmentNodeId, taskType, zhText, pinyin, translationRu, translationKk` |
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

## 6. 任务拆分

### P0 必须先修

| ID | 任务 | 交付 |
|---|---|---|
| T01 | 清理身份 mock 与游客门禁 | Anna 消失；游客受保护动作弹注册登录提示 |
| T02 | 固化 live/课时/作业一对一模型 | `lesson_node`、`assignment_node`、`live_session.lessonNodeId` |
| T03 | 修复学习记录持久化 | 完成状态刷新/跳转不回退 |
| T04 | 学生端 live 去除教师配置按钮 | 作业/单词映射按钮不在学生端出现 |
| T05 | 教师 live i18n 审计 | 不出现 `classroom.*` key |
| T06 | PDF 渲染性能边界 | 使用已上传/转换/缓存的分页资源 |
| T07 | 画笔交互重做 | 圆珠笔线条、粗细、关闭不清空、清除才清空 |

### P1 课程管理闭环

| ID | 任务 | 交付 |
|---|---|---|
| T08 | 教师课程详情/编辑页 | 课程信息、学生、课件、时间、作业、live |
| T09 | PDF/PPTX 与 Excel 上传拆分 | 课件和作业上传入口分开 |
| T10 | 课时节点随机样式 | 创建后稳定显示颜色/样式 |
| T11 | 学生课程/作业入口统一 | 从课程、schedule、live 都能进同一课时作业 |

### P2 管理端后台

| ID | 任务 | 交付 |
|---|---|---|
| T12 | Admin 路由与权限 | 仅 admin 可进入 |
| T13 | 账号管理 | 老师/学生 CRUD 基础能力 |
| T14 | 课程与资源管理 | 课程、PDF/PPTX、Excel 解析记录 |
| T15 | Live 与内容记录管理 | live、录播、note、字幕 |
| T16 | 学习进度管理 | 作业、单词、录音、完成记录 |

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
2. TTS 是否采用 Azure Speech 作为主 provider：后端保留 provider adapter，前端只调用本项目 TTS facade，避免以后更换服务影响页面。
3. 录音波形与 AI 评测应拆开：波形图本地生成或脚本预处理，AI 评测走异步任务，不阻塞录音提交。
4. ASR/实时翻译不应在 MVP 中直接押注自部署大模型。优先用托管 ASR/翻译服务跑通 pipeline，再评估本地模型在成本、延迟、准确率和运维上的收益。

建议下一轮 PRD 只做一个 Spike：

- 比较 Teams、腾讯会议、Azure Speech、腾讯云/其他 ASR 的集成成本、权限门槛、费用、数据可控性。
- 输出“自研课堂 vs 外部会议平台”的取舍表。
- 做一个最小 adapter demo：课程页创建会议链接、学生点击入会、会后把录播/字幕/出勤元数据回填到课程课时。
