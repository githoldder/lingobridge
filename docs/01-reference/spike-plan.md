# 平台集成 Spike 计划（聚焦版）

> **目标**：停止堆砌自研课堂功能，用最小 Spike 验证云 TTS + E2E 基础设施。
> **时间**：2-3 天（原 3-5 天过于乐观）
> **产出**：可运行的 Azure TTS provider PoC + Playwright smoke 测试扩展
> **定位**：候选方案假设，非最终技术决策。所有指标需 POC 后实测验证。

## 调研文档索引（候选方案假设）

| 主题 | 文档 | 状态 | 可信度 |
|------|------|------|--------|
| Teams vs 腾讯会议 | [teams-vs-tencent-meeting.md](./teams-vs-tencent-meeting.md) | ✅ 完成 | 3/5（目标用户假设不稳，需真实账号测试） |
| Azure Speech TTS | [azure-speech-tts-provider.md](./azure-speech-tts-provider.md) | ✅ 完成 | 4/5（官方信源充足，但 90% 缓存命中率需 POC 验证） |
| ASR/翻译 Pipeline | [asr-translation-pipeline.md](./asr-translation-pipeline.md) | ✅ 完成 | 3/5（准确率/延迟指标过于乐观，需真实音频跑 WER/CER） |
| 浏览器 E2E 测试 | [browser-e2e-testing.md](./browser-e2e-testing.md) | ✅ 完成 | 4.5/5（项目已集成 Playwright，最贴合现状） |

## 核心结论（修正后）

### 现在就能拍板的
- ✅ **Playwright 作为唯一 E2E 框架**：`package.json` 已有 `@playwright/test` 1.60，`e2e/` 已有测试
- ✅ **Azure Speech 作为第一个 TTS provider 候选**：官方 F0 免费层 50 万字符/月，中文字符按 2 个计费字符
- ✅ **后端先抽 provider interface**：用量日志、缓存键设计、降级策略

### 需要 POC 后拍板的
- ⏳ 腾讯会议 vs Teams（需真实开发者账号+审核周期测试）
- ⏳ 阿里云/腾讯云/Azure/Google ASR（需真实课堂录音跑 WER/CER）
- ⏳ DeepL vs Google 哈语质量（需盲评实测，DeepL 已支持 Kazakh beta）

### 暂时不进 MVP 主线的
- 🚫 实时双语字幕（MVP 外）
- 🚫 ASR/翻译闭环（MVP 外）
- 🚫 会议录播自动转写（README 明确为待决策项）

## 2-3 天执行计划（聚焦版）

### Day 1：后端抽 TTS Provider Interface + 用量日志 ✅ 已完成
- [x] 定义 `TTSProvider` interface（synthesize、getUsage、isHealthy）
- [x] 实现 `BrowserFallbackProvider`（零成本，无限额度）
- [x] 实现 `AzureSpeechProvider`（SSML、文件系统缓存、F0 额度保护、自动降级）
- [x] 实现 TTSFacade（主备切换、健康检查、用量聚合）
- [x] 实现用量日志（`TTSUsageRecord`：每次调用记录字符数、成本、延迟、缓存命中）
- [x] 用量持久化到 `backend/data/tts-usage.json`，PM2 重启不丢失
- [x] 免费额度保护：检查 `used + billingChars > limit`，超额自动降级到 browser fallback
- [x] 缓存键包含 `lang:voice:speed:text`，文件扩展名 `.mp3`（与 Azure 输出一致）
- [x] 健康检查：仅验证配置格式，60s 缓存，不消耗 Azure 配额
- [x] `/api/v1/tts/usage` 加 admin 鉴权 + 默认脱敏文本
- [x] 更新 `/api/v1/tts` 路由 + 新增 `/usage` `/status` 端点
- [x] 前端 `apiClient.ts` 更新 `ttsApi` 支持新响应格式
- [x] 验证：`npm run lint` ✓ / `npm run build` ✓ / `npm run backend:test` 3/3 ✓
- [!] 注：Day 1 仅实现文件系统缓存（L1 内存缓存待 Day 2 按需添加），非"两级缓存"

### Day 2：缓存层 + Playwright Smoke 扩展
- [ ] 实现两级缓存（内存 LRU + 本地文件/IndexedDB），缓存键设计：`tts:${lang}:${voice}:${textHash}`
- [ ] 更新 `/api/v1/tts` 路由，走 provider facade + 缓存 + 用量日志
- [ ] 扩展 `e2e/` 测试：新增 TTS 合成场景、用量日志验证、缓存命中验证
- [ ] 运行现有 8 个 E2E 场景，修复发现的 bug
- [ ] 验证：缓存命中率>50%（固定词汇场景）、用量日志准确记录

### Day 3（可选）：决策文档 + 下一步计划
- [ ] 汇总 Spike 结果，输出候选方案对比表
- [ ] 评估 Azure TTS 实际成本（基于 POC 用量）
- [ ] 制定 Phase 2 计划（会议服务/ASR 真实账号测试）
- [ ] 更新 PRD，标注已验证/待验证项

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Azure 账号注册/审核周期 | 阻塞 Day 1 | 提前注册，先用 free tier |
| 缓存命中率远低于预期 | 成本超预算 | 记录实际命中率，调整缓存策略 |
| E2E 测试环境不稳定 | 阻塞 Day 2 | 先用 mock 数据验证流程 |

## 成功标准
- [ ] `TTSProvider` interface 可插拔（browser fallback + Azure 切换）
- [ ] 用量日志准确记录每次调用（字符数、成本、延迟、缓存命中）
- [ ] 免费额度保护生效（超额自动降级）
- [ ] Playwright 测试覆盖 TTS 场景 + 现有 8 个场景全部通过
- [ ] 输出 POC 实测数据（缓存命中率、实际成本、延迟分布）

## 信源清单

| 来源 | 链接 | 发布日期 | 质量评级 |
|------|------|----------|----------|
| Azure Speech F0 配额文档 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech | 2025-04 | A+ |
| Azure Speech 定价 | https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ | 2025-04 | A+ |
| Playwright 官方文档 | https://playwright.dev/docs/intro | 2025-04 | A+ |
| 项目 README | /Users/caolei/Desktop/LingoBridge/README.md | 2025-05 | A+ |
| PRD v4.0 | /Users/caolei/Desktop/LingoBridge/prds/prd.json | 2025-05 | A+ |
