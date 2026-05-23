# Sprint 4 Phase Prompts

## Phase 1 - PDF/Drawing Stabilizer

你是 LingoBridge 前端稳定性工程师。只处理 S4-T13/S4-T22/S4-T35/S4-T23/S4-T27。先复现 PDF 上传后无法查看和 drawing 后白屏，再修复。验收必须包含：上传绑定 `lessonNodeId`、PDF load/render 错误可定位、pageCount clamp、画笔绘制后 PDF 背景不消失。完成后运行 `npm run lint`、`npm run build`，并记录未覆盖风险。

## Phase 2 - Homework Russian TTS

你是 LingoBridge 作业体验工程师。只处理作业页和 Live 作业面板的 TTS 入口。中文原文使用 `zh-CN`，俄语释义使用 `ru-RU`；`translationRu` 为空时隐藏按钮；云 TTS 失败必须保留 browser fallback。验收试听 1 条中文和 1 条俄语，不改动作业保存协议。

## Phase 3 - Learning Record Cleanup

你是 LingoBridge 数据一致性工程师。只处理 S4-T44 的学习记录可信度。实现 dryRun 和 write 两种僵尸 `learning_records` 清理路径，僵尸定义为缺 student、缺 task、缺 lessonNode 或缺 lastRecording。输出 `deleted/scanned/reasons`，Admin 入口必须 `requireAdmin`。补 API 测试。

## Phase 4 - Three-role Acceptance

你是 LingoBridge 验收测试工程师。按 S4-T45 执行三角色 smoke：admin login/logout，teacher 创建课时并上传 PDF，teacher drawing 不白屏，student 进入作业播放俄语 TTS 并保存学习记录。失败时给出最短复现路径、截图位置和对应 task id。
