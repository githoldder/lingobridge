# LaTeX 学术去噪与 Markdown 格式乱入绝对防御红线 (LaTeX Writing Discipline)

在 LingoBridge 软件生命周期文档（01-FA 至 07-UM）的编写中，为了防止大语言模型在长文本输出时产生 Markdown 标记泄漏、模板化套话、信源不足扩写等问题，所有执行 Agent 必须严格遵守以下写作与交付红线。

---

## 🚫 【红线一】严防 Markdown 格式乱入 LaTeX 源码
大模型在输出 LaTeX 正文时，极易由于 Token 惯性将 Markdown 的原生标记直接注入到 `.tex` 源码中。这属于严重格式缺陷，会导致 XeLaTeX 编译失败或排版残留。

1. **绝对禁止 Markdown 标题和列表残留**：
   - 严禁在 `.tex` 源码中出现 `#`, `##`, `###` 标题标记，必须完全使用 `\chapter{}`, `\section{}`, `\subsection{}`。
   - 严禁在 `.tex` 中使用 `-` 或 `*` 罗列列表，必须完全包裹在标准的 `\begin{itemize} \item ... \end{itemize}` 或 `\begin{enumerate} \item ... \end{enumerate}` 环境中。
2. **绝对禁止 Markdown 加粗与行内代码框残留**：
   - 严禁使用双星号 `**加粗文本**`，必须使用 LaTeX 的 `\textbf{加粗文本}` 或者是 `{\bfseries 加粗文本}`。
   - 严禁使用单星号 `*倾斜*`，必须使用 `\textit{倾斜}` 或者是 `\emph{倾斜}`。
   - 严禁使用反引号 <code>`行内代码`</code> 或者是 ``` 代码块，所有技术命令、代码、文件名必须使用 `\texttt{code}` 进行包裹，或者在 `\begin{lstlisting}` 环境中进行安全展示。
3. **自查过滤流程**：
   - 在将内容写入 `.tex` 之前，Agent 必须启动内部正则过滤器，检索 `**`、`` ` ``、` - `、`1. ` 等 Markdown 特有标记。一旦发现，必须退回并重新渲染。

---

## 🚫 【红线二】严禁“AI 腔调”与低密度联结词
为了确保生命周期文档的学术出版级严谨度，所有行文必须采用**客观、严密、高信息密度的金字塔学术语体**。

1. **绝对禁止 AI 高频无意义口水词**：
   - 严禁使用“首先、其次、再次、最后、总而言之、综上所述、如前所述、不难看出、正如我们所知”等口头禅式联结词。
   - 严禁使用情绪化或浮夸的技术形容词（如“完美地”、“无瑕地”、“划时代的”、“彻底颠覆”）。
2. **段落级防御**：
   - 抛弃大模型标志性的“短句罗列 + 空洞总结”格式。
   - 采用标准的“主张先行 $\rightarrow$ 数据支撑 $\rightarrow$ 逻辑论证 $\rightarrow$ 参考文献引用”的金字塔闭环学术段落。
   - 可以使用“在……方面”“与此同时”“相应地”“由此”等自然承接表达，但不得机械堆叠“首先、其次、再次、最后”等模板化序列词。

---

## 🚫 【红线三】严禁凭空捏造与空洞扩写
生命周期文档是指导工程硬化的真实案卷，绝对不允许大模型进行无中生有的“编故事式扩写”。

1. **强绑定 `docs/01-reference` 真实调研资产**：
   - 所有在可行性分析（01-FA）、需求规格（02-SRS）及概要设计（03-HLD）中提及的指标、时延、额度限制、成本预测，必须真实映射并引用自可核验资料。
   - 例如：提及 TTS 费用优化必须包含 `/tts-cache` 的 F0 月度额度（50万字符，CJK字符×2）、85%+ 缓存命中率以及月度预算从 342 美元锐降至 34.2 美元（节约 90% 计费开销）等真实物理测算，绝对禁止只泛泛而谈“可以有效节约大量云端开销”。
2. **未知项标记**：
   - 如果遇到参考文献中未覆盖的架构细节或处于 Spike 阶段的待拍板指标（如腾讯会议与 Teams 的开发者账号审核阻断），必须在文中客观写明其作为“候选方案假设”，严禁将假设作为已完成的结论进行确证性撰写。

---

## 🚫 【红线四】严格执行学术证据链引用 (GB/T 7714—2015)
任何重大的技术、经济、操作可行性论点或事实断言，必须在文后有可追溯、可检索的一手证据链支撑。

1. **文内必须标注引用**：
   - 对每一个事实论断和调研结论，必须在句末使用 `\cite{Ref-ID}` 进行著录。
2. **参考文献著录对齐规范**：
   - 文后的 BibTeX 数据库（`ref/refs.bib`）必须符合 GB/T 7714—2015 格式。对于技术调研报告，必须定义为规范的科技报告电子资源类型（如 `[R/OL]`），并给出真实作者、年份与可检索 URL。正式交付物中不得出现 `file:///Users/`、`/Users/caolei/` 等本地私有路径。

---

## 🚫 【红线五】严格三线表（booktabs 强制）
所有生命周期文档中的表格**必须**使用学术三线表格式，不得出现任何非标准排版。

1. **列定义禁止竖线**：
   - 严禁在 `\begin{tabular}` 或 `\begin{longtable}` 的列定义中出现竖线符号 `|`。
   - 正确：`\begin{tabular}{lll}` 或 `\begin{tabular}{l p{5cm} l}`。
   - 错误：`\begin{tabular}{|l|l|l|}`。
2. **禁止 `\hline`，强制 `booktabs` 三宏**：
   - 严禁使用 `\hline` 画横线。
   - 表头上方使用 `\toprule`，表头下方使用 `\midrule`，表尾使用 `\bottomrule`。
   - 数据行之间**不加任何横线**。
3. **`booktabs` 宏包声明**：
   - 项目 `thusetup.tex` 或主文件必须包含 `\usepackage{booktabs}`。
4. **longtable 同规则**：
   - `longtable` 环境同样适用：列定义无竖线，使用 `\toprule`/`\midrule`/`\bottomrule`/`\endhead`。
5. **分页表格强制规则**：
   - 行数达到 6 行且任一列含有长中文说明、URL、API 路径、DTO 名称或代码标识符时，禁止使用 `table` + `tabularx` + `[H]` 组合，必须改用 `longtable` 或拆分为“概览表 + 分模块子表”。
   - `longtable` 必须设置重复表头；续页不应重复生成新的表编号；路径与英文标识符必须在斜杠、连字符或语义边界处插入 `\allowbreak`，防止跨页截断、列宽溢出和内容重叠。

---

## 🚫 【红线六】严禁 .tex 正文硬编码绘图代码（图文分离）
所有图表**必须**以外部矢量文件（PDF/SVG）形式存放于 `figures/` 目录，通过 `\includegraphics` 引入。

1. **绝对禁止在 `.tex` 文件中出现以下环境或代码**：
   - `\begin{tikzpicture}` / `\end{tikzpicture}`
   - `\begin{axis}` / `\end{axis}`（pgfplots）
   - `\begin{mermaid}` 或任何 Mermaid 渲染代码块
   - Python / matplotlib 代码片段
2. **唯一合法的图片引入方式**：
   ```latex
   \begin{figure}[htbp]
   \centering
   \includegraphics[width=0.95\textwidth]{figures/xxxx.pdf}
   \caption{图题描述}
   \label{fig:xxxx}
   \end{figure}
   ```
3. **绘图脚本管理**：
   - Python/matplotlib 绘图脚本存放于 `scripts/` 目录，绝不放在 `templates/` 目录下。
   - 脚本输出的图文件必须存放到 `templates/figures/` 目录。

---

## 质量核查 checklist (编译前强制执行)
- [ ] 源码中是否不含 `**`、`*`、`` ` `` 等 Markdown 字符？
- [ ] 列表是否全部被 `\begin{itemize}` 替换，绝不含 Markdown 的 `-` 残余？
- [ ] 所有加粗和代码字体是否全数由 `\textbf` 和 `\texttt` 呈现？
- [ ] 段落行文中是否存在“综上所述”、机械序列词等 AI 腔废话？（如有，必须立即用流式学术句法重构）
- [ ] 正文中的所有关键技术论点是否全部带有 `\cite{}` 引用标记？
- [ ] 参考文献 `refs.bib` 中是否包含所引用的所有条目？
- [ ] 是否不存在 `\nocite{*}` 导致的孤儿参考文献？如保留，是否有人工说明每条文献为何必须入列？
- [ ] 所有 `\cite{}`、`\ref{}`、`\autoref{}`、`\pageref{}` 是否均能在 `.aux/.log` 中解析且没有 undefined / multiply defined？
- [ ] 每条文后参考文献是否都能在正文中找到明确引用位置，且引用句的事实主张与文献内容直接相关？
- [ ] 除标准、经典教材、历史基线、法规原文外，技术/课程/前沿类参考文献是否优先使用近 3 年来源？超过 3 年是否写明保留理由并补充较新替代来源？
- [ ] 每条新增参考文献是否包含可独立检索的 DOI、URL、ISBN、标准号或出版社信息，并确认不是 AI 幻觉条目？
- [ ] 运行 `bash build_manual.sh` 后，`.log` 或 `.blg` 中是否存在 `undefined citations` 警告？
- [ ] 所有表格是否使用 `\toprule`/`\midrule`/`\bottomrule` 三线表？列定义中是否无竖线 `|`？是否无 `\hline`？
- [ ] `.tex` 源码中是否不含 `\begin{tikzpicture}`、`\begin{axis}` 等硬编码绘图环境？
- [ ] 所有图片是否通过 \includegraphics 从 figures/目录引入？
- [ ] 是否渲染 PDF 并逐页检查图表、图片、公式、长表没有造成上一页大面积空白？若某页有效正文低于约 40% 且非章节首页/目录/封面/附录起始页，必须调整浮动体、拆表、缩图或改用 `longtable`。

---

## 4. 交付终期强制绝对红线 (Red Lines 7-12)

* **Red Line 7: No local absolute path in deliverables**
  正式生成的 `.tex`、`.bib`、`.bbl`、`.blg`、`skill`、`workflow` 中**绝对禁止**出现任何本地私有绝对路径（如 `file:///Users/` 或 `/Users/caolei/`）。必须统一使用项目的官方 GitHub 托管 URL 或工作区相对路径。

* **Red Line 8: No Markdown in LaTeX**
  `.tex` 源码中**绝对禁止**出现 Markdown 语法残留。凡是出现双星号 `**`、反引号 `` ` ``、代码围栏 ` ``` ` 或 Markdown 标题，直接判定为**不合格 (fail)**。加粗必须使用 LaTeX 宏命令 `\textbf{...}`。

* **Red Line 9: Compile success wording rule**
  禁止进行夸大无警报的交接汇报。如果 XeLaTeX 编译日志中存在 overfull/underfull/rerun 等非阻断性警告，汇报时必须如实说明“存在非阻断 warning”，严禁声称“0 warning/0 错误”。

* **Red Line 10: Citation specificity rule**
  引用证据链必须保持精确。禁止将单个文献（如语音合成报告）粗暴地用作多种无关事实（如服务器价格、OSS 价格、DeepSeek 大模型翻译成本）的通解兜底。每句核心技术论点或资费数据，必须使用能直接支撑该事实的专有文献引用（如 ASR 与翻译成本引用 `Ref-AsrPipeline`，云主机制冷/存储资费引用 `Ref-AzureTTS`，语音合成额度引用 `Ref-SpeechAudit`）。

* **Red Line 11: Ban list environment in LaTeX (禁止列表环境)**
  正式生成的 `.tex` 正文文档中**禁止大篇幅出现 `itemize` 或 `enumerate` 列表环境**。列表只允许用于算法、术语定义、检查清单、枚举约束等确有结构价值的场景；论证性正文应改写为连贯自然段。改写时使用因果、递进和对照关系组织句群，不得机械套用“首先、其次、再次、最后”等模板化序列词。**除非 USER 显式且强制要求使用列表，否则一律默认为自然段呈现。**

* **Red Line 12: HLD academic design-document gate**
  03-HLD 概要设计说明书必须满足 GB/T 8567—2006 与 IEEE 1016 的设计描述属性：系统上下文、架构视图、接口、数据、运行、错误处理、安全与设计约束均需可追溯到 SRS 或代码事实。严禁把 UI 营销文案、实现幻想、未落地第三方集成、未经验证的性能指标写成既成设计。接口表不得用单张巨表承载全部信息；至少应包含接口编号、需求追踪编号、方法、路径、输入、输出、认证/授权、错误码或异常说明。无法确认的接口必须标记为“待实现/候选”，不得作为已实现事实。

* **Red Line 13: PDF blank-space visual gate**
  正式交付 01-FA、02-SRS、03-HLD 及后续生命周期 PDF 前，Agent 必须渲染 PDF 页面并执行视觉审查。若因表格、图片、公式或浮动体过大导致当前页只剩章节标题、少量文字或大面积空白，而主体内容被挤到下一页，该页判定为排版失败。修复优先级依次为：拆分长表、改用 `longtable`、缩小图片宽度、调整浮动参数、将图表移至更合适锚点、重写段落承接。不得只因 XeLaTeX 编译成功就宣布交付。

* **Red Line 14: Cross-reference closure gate**
  交付前必须建立交叉引用闭环。所有 `\label{}` 必须至少被一个 `\ref{}`、`\autoref{}` 或语义等价引用使用；所有 `\ref{}`、`\pageref{}`、`\cite{}` 必须在 `.aux/.bbl/.log` 中解析成功；重复 label、孤儿 label、undefined reference、undefined citation 均为阻断问题。对于图、表、公式，正文必须出现“如图/见表/如式”一类解释性引用，不能只把对象丢进 PDF。

* **Red Line 15: Bibliography reality and recency gate**
  参考文献不是装饰品。每条文后参考文献必须在正文中真实引用，且必须能通过 DOI、URL、ISBN、标准号、出版社或权威数据库检索到。技术前沿、产品文档、市场数据、AI/机器学习和课程大作业类论据默认使用近 3 年来源；超过 3 年只允许作为经典基础、历史基线、标准法规或没有新版替代的权威来源，并须在审查报告中说明保留理由。Agent 严禁根据题名样式、作者名和期刊名臆造不存在的论文；无法联网或无法验证时，必须标记为“待核验”，不得写入正式 `refs.bib`。
