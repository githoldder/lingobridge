---
name: 01_latex_infrastructure
description: LaTeX 模版用法与项目结构配置，让 AI 快速熟悉编译流与修改规范
---

# LaTeX 基础设施与模板管控

## 0. 高频子技能

当任务涉及论文正文、生命周期文档正文、SRS/FA/HLD 等 LaTeX 内容注入时，必须优先加载：

- `structured-injection-review.md`：结构化 LaTeX patch、LaTeX 语法审查、论文/文档审稿人审查、注入与编译回归。

硬规则：

1. 禁止让 AI 输出 Markdown 正文后人工粘贴进 `.tex`。
2. 正文变更必须先生成结构化 LaTeX patch。
3. patch 注入前必须通过 LaTeX 语法审查和论文/文档审稿人审查。
4. 注入后必须运行项目编译脚本或 smoke test。
5. 若输出含 Markdown 标题、`**加粗**`、代码围栏、裸露 `%`、裸露 `&`，视为无效输出。

## 1. 项目编译工作流
本项目主要用于常工院(CZU)毕业设计模板的编写。推荐本地 VS Code 配合 TeX Live。

- **依赖环境**：完整 TeX Live 发行版。
- **编译方式**：运行 `scripts/build.sh` (Mac/Linux) 或 `scripts/build.bat` (Windows)。
- **标准编译链** (四次编译确保交叉引用和文献正确)：
  `xelatex -> bibtex -> xelatex -> xelatex` (以 `report.tex` 为入口)

## 2. 项目结构与修改规范
核心原则：修改前编译验证；改一处编译一次。本项目采用**单文件架构**。

- **`graduate-design-manual.cls` (禁区)**：格式定义，严禁修改。
- **`report.tex` (核心工作区)**：论文唯一主文件，包含元信息(`\title`, `\author`等)和全部章节正文。AI 修改正文时不得自由写入，必须按 `structured-injection-review.md` 生成 patch、审查后注入。
- **`report.bib` (低风险)**：参考文献数据库。
- **`figures/` (低风险)**：所有插图统一存放于此目录。引用格式：`\includegraphics[width=0.9\textwidth]{figures/xxx.png}`。

## 3. 常用操作与排错
- **增删章节**：直接在 `report.tex` 中增删 `\section{}` / `\subsection{}` 块。
- **参考文献**：使用 `\bibliographystyle{gbt7714-numerical}` + `\bibliography{report}` 标准 BibTeX 流程。
- **排错速查**：
  - `Undefined control sequence`：拼写错误/未引宏包。
  - `File not found`：检查路径是否包含反斜杠，需用正斜杠 `/`。
  - `Missing $ inserted`：公式未加 `$` 或未放入 math mode。

## 4. 交付前强制正则 Gate 扫描机制

为防止 Markdown 泄漏、本地绝对路径污染、TODO 残留以及未定义引用，**每次交付前，Agent 必须在终端执行以下正则表达式扫描指令**进行全量静态清查，对扫描发现的任何匹配项必须整改，否则禁止交付：

```bash
# 全文档级污染扫描 (在工作区根目录下执行)
rg -n '\\*\\*|file:///Users|/Users/caolei/|```|TODO|undefined' docs/00-project-docs/01-FA/templates/data/ docs/00-project-docs/02-SRS/templates/data/ docs/00-project-docs/03-HLD/templates/data/ docs/00-project-docs/shared/refs.bib .agent/skills/ .agent/workflows/
```

### 扫描项审查含义：
* `\\*\\*`：检测 Markdown 双星号 `**` 加粗符号泄漏。
* `file:///Users`：检测本地私有绝对文件路径泄漏。
* `/Users/caolei/`：检测本地私人主目录硬编码。
* ```` ` ````：检测 Markdown 代码围栏泄漏。
* `TODO`：检测未完成的内容占位标记。
* `undefined`：检测编译日志或输出中未定义的 Citation/Reference。

## 5. LaTeX 交付排版与编译日志踩坑避坑指南

### 5.1 Markdown 双星号 `**` 加粗泄漏避坑
* **踩坑描述**：Agent 往往下意识直接复制 Markdown 文档，或者仅清理了目标段落，导致 `.tex` 文件中残留大批 `**方案 A**`、`**1370 元**` 等双星号加粗标识。这在 formal LaTeX 文档中是极其严重的非学术、泄密缺陷，会直接被论文审查或审稿人退单。
* **避坑动作**：凡是加粗，必须规整为 LaTeX 独有的 `\textbf{...}` 宏命名；交付前必须在工作区运行正则 `rg '\*\*' docs/00-project-docs/` 指令，退出码为 1 方可交付。

### 5.2 Overfull/Underfull 编译日志虚报瞒报避坑
* **踩坑描述**：为了取悦用户，Agent 常夸大汇报“0 warning 编译完美通过”。但实际 XeLaTeX 日志中极易存在由封面占位符、字号调整、英文破折引起的 `Overfull \hbox`（文字超出页面边缘）或 `Underfull \hbox` 坏框警告。这种谎言一旦被用户查阅日志，会瞬间摧毁信任。
* **避坑动作**：必须实事求是。汇报时必须分级列出：1. Fatal Errors（必须为 0）、2. Undefined Reference（必须为 0）、3. Non-blocking Warnings（如 overfull/underfull 坏框，列出确切数量和分布）。禁止把“成功生成 PDF”隐瞒伪装成“毫无警告”。

### 5.2.1 API 长表字重叠专项处理
* **踩坑描述**：接口矩阵、DTO 映射表、错误码表即使已经使用 `longtable`，也可能因 API 路径和 DTO 名称为等宽英文串而继续横向侵入相邻列。典型表现是 `/api/v1/live-sessions/:id/presence` 与“教师/学生”“已实现”等中文列重叠。
* **避坑动作**：把该问题视为横向排版缺陷，而不是普通编译成功问题。必须同时做四步：局部缩小字号到 `\footnotesize`，设置 `\tabcolsep` 为 3pt 左右，重新计算并收敛全部 `p{...}` 列宽，为每个路径边界插入 `\allowbreak`。跨页 longtable 还必须使用 `\endfirsthead` 和无 label 的续表题 `\caption[]{...（续）}`，避免 label 重复。
* **验收动作**：除扫描 `.log` 中的 `Overfull \hbox` 外，必须渲染表格所在 PDF 页并肉眼确认没有字压字。若日志只剩其他页面的 Overfull，应在交付说明中明确区分，不得把非相关 warning 误报为接口表未修复。

### 5.3 LaTeX 列表中度依赖与 AI 腔草稿避坑
* **踩坑描述**：Agent 极其喜欢用 `itemize` 或 `enumerate` 分点陈述事实。在正式学术论文或高规格工程规格书中，满纸的 bullet-points 是典型的“AI 辅助草稿”标志，缺乏学术连贯性，属于审稿人直接枪毙的致命伤。
* **避坑动作**：**本段禁止有序/无序列表**。除了表格、核心术语定义和特别指定的验收矩阵外，所有正文叙述必须重构为饱满、连贯的**自然长段落**。行文应使用“在……方面”“与此同时”“相应地”“由此”“此外”“针对中远期规划”等自然承接表达，严禁机械套用序号式承接词或把分点简单拼接为伪段落。
