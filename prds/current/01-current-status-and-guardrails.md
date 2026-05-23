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
