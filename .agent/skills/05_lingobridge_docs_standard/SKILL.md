# LingoBridge 软件生命周期文档与工程化写作本地化规范

> **适用范围**：LingoBridge 软件工程生命周期文档（01-FA 至 07-UM）、技术架构图、技术调研与 Spike 决策文档。
> **核心原则**：标准驱动、图文分离、无编造引用、剔除 AI 低密度语体与 Markdown 语体注入。

---

## 一、学术与工程写作去噪原则

为了确保软件生命周期文档的高学术水准与工程规范，严禁出现由于大语言模型在饱满上下文下产生的“AI 套话”与格式混杂。

### 1.1 语法与格式净化（绝对禁止）
- **禁止 Markdown 格式溢出至 LaTeX**：在 LaTeX 正文中绝对禁止直接使用 `****` 进行加粗、`-` 作为列表、``` 作为代码块等 Markdown 标识。所有排版必须使用地道的 LaTeX 宏包格式。
- **禁止使用低密度联结词**：段落与句法之间严禁使用“首先、其次、再次、最后、总而言之、综上所述”等低信息密度联结词。
- **禁止空洞观点堆砌**：每一个技术断言必须伴随具体的**事实、逻辑、数据**或**权威文献引用**。

### 1.2 金字塔结构与学术语体
- **金字塔逻辑结构**：先下结论，再展开阐述。自顶向下，结论先行，逻辑推进。
- **严肃技术叙事**：在描述架构与方案时，使用中立、客观的客观陈述句，避免夸张修饰与非技术性词汇。

---

## 二、学术出版级制图与建模规范

所有在生命周期文档中展示的图像，必须对标国家与行业制图标准，绝不允许直接展示不规范、中英混用的花哨图像。

### 2.1 制图标准与图文分离原则
- **图文分离原则**：禁止在正文 TeX 源码中直接写入庞大复杂的绘图源码（如几百行的 TikZ）。所有系统架构图、数据走势图、交互流程图必须单独存放为矢量图文件（推荐 PDF、高清晰度矢量 SVG），并在正文中使用标准的 `\includegraphics` 导入。
- **严肃浅色底色**：所有图像必须采用浅色底色（如纯白 `#FFFFFF` 或极淡浅灰 `#F9FAFB`）。**绝对禁止使用深色底（黑底）、渐变霓虹色等花哨、不严肃的设计。**
- **中英文术语完全一致**：图像中的所有文字必须与报告正文中的专业术语完全对齐。如果文档是中文，图像中的关键节点与连线必须使用**规范的中文专业词汇**，并在必要时使用小括号保留英文原文缩写（如“双层缓存架构 (L1/L2 Cached Architecture)”），严禁中英随机混杂。

### 2.2 配色规范
- **主色 (Primary)**：翡翠绿/高雅绿 (`#10B981` / HSL 160)，用于表达已优化、缓存生效及成功路径。
- **辅助色 (Secondary)**：清爽蓝 (`#3B82F6` / HSL 220)，用于常规组件与流程指示。
- **警示色 (Alert)**：玫瑰红 (`#F43F5E` / HSL 340)，用于未优化、无缓存或异常分支。
- **连线规范**：实线表示“生产数据/API 流量通道”，虚线表示“DevOps/构建部署补丁通道”。

---

## 三、引用与证据链规范 (对标 LingoBridge 技术库)

LingoBridge 已在 `docs/01-reference/` 中积累了 6 篇深度的技术调研与 Spike 验证文档，它们构成了可行性分析与需求规格的核心事实来源。

### 3.1 核心文献对标与引用 ID
在正文提及相关技术决策时，**必须**使用标准的 BibTeX `\cite{}` 形式引用，严禁硬扩写：

1. **`Ref-TeamsTencent`** (对标 [teams-vs-tencent-meeting.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/teams-vs-tencent-meeting.md))
   - **事实主张**：由于腾讯会议/Teams API 高度闭源且企业开发者账号审核周期过长，MVP 阶段决定放弃实时第三方会议 API 绑定，转而使用最小 WebRTC + 自建 Adaptive Polling 控制信令。
2. **`Ref-AzureTTS`** (对标 [azure-speech-tts-provider.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/azure-speech-tts-provider.md))
   - **事实主张**：Azure 语音服务 F0 免费层限额 50 万字符/月，超过则限制。引入 `/tts-cache` 双层（内存 L1 + 文件系统 L2）缓存机制，在固定的跟读练习课时场景下，可确保缓存命中率超 85%，有效斩断 80% 以上的 API 计费开销。
3. **`Ref-AsrPipeline`** (对标 [asr-translation-pipeline.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/asr-translation-pipeline.md))
   - **事实主张**：端侧 3B 级别小模型进行俄哈双语 ASR 及翻译的评估。分析了在跨国华文教学中端点检测 (VAD) 的延迟指标，确定 WER/CER 在课堂降噪环境下的可接受边界。
4. **`Ref-PlaywrightE2E`** (对标 [browser-e2e-testing.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/browser-e2e-testing.md))
   - **事实主张**：使用 Playwright 1.60 进行全流程 Presence 信号和多角色状态自动流转的回归测试机制。
5. **`Ref-SpeechAudit`** (对标 [speech-provider-audit.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/speech-provider-audit.md))
   - **事实主张**：多语音合成提供商的时延、音质与单字符计费成本对比审计。
6. **`Ref-SpikePlan`** (对标 [spike-plan.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/spike-plan.md))
   - **事实主张**：2-3 天内完成后端 Provider 抽象及浏览器 Fallback 首个 PoC 验证的路线规划。

### 3.2 参考文献著录规范 (GB/T 7714—2015)
文后参考文献必须由 bibtex 自动构建，且每条著录格式在 bib 文件中定义为严谨的 `@techreport` 或 `@online` 格式，必须包含真实的作者/机构（如 `LingoBridge Technology Spike Team`）、准确的时间、卷期和可验证的本地/线上 URL。
