# Sprint 6 Prelaunch：演示封板、Smoke、打包部署与教程录制

> 日期：2026-05-23  
> 来源：`prd.md` / `prd.json` v4.6 最新决策  
> 目标：在不继续扩张 O2/O3 大功能的前提下，完成上线前最后一轮封板验收，修复演示主链路 bug，打包 `dist`，部署腾讯云公网，并完成本机演示视频与图文教程。

## Scope

本 sprint 只处理“今天演示和部署会翻车”的问题：

- 三角色 smoke：Admin、Teacher、Student。
- PDF 上传、默认课件、Live classroom、批注不白屏。
- 班级、课程、学生端同步、作业草稿/提交。
- 全局 i18n 默认顺序：中文 `zh-CN` -> 哈萨克语 `kk-KZ` -> 俄语 `ru-RU` -> 英语 `en-US`。
- 演示版 ASR 语音识别和双语翻译字幕临时测试版，使用免费方案或预生成 fallback，必须隔离在 demo/feature flag 中。
- 打包、腾讯云公网部署、演示视频、图文教程。

不处理：

- 不做完整 O2/O3 大功能扩张。
- 不把 ASR/翻译临时测试版接入正式课堂主链路。
- 不承诺 ASR/翻译长期免费、无限额度或生产 SLA。
- 不做 PPTX 原生预览、PPTX 转换策略或 Microsoft 365 Embed。

## Objective

把 LingoBridge 从“功能已开发”推进到“可稳定演示、可公网访问、可录制教程”的上线前状态。

## Key Results

- KR1：`npm run backend:test`、`npm run lint`、`npm run build` 全部通过。
- KR2：三角色人工 smoke 通过，无 P0 演示阻断。
- KR3：教师端可完成“清理数据 -> 建班级 -> 建课程 -> 添加学生 -> 上传 PDF -> 设置默认课件 -> 进入 live -> 批注”的链路。
- KR4：学生端可看到课程/作业/live 入口，并完成作业录音草稿恢复与提交。
- KR5：演示版 ASR/翻译可展示最小闭环，并有预录音频/预生成字幕 fallback。
- KR6：`dist` 成功打包并部署到腾讯云公网。
- KR7：完成本机演示视频和图文教程素材录制。

## Task Breakdown

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S6-T01 | PRD 状态同步 | `prd.md` 与 `prd.json` 记录 i18n 顺序、ASR/翻译临时测试版、上线前 sprint | in_progress |
| S6-T02 | 自动化基线验证 | backend:test、lint、build 全通过，记录输出 | todo |
| S6-T03 | 真人鼠标点击 smoke | 使用接近真实用户的点击路径完成 Admin/Teacher/Student 三角色验收 | todo |
| S6-T04 | 演示阻断 bug 修复 | 只修 P0/P1：白屏、不可见、不可保存、无法进入、i18n 裸 key | todo |
| S6-T05 | ASR/双语翻译临时测试版 | 免费方案或 fallback demo；feature flag/demo route 隔离 | todo |
| S6-T06 | dist 打包与部署 | `npm run build` 产物部署腾讯云公网，记录 URL 和回滚方式 | todo |
| S6-T07 | 演示视频录制 | 本机录制完整主链路，保留失败 fallback 脚本 | todo |
| S6-T08 | 图文教程生成 | 按角色输出截图、步骤、注意事项和公网访问说明 | todo |

## Smoke Path

### Admin

1. 登录 Admin。
2. 确认后台布局、用户信息、退出按钮正常。
3. 执行或模拟清理测试数据 dry-run。
4. 确认核心 demo seed 保留。

### Teacher

1. 登录 Teacher。
2. 创建或选择班级。
3. 添加学生。
4. 创建课程并绑定班级。
5. 创建课时或选择已有课时。
6. 上传 PDF。
7. 设置默认课件。
8. 进入 Live classroom。
9. 测试翻页、画笔、清除、文本/annotation 基础能力。
10. 确认不白屏、不暴露 `classroom.*` 原始 key。

### Student

1. 登录 Student。
2. Dashboard/Schedule 能看到老师创建的课程、课时或 live 入口。
3. 进入课程或作业。
4. 做一道录音题。
5. 刷新页面后恢复草稿。
6. 提交作业。
7. 播放中文/俄语 TTS；哈萨克语如果未完整实现，应按 i18n fallback 显示中文或明确占位。

### Demo ASR / Translation

1. 打开 demo route 或运行 demo script。
2. 使用麦克风或预录音频输入。
3. 展示识别文本。
4. 展示中文为主、哈萨克语/俄语辅助的字幕或翻译结果。
5. 断网或 API 失败时切换到预生成字幕。

## Exit Criteria

- 没有 P0 bug。
- P1 bug 有明确 workaround，不影响演示主线。
- `prd.json` 可解析。
- 工作区提交清楚，部署产物可复现。
- 腾讯云公网 URL 可访问。
- 视频和图文教程可按同一脚本复现。

## Agent Prompt

```text
你是 LingoBridge 上线前封板工程师。请执行 Sprint 6 Prelaunch，不要扩张新功能，只处理演示、smoke、打包、部署和教程录制会直接失败的问题。

当前产品约束：
- 全局 i18n 优先级是 zh-CN -> kk-KZ -> ru-RU -> en-US。
- 中文是默认第一顺位，哈萨克语优先于俄语，英语只做最终 fallback。
- ASR 语音识别和双语翻译只做演示临时测试版，优先免费方案或预生成 fallback。
- ASR/翻译必须通过 feature flag、demo route 或脚本隔离，不进入正式课堂主链路强依赖。
- 不承诺长期免费、无限额度或生产 SLA。

执行顺序：
1. 先读 `prds/prd.md`、`prds/current/01-current-status-and-guardrails.md`、`prds/sprints/sprint-06-prelaunch-smoke-deploy.md`，必要时再读 `prds/prd.json` 做兼容校验，确认当前验收范围。
2. 跑 npm run backend:test、npm run lint、npm run build。若 backend:test 在 sandbox 因 tsx IPC pipe 失败，可按项目规则提权复跑。
3. 用接近真人鼠标点击行为进行三角色 smoke：
   - Admin：登录、清理入口/dry-run、退出。
   - Teacher：建班级、添加学生、建课程、绑定班级、上传 PDF、设置默认课件、进入 live、翻页和批注。
   - Student：看到课程/课时/live/作业入口，录音，刷新恢复草稿，提交作业，播放中文/俄语 TTS。
4. 只修演示阻断 bug：
   - PDF 上传后不可见
   - Live classroom 白屏
   - 学生看不到老师创建内容
   - 作业无法保存、恢复或提交
   - i18n key 裸露
   - Admin 清理/退出不可用
5. 实现或验证 ASR/翻译临时测试版：
   - 免费方案优先
   - demo route/script 隔离
   - 支持预录音频/预生成字幕 fallback
   - 字幕语言顺序遵循 zh-CN -> kk-KZ -> ru-RU -> en-US
6. 修复后再次跑 backend:test、lint、build。
7. 打包 dist，部署腾讯云公网，并记录公网 URL、部署命令、回滚方式。
8. 生成演示视频脚本和图文教程步骤。

交付：
- 修改文件清单
- 测试结果
- Smoke 结果和截图/录屏路径
- 腾讯云公网 URL
- 已知非阻断风险
- 下一步录制视频和图文教程的最终脚本
```
