# LingoBridge 软件生命周期文档与工程化写作本地化规范

> **适用范围**：LingoBridge 软件工程生命周期文档（01-FA 至 07-UM）、技术架构图、技术调研与 Spike 决策文档。
> **核心原则**：标准驱动、图文分离、无编造引用、绝对防御 Markdown 语法乱入与 AI 低密度腔调。

---

## 一、学术与工程写作去噪原则（绝对防御红线）

为了确保软件生命周期文档的高学术水准与工程规范，严禁出现由于大语言模型在饱满上下文下产生的“Markdown 标记直译入 TeX”、“AI 废话口头禅”等低级愚蠢恶习。

### 1.1 绝对防御 Markdown 语法乱入 LaTeX
大模型在输出 LaTeX 正文时，极易由于 Token 惯性将 Markdown 的原生标记直接注入到 `.tex` 源码中。这属于**最高级愚蠢错误**，会导致 XeLaTeX 编译彻底崩溃或排版出现灾难性残余：
- **绝对禁止 Markdown 标题和列表残留**：严禁在 `.tex` 源码中出现 `#`, `##`, `###` 标题标记，必须完全使用 `\chapter{}`, `\section{}`, `\subsection{}`。严禁在 `.tex` 中使用 `-` 或 `*` 罗列列表，必须完全包裹在标准的 `\begin{itemize} \item ... \end{itemize}` 或 `\begin{enumerate} \item ... \end{enumerate}` 环境中。
- **绝对禁止 Markdown 加粗与行内代码框残留**：严禁使用双星号 `**加粗文本**`，必须使用 LaTeX 的 `\textbf{加粗文本}`。严禁使用单星号 `*倾斜*`，必须使用 `\textit{倾斜}`。严禁使用反引号 <code>`行内代码`</code>，所有技术命令、代码、文件名必须使用 `\texttt{code}` 进行包裹。
- **自查过滤流程**：在将内容写入 `.tex` 之前，必须启动内部正则过滤器，彻底检索 `**`、`` ` ``、` - `、`1. ` 等 Markdown 特有标记。一旦发现，必须全数退回并重新渲染。

### 1.2 语法与格式净化（去 AI 腔）
- **禁止使用低密度联结词**：段落与句法之间严禁使用“首先、其次、再次、最后、总而言之、综上所述、如前所述、不难看出、正如我们所知”等低信息密度联结词。
- **禁止浮夸夸张词汇**：严禁使用非技术性、情绪化或夸张的修饰语（如“完美地”、“无瑕地”、“彻底颠覆”、“划时代的”），所有行文必须采用客观、客观的技术陈述。
- **金字塔学术语体**：采用标准的“主张先行 $\rightarrow$ 真实数据支撑 $\rightarrow$ 逻辑论证 $\rightarrow$ 参考文献引用”的金字塔闭环学术段落。

---

## 二、学术出版级制图与建模规范

所有在生命周期文档中展示的图像，必须对标国家与行业制图标准，绝不允许直接展示不规范、中英混用的花哨图像。

### 2.1 制图标准与图文分离原则
- **图文分离原则**：禁止在正文 TeX 源码中直接写入旁大复杂的绘图源码（如几百行的 TikZ）。所有系统架构图、数据走势图、交互流程图必须单独存放为矢量图文件（推荐 PDF、高清晰度矢量 SVG），并在正文中使用标准的 `\includegraphics` 导入。
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
在正文提及相关技术决策时，**必须**使用标准的 BibTeX `\cite{}` 形式引用，严禁凭空捏造与空洞扩写：

1. **`Ref-TeamsTencent`** (对标 [teams-vs-tencent-meeting.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/teams-vs-tencent-meeting.md))
   - **事实主张**：确认由于腾讯会议/Teams 开发者账号高审核门槛及闭源限制，MVP 阶段暂不引入实时会议，而使用最小化 WebRTC + 自建 Adaptive Polling 控制信令。
2. **`Ref-AzureTTS`** (对标 [azure-speech-tts-provider.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/azure-speech-tts-provider.md))
   - **事实主张**：Azure 语音服务 F0 免费层限额 50 万字符/月，且中文字符按双倍计费。引入 `/tts-cache` 双层（内存 L1 + 文件系统 L2）缓存机制，在固定的跟读练习课时场景下，可确保缓存命中率超 85%，有效降低 90% 以上的 API 计费开销。
3. **`Ref-AsrPipeline`** (对标 [asr-translation-pipeline.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/asr-translation-pipeline.md))
   - **事实主张**：端侧 3B 级别小模型进行俄哈双语 ASR 及翻译的评估。分析了在跨国华文教学中端点检测 (VAD) 的延迟指标，确定 WER/CER 在课堂降噪环境下的可接受边界。
4. **`Ref-PlaywrightE2E`** (对标 [browser-e2e-testing.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/browser-e2e-testing.md))
   - **事实主张**：使用 Playwright 1.60 进行全流程 Presence 信号和多角色状态自动流转的回归测试机制。
5. **`Ref-SpeechAudit`** (对标 [speech-provider-audit.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/speech-provider-audit.md))
   - **事实主张**：多语音合成提供商的时延、音质与单字符成本对比审计。
6. **`Ref-SpikePlan`** (对标 [spike-plan.md](file:///Users/caolei/Desktop/LingoBridge/docs/01-reference/spike-plan.md))
   - **事实主张**：2-3 天内完成后端 Provider 抽象及浏览器 Fallback 首个 PoC 验证的路线规划。

### 3.2 参考文献著录规范 (GB/T 7714—2015)
文后参考文献必须由 bibtex 自动构建，且每条著录格式在 bib 文件中定义为严谨的 `@techreport` 格式，必须包含真实的作者/机构（如 `LingoBridge Technology Spike Team`）、准确的时间、卷期和可验证的本地/线上 URL。
