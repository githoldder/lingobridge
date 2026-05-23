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

## 7.1 最后执行 PRD List

> 状态：`final_pre_demo_closeout`  
> 目标：不再扩大范围，只把老师端创建内容到学生端真实可见、作业俄语 TTS + 录音 + 提交、录制回放、演示材料这条链路收尾。

| ID | 任务 | 状态 | 验收口径 |
|---|---|---|---|
| CLOSE-T01 | 学生 Dashboard/Schedule 去 mock 化 | patched_verify_green | 学生登录后 Dashboard/Schedule 基于真实 `courses -> lesson_nodes -> live_sessions` 渲染，未排期课时和正在直播的课时都可进入 |
| CLOSE-T02 | Live 课堂默认课件同步 | patched_verify_green | 老师上传或选择 PDF/PPTX 课件后，学生进入对应 live 能看到当前课时课件；无课件显示等待态 |
| CLOSE-T03 | 课堂录制与本地共享录屏 | patched_verify_green | 点击录制时若没有摄像头/屏幕流，浏览器请求录屏；录制结束上传为 lecture 回放；本地共享时隐藏翻页栏 |
| CLOSE-T04 | Drawing 设置抽屉化 | patched_verify_green | 设置从左侧短抽屉弹出，默认隐藏；未全屏时不被底部控制栏遮挡 |
| CLOSE-T05 | 学生作业俄语 TTS + 录音 + 提交 | in_progress_next | 学生从 Schedule/Homework 进入真实作业，播放俄语 TTS，录音，确认评分，最终提交为 `homework_submission` |
| CLOSE-T06 | 演示数据清理与最小 seed | todo_next | 清理历史测试课程，只保留 1 老师、1 班级、2-3 学生、1 课程、1 课时、1 PDF、1 Excel 作业 |
| CLOSE-T07 | 三角色 E2E 最终脚本 | todo_next | 覆盖老师创建课程/课时/上传课件/上传作业/开始 live，学生登录看到课程、进入 live、看到课件、进入作业并提交 |
| CLOSE-T08 | 演示视频与图文教程 | todo_after_green | 端到端脚本跑通后，再录制演示视频并输出老师版/学生版图文教程 |

### Closeout 执行顺序

1. 先清理测试数据并固化最小 demo seed。
2. 跑通“老师创建课程 -> 上传课件/作业 -> 创建 live -> 学生 Schedule 看到入口 -> 学生进入 live 看到课件”。
3. 跑通“学生作业 -> 俄语 TTS -> 录音 -> 确认 -> 提交”。
4. 补三角色 E2E，将上述两条主链路固定成回归脚本。
5. 最后录演示视频和图文教程。

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
