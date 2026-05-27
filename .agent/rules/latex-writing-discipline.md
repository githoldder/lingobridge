# LaTeX 学术去噪与 Markdown 格式乱入绝对防御红线 (LaTeX Writing Discipline)

在 LingoBridge 软件生命周期文档（01-FA 至 07-UM）的编写中，为了彻底防御大语言模型在高上下文和长文本输出时产生的“Markdown 标记无脑直译、AI 口水套话、缺乏信源硬扩写”等低级愚蠢恶习，所有执行 Agent **必须无条件、100% 严格遵守**以下四大绝对防御红线。

---

## 🚫 【红线一】严防 Markdown 格式乱入 LaTeX 源码
大模型在输出 LaTeX 正文时，极易由于 Token 惯性将 Markdown 的原生标记直接注入到 `.tex` 源码中。这属于**最高级愚蠢错误**，会导致 XeLaTeX 编译彻底崩溃或排版出现灾难性残余。

1. **绝对禁止 Markdown 标题和列表残留**：
   - 严禁在 `.tex` 源码中出现 `#`, `##`, `###` 标题标记，必须完全使用 `\chapter{}`, `\section{}`, `\subsection{}`。
   - 严禁在 `.tex` 中使用 `-` 或 `*` 罗列列表，必须完全包裹在标准的 `\begin{itemize} \item ... \end{itemize}` 或 `\begin{enumerate} \item ... \end{enumerate}` 环境中。
2. **绝对禁止 Markdown 加粗与行内代码框残留**：
   - 严禁使用双星号 `**加粗文本**`，必须使用 LaTeX 的 `\textbf{加粗文本}` 或者是 `{\bfseries 加粗文本}`。
   - 严禁使用单星号 `*倾斜*`，必须使用 `\textit{倾斜}` 或者是 `\emph{倾斜}`。
   - 严禁使用反引号 <code>`行内代码`</code> 或者是 ``` 代码块，所有技术命令、代码、文件名必须使用 `\texttt{code}` 进行包裹，或者在 `\begin{lstlisting}` 环境中进行安全展示。
3. **自查过滤流程**：
   - 在将内容写入 `.tex` 之前，Agent 必须启动内部正则过滤器，彻底检索 `**`、`` ` ``、` - `、`1. ` 等 Markdown 特有标记。一旦发现，必须全数退回并重新渲染。

---

## 🚫 【红线二】严禁“AI 腔调”与低密度联结词
为了确保生命周期文档的学术出版级严谨度，所有行文必须采用**客观、严密、高信息密度的金字塔学术语体**。

1. **绝对禁止 AI 高频无意义口水词**：
   - 严禁使用“首先、其次、再次、最后、总而言之、综上所述、如前所述、不难看出、正如我们所知”等口头禅式联结词。
   - 严禁使用情绪化或浮夸的技术形容词（如“完美地”、“无瑕地”、“划时代的”、“彻底颠覆”）。
2. **段落级防御**：
   - 抛弃大模型标志性的“短句罗列 + 空洞总结”格式。
   - 采用标准的“主张先行 $\rightarrow$ 数据支撑 $\rightarrow$ 逻辑论证 $\rightarrow$ 参考文献引用”的金字塔闭环学术段落。

---

## 🚫 【红线三】严禁凭空捏造与空洞扩写
生命周期文档是指导工程硬化的真实案卷，绝对不允许大模型进行无中生有的“编故事式扩写”。

1. **强绑定 `docs/01-reference` 真实调研资产**：
   - 所有在可行性分析（01-FA）、需求规格（02-SRS）及概要设计（03-HLD）中提及的指标、时延、额度限制、成本预测，**必须 100% 真实映射并引用自本项目的历史技术调研报告**。
   - 例如：提及 TTS 费用优化必须包含 `/tts-cache` 的 F0 月度额度（50万字符，CJK字符×2）、85%+ 缓存命中率以及月度预算从 342 美元锐降至 34.2 美元（节约 90% 计费开销）等真实物理测算，绝对禁止只泛泛而谈“可以有效节约大量云端开销”。
2. **未知项标记**：
   - 如果遇到参考文献中未覆盖的架构细节或处于 Spike 阶段的待拍板指标（如腾讯会议与 Teams 的开发者账号审核阻断），必须在文中客观写明其作为“候选方案假设”，严禁将假设作为已完成的结论进行确证性撰写。

---

## 🚫 【红线四】严格执行学术证据链引用 (GB/T 7714—2015)
任何重大的技术、经济、操作可行性论点或事实断言，必须在文后有可追溯、可检索的一手证据链支撑。

1. **文内必须标注引用**：
   - 对每一个事实论断和调研结论，必须在句末使用 `\cite{Ref-ID}` 进行著录。
2. **参考文献著录 100% 对齐规范**：
   - 文后的 BibTeX 数据库（`ref/refs.bib`）必须符合 GB/T 7714—2015 格式。对于技术调研报告，必须定义为规范的科技报告电子资源类型（如 `[R/OL]`），并给出真实作者、年份与精确的 URL（包含本地 `file:///` 路径）。

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
- [ ] 源码中 100% 不含 `**`、`*`、`` ` `` 等 Markdown 字符？
- [ ] 列表是否全部被 `\begin{itemize}` 替换，绝不含 Markdown 的 `-` 残余？
- [ ] 所有加粗和代码字体是否全数由 `\textbf` 和 `\texttt` 呈现？
- [ ] 段落行文中是否存在“综上所述”、“首先其次”等 AI 腔废话？（如有，必须立即用流式学术句法重构）
- [ ] 正文中的所有关键技术论点是否全部带有 `\cite{}` 引用标记？
- [ ] 参考文献 `refs.bib` 中是否包含所引用的所有条目？
- [ ] 运行 `bash build_manual.sh` 后，`.log` 或 `.blg` 中是否存在 `undefined citations` 警告？
- [ ] 所有表格是否使用 `\toprule`/`\midrule`/`\bottomrule` 三线表？列定义中是否 100% 无竖线 `|`？是否 100% 无 `\hline`？
- [ ] `.tex` 源码中是否 100% 不含 `\begin{tikzpicture}`、`\begin{axis}` 等硬编码绘图环境？
- [ ] 所有图片是否通过 `\includegraphics` 从 `figures/` 目录引入？
