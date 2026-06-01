# LingoBridge 软件生命周期文档与工程化写作本地化规范

> **适用范围**：LingoBridge 软件工程生命周期文档（01-FA 至 07-UM）、技术架构图、技术调研与 Spike 决策文档。
> **核心原则**：标准驱动、图文分离、无编造引用、绝对防御 Markdown 语法乱入与 AI 低密度腔调。

---

## 0. 高频子技能与参考规范

本技能是 LingoBridge 文档规范入口。执行生命周期文档、图表、正式交付文档时，应按任务类型加载以下子文件：

| 子文件 | 适用场景 |
|---|---|
| `document-engineering-writing.md` | 文档分类、生命周期、命名、版本、工程化写作 |
| `gbt-chart-and-modeling.md` | 图表、UML、流程图、架构图、图题、表题、编号、引用 |
| `software-engineering-docs.md` | SRS、HLD、LLD、DBD、API、测试、部署、用户手册 |
| `document-quality-checklist.md` | 交付前质量审查、自检、缺陷定位 |

执行硬规则：

1. 文档正文若进入 LaTeX，必须同时遵守 `.agent/skills/01_latex_infrastructure/structured-injection-review.md`。
2. 图表不得只贴图，必须有编号、题名、来源/说明和正文引用。
3. 软件工程文档必须能追踪：需求 -> 设计 -> 测试 -> 部署/验收。
4. 不允许把草稿、聊天记录、AI 口水话直接并入正式文档。
5. 交付前必须跑 `document-quality-checklist.md` 的对应检查项。
6. 生命周期文档 01-FA 至 07-UM 的模型图采用 UML-first 工作流：先按国标/行标判断正文应出现哪些模型图并在 LaTeX 中设置占位；Agent 只负责在各文档 `templates/uml/` 中维护 `.puml` 源码，用户后续通过网页工具二次生成 SVG、复制到 Figma 精修，最终导出 PDF 放入 `templates/figures/` 或既有 `templates/figure/` 目录。不得把 `figures/` 中已有 PDF 误判为无需维护 UML 源。

## 0.0.1 生命周期文档 UML 图源与成图分层工作流

LingoBridge 的正式文档图件遵循“规范占位、源码先行、人工精修、PDF 入稿”的链路。Agent 在扫描 01-FA 至 07-UM 时，应先依据 GB/T 8567、GB/T 9385、IEEE 1016、IEEE 829 等文档类型要求，判断章节中应设置的用例图、数据流图、状态图、组件图、部署图、时序图、活动图、ER 图、测试流程图和用户操作流程图；随后在对应文档的 `templates/uml/` 下创建或更新 `.puml` 源文件，并在 `.tex` 中以 `\includegraphics{figures/...pdf}` 或项目既有图目录路径保留最终 PDF 占位。`templates/figures/` 只保存用户经网页 SVG 与 Figma 精修后导出的最终图，不作为唯一源文件。若某图已存在 PDF 但缺少 `.puml`，应标记为“缺 UML 源”；若正文按标准需要图但尚未插入 PDF，则标记为“缺 LaTeX 占位 + 缺 UML 源”。

## 0.1 03-HLD 概要设计说明书强制生成规范

03-HLD 属于设计阶段的正式软件工程文档，不是产品宣传稿、开发流水账或接口清单堆叠。生成或修改 03-HLD 前必须同时读取 `software-engineering-docs.md`、`gbt-chart-and-modeling.md`、`.agent/rules/latex-writing-discipline.md` 与 `docs/00-project-docs/standards/checklists/软件设计文档检查清单.md`，并按以下顺序执行。

1. **证据基线确认**：先核对 02-SRS、现有代码路由、数据模型、部署约束和已确认技术调研。未在 SRS、代码或可信资料中出现的能力，只能写为“候选方案”“后续扩展”或“待验证风险”，不得写为已实现设计。
2. **学术语体约束**：正文使用客观设计描述，避免“高保真、先进、极致、彻底、强力、无界、精准、圆满、战略高度、国际一流”等营销化或绝对化词语。每段围绕一个设计主张展开，并说明设计对象、约束条件和工程理由。
3. **概要设计粒度**：HLD 只描述系统级架构、模块职责、接口契约、数据对象、运行流程、错误处理、安全策略与设计约束。函数体、具体代码实现、算法微步骤、UI 视觉修辞和完整 API 手册应下沉到 LLD、API 文档或附录。
4. **接口矩阵规范**：接口表必须包含接口编号、需求追踪编号、方法、路径、输入对象、输出对象、认证/授权、异常或错误码。行数达到 6 行且有长路径/DTO/中文说明时，优先拆成“接口概览表 + 分模块接口表”；确需跨页时使用 `longtable`，不得使用 `[H]` 固定浮动大表。
5. **表格排版硬规则**：所有表格使用 `booktabs` 三线表，无竖线、无 `\hline`。长路径、DTO、文件名、枚举值必须使用 `\texttt{}` 并在可断点插入 `\allowbreak`。表题位于表上方，`\label{}` 紧跟 `\caption{}`。
6. **编译审查门槛**：交付前必须编译 PDF，检查 `undefined citation`、`LaTeX Error`、`Overfull \hbox`、跨页截断、表题重复、目录编号异常和图表引用失效。若存在非阻断 warning，交付说明必须如实报告。
7. **PDF 视觉审查门槛**：交付前必须渲染 PDF 并逐页检查。若表格、图片、公式或浮动体过大导致某页出现大面积空白、主体内容被推到下一页，判定为 fail，必须拆表、缩图、调整锚点或改写段落后重编译。
8. **参考文献真实性与时效门槛**：每条参考文献必须被正文引用，且可通过 DOI、URL、ISBN、标准号或权威数据库独立检索。AI/机器学习、平台能力、云服务价格、市场数据等当前技术论据默认使用近 3 年来源；过旧来源仅能作为经典、标准、历史基线或无新版替代资料并写明理由。

## 一、学术与工程写作去噪原则（绝对防御红线）

为了确保软件生命周期文档的高学术水准与工程规范，严禁出现由于大语言模型在饱满上下文下产生的“Markdown 标记直译入 TeX”、“AI 废话口头禅”等低级愚蠢恶习。

### 1.1 绝对防御 Markdown 语法乱入 LaTeX
大模型在输出 LaTeX 正文时，极易由于 Token 惯性将 Markdown 的原生标记直接注入到 `.tex` 源码中。这属于严重格式缺陷，会导致 XeLaTeX 编译失败或排版残留：
- **绝对禁止 Markdown 标题和列表残留**：严禁在 `.tex` 源码中出现 `#`, `##`, `###` 标题标记，必须完全使用 `\chapter{}`, `\section{}`, `\subsection{}`。严禁在 `.tex` 中使用 `-` 或 `*` 罗列列表，必须完全包裹在标准的 `\begin{itemize} \item ... \end{itemize}` 或 `\begin{enumerate} \item ... \end{enumerate}` 环境中。
- **绝对禁止 Markdown 加粗与行内代码框残留**：严禁使用双星号 `**加粗文本**`，必须使用 LaTeX 的 `\textbf{加粗文本}`。严禁使用单星号 `*倾斜*`，必须使用 `\textit{倾斜}`。严禁使用反引号 <code>`行内代码`</code>，所有技术命令、代码、文件名必须使用 `\texttt{code}` 进行包裹。
- **自查过滤流程**：在将内容写入 `.tex` 之前，必须启动内部正则过滤器，检索 `**`、`` ` ``、` - `、`1. ` 等 Markdown 特有标记。一旦发现，应退回并重新渲染。

### 1.2 语法与格式净化（去 AI 腔）
- **禁止使用低密度联结词**：段落与句法之间严禁使用“首先、其次、再次、最后、总而言之、综上所述、如前所述、不难看出、正如我们所知”等低信息密度联结词。
- **禁止浮夸夸张词汇**：严禁使用非技术性、情绪化或夸张的修饰语（如“完美地”、“无瑕地”、“彻底颠覆”、“划时代的”），所有行文必须采用客观、客观的技术陈述。
- **金字塔学术语体**：采用标准的“主张先行 $\rightarrow$ 真实数据支撑 $\rightarrow$ 逻辑论证 $\rightarrow$ 参考文献引用”的金字塔闭环学术段落。

---

## 二、学术与工程制图与建模规范

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

1. **`Ref-TeamsTencent`** (对标 [teams-vs-tencent-meeting.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/teams-vs-tencent-meeting.md))
   - **事实主张**：确认由于腾讯会议/Teams 开发者账号高审核门槛及闭源限制，MVP 阶段暂不引入实时会议，而使用最小化 WebRTC + 自建 Adaptive Polling 控制信令。
2. **`Ref-AzureTTS`** (对标 [azure-speech-tts-provider.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/azure-speech-tts-provider.md))
   - **事实主张**：Azure 语音服务 F0 免费层限额 50 万字符/月，且中文字符按双倍计费。引入 `/tts-cache` 双层（内存 L1 + 文件系统 L2）缓存机制，在固定的跟读练习课时场景下，可确保缓存命中率超 85%，有效降低 90% 以上的 API 计费开销。
3. **`Ref-AsrPipeline`** (对标 [asr-translation-pipeline.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/asr-translation-pipeline.md))
   - **事实主张**：端侧 3B 级别小模型进行俄哈双语 ASR 及翻译的评估。分析了在跨国华文教学中端点检测 (VAD) 的延迟指标，确定 WER/CER 在课堂降噪环境下的可接受边界。
4. **`Ref-PlaywrightE2E`** (对标 [browser-e2e-testing.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/browser-e2e-testing.md))
   - **事实主张**：使用 Playwright 1.60进行全流程 Presence 信号和多角色状态自动流转的回归测试机制。
5. **`Ref-SpeechAudit`** (对标 [speech-provider-audit.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/speech-provider-audit.md))
   - **事实主张**：多语音合成提供商的时延、音质与单字符成本对比审计。
6. **`Ref-SpikePlan`** (对标 [spike-plan.md](https://github.com/githoldder/lingobridge/blob/main/docs/01-reference/spike-plan.md))
   - **事实主张**：2-3 天内完成后端 Provider 抽象及浏览器 Fallback 首个 PoC 验证的路线规划。

### 3.2 参考文献著录规范 (GB/T 7714—2015)
文后参考文献必须由 BibTeX 自动构建，且每条著录格式在 bib 文件中定义为严谨的 `@techreport` 格式，必须包含真实的作者/机构（如 `LingoBridge Technology Spike Team`）、准确的时间、卷期与可验证的线上 URL。

### 3.3 引用证据链高精准对齐规则
禁止将引用作为装饰性工具在句尾堆砌，或粗暴地使用一个文献（如语音合成报告）去泛化支撑不相关的技术或商业主张（如服务器价格、OSS 价格、LLM 翻译成本）。**每一句含有具体资费或特定技术的事实主张，必须严格追问引用源，必须能清晰回答三件事**：
1. 数据来源于哪个具体的官方或科技报告？
2. 数据的调查与抓取时间是什么？
3. 该文献是否直接支持本句事实？

例如：阿里云主机的首年特惠与 OSS 资费必须引用双层缓存及成本审计报告 `Ref-AzureTTS`；腾讯云的 TTS 免费字符限制必须引用 `Ref-SpeechAudit`；DeepSeek API 翻译成本必须引用 `Ref-AsrPipeline` (因为包含了机器翻译管线成本审计)。

### 3.4 共享引用数据库 (shared/refs.bib) 同步规范
位于 `docs/00-project-docs/shared/refs.bib` 的文件是全项目所有文档模板（01-FA, 02-SRS, 03-HLD 等）唯一的、绝对权威的共享文献源。
* **任何引用的增删、修改必须首先且唯一应用到该共享源头文件中**。
* 严禁只修改局部的 `ref/refs.bib` 副本而不修改 shared 源文件。
* 修改源文件后，Agent 必须编写或运行脚本将更新一键复制同步至 `01-FA/templates/ref/refs.bib`、`02-SRS/templates/ref/refs.bib` 和 `03-HLD/templates/ref/refs.bib`，保持多处文献源一致。

### 3.4.1 正文引用闭环与 `\nocite{*}` 风险
正式文档的文后参考文献必须由正文真实引用驱动。主文件中的 `\nocite{*}` 会把 `refs.bib` 中所有条目无差别写入参考文献表，容易掩盖“文后有条目但正文没有引用”的学术硬伤。Agent 在修改 01-FA、02-SRS、03-HLD 或后续生命周期文档时，必须优先移除 `\nocite{*}`；若因模板演示或阶段性审查暂时保留，交接报告必须列出所有未被正文 `\cite{}` 命中的条目及保留理由。

### 3.4.2 交叉引用闭环审查
所有 `\label{}` 必须服务于正文阅读，不得只为了“看起来规范”而孤立存在。图、表、公式、算法和章节 label 应至少被一个 `\ref{}`、`\autoref{}` 或语义等价表述引用；所有 `\ref{}`、`\pageref{}`、`\cite{}` 在编译日志中不得出现 undefined，所有 label 不得重复定义。若 `.log` 中出现 `multiply defined`、`undefined references` 或 `undefined citations`，即使 PDF 成功生成也不得交付。

### 3.5 参考文献自引硬伤与去本地路径避坑指南

#### 1. 参考文献自引“一票否决”学术硬伤避坑
* **踩坑描述**：为了快速补齐证据，Agent 容易直接把本项目的 `LingoBridge技术调研小组`、`LingoBridge语音集成小组` 的内部草稿/Markdown 文档作为参考文献著录。这在学术审查或毕业设计评审中属于循环论证风险。
* **避坑动作**：**必须建立客观、第三方的外部学术支撑**。严禁将任何本项目内部小组的临时调研文件、Spike 计划写进 bib 库。如果原 `.tex` 已经绑定了特定的引用 ID（如 `Ref-AzureTTS`），不得随意改动 `.tex` 中的 `\cite{}` 命令，而应在 `refs.bib` 中使用“保 ID 置换”方式：将底层 bib 内容置换为等价支撑的外部经典教材、IEEE/ACM 学术论文、云厂商官方 SLA 资费与白皮书等可核验来源。

#### 2. 本地绝对路径泄漏避坑
* **踩坑描述**：在 bib 或 skill 中，极易将 `file:///Users/<username>/...` 等本地私有绝对路径写进 `url` 著录项中。这不仅暴露了私人主目录隐私，而且在其他环境下直接失效，属于不专业的交付缺陷。
* **避坑动作**：一律禁止使用本地私有路径！如果确需引用项目中的关联技术规范，必须将其统一托管至项目的官方公开 GitHub 仓库路径（如 `https://github.com/githoldder/lingobridge/blob/main/docs/...`），保持更专业的开源工程可追溯性，并支持点击直接跳转。

#### 2.1 幻觉参考文献与过旧来源避坑
* **踩坑描述**：Agent 可能根据主题自动拼出看似合理的英文论文题名、作者、期刊名和年份，但该论文在互联网、DOI 系统和学术数据库中并不存在。这类“漂亮但不存在”的引用比没有引用更危险，会直接破坏论文可信度。
* **避坑动作**：新增文献前必须先确认可检索入口，优先记录 DOI、URL、ISBN、标准号或官方发布页面。AI/机器学习、在线教育平台、云服务、Web API、市场规模等当前性较强的论据默认使用近 3 年来源；超过 3 年的条目必须说明其属于经典理论、标准法规、历史基线或无新版替代资料。无法确认真实性时，只能写入调研待办，不得写入正式 `refs.bib`。

#### 3. 超长表格下边界溢出与 longtable 避坑指南
* **踩坑描述**：在编写长达 8 行以上、单元格文字较多的数据或路由矩阵表格时，Agent 习惯性使用普通的 `table` 环境加上 `[H]` 物理定位以及 `tabularx` 语法。这种排版方式在 LaTeX 中会将整个表格视为一个不可分割的原子盒子（Box）。一旦表格总高度超出剩余页面空间（甚至超出单页上限），LaTeX 无法自动执行折行换页（Page Break），导致表格下半部分直接超出页面底端（Bottom margin）被强行截断，出现“掉出纸张边界”的严重排版事故。
* **避坑动作**：
  1. **行数 $\ge 6$ 行且单元格含有长中文描述、API 路径、URL、DTO、文件名或代码标识符的表格，绝对禁止使用 table + tabularx 环境**，必须拆分为多张短表或全量强制替换为 `longtable` 环境。
  2. 在 `longtable` 头部，利用 `\endhead` 定义每一页自动复制并呈现的标准表头；利用 `\endfoot` 定义页尾，保证跨页时排版的连续性。
  3. 为 `longtable` 的每一列显式指定具体的 `p{...}` 宽度（例如第一列方法 `p{1.2cm}`，第二列路径 `p{4.2cm}`，以此类推），确保各列宽度之和略小于 `\textwidth`，降低 Overfull horizontal box（横向右边界溢出）警告风险。
  4. 对于纯英文字符、超长 URL 或 API 路由路径（如 `/api/v1/assignments/import`），LaTeX 默认不支持在单词内拆行。**必须显式在长路径的斜杠或单词接缝处插入 `\allowbreak` 指令**，允许其在单元格内根据宽度自动折行，从而形成可审阅的跨页大表排版。

#### 4. API 路由长表“已换 longtable 仍然字重叠”特殊案例
* **触发场景**：HLD、API 文档或接口设计章节中，表格已经改成 `longtable`，但 PDF 中仍出现 `/api/v1/...`、DTO 名称或 `live-sessions/:id/...` 等等宽字体内容压入右侧中文列，表现为“路由路径”和“鉴权角色/状态/需求追踪”互相覆盖。
* **根因判断**：`longtable` 只解决纵向分页，不自动解决横向排版。若列宽总和加默认 `\tabcolsep` 超过正文宽度，或长英文路径缺少足够断点，仍会出现 Overfull 与可见字重叠。
* **标准修复顺序**：先局部包裹 `\begingroup...\endgroup`，在组内设置 `\footnotesize`、`\setlength{\tabcolsep}{3pt}` 和适度 `\renewcommand{\arraystretch}{1.15}`；随后重新分配每个 `p{...}` 列宽，保证总宽度加列间距小于 `\textwidth`；再为所有路径按 `/api/\allowbreak v1/\allowbreak ...`、`live-\allowbreak sessions`、`:id/\allowbreak signals` 的粒度插入断点。若表格跨页，第一页使用带 `\label` 的 `\caption{...}`，续页必须使用 `\endfirsthead` 与 `\caption[]{...（续）}`，不得重复 label。
* **验证门槛**：不能只看编译是否成功。必须执行日志扫描确认接口表行号附近没有 `Overfull \hbox` 与 `multiply defined labels`，并把接口表所在 PDF 页渲染为图片进行肉眼检查。若仍能看到字压字，必须继续拆表或转为“概览表 + 明细表”。

#### 5. 图表浮动导致页面大面积留白避坑
* **触发场景**：表格、图片、公式或长列表被 LaTeX 浮动机制推迟到下一页，导致上一页只剩少量正文、章节标题或大片空白。此时日志可能没有 fatal error，但 PDF 视觉质量已经不合格。
* **修复顺序**：先判断对象是否过大；表格优先拆分或改用 `longtable`，图片优先从 `0.95\textwidth` 收敛到合适比例，公式组可拆成多行或移入附录。若问题来自浮动体堆积，应调整图表锚点或将说明段落前移，避免连续多个浮动体占据页面队列。
* **验收动作**：必须渲染 PDF 页图并肉眼确认。除封面、目录、章节首页、参考文献起始页、附录起始页或学校模板强制留白外，若某页有效正文面积低于约 40%，交付报告必须说明原因；若原因是图表跳页，则必须修复后重新编译。

---

## 四、学术级 `booktabs` 三线表强约束生成与审计规范

为了让后续接手 LingoBridge 项目的所有 Agent 生成符合学术出版习惯的三线表，系统将 LaTeX `booktabs` 宏包规范作为项目的硬性标准，所有表格的排版与审计必须遵守本规范。

### 4.1 三线表的学术底线原则
- **核心命令与线宽分级**：顶线必须使用 `\toprule`（通常较粗），表头与表体之间必须使用 `\midrule`（通常较细），底线必须使用 `\bottomrule`（通常较粗）。这三条线由 `booktabs` 内部自动控制线宽和上下预设留白间距。**绝对禁止使用 `\hline`**。
- **一票否决之“绝对禁止竖线”**：在 `tabular`、`tabularx` 或 `longtable` 的列格式声明中，**绝对禁止出现任何竖线符 `|`**（例如严禁使用 `{|c|c|c|}`，必须写为 `{ccc}` 或 `{p{3cm} p{8cm}}`）。竖线不仅会阻碍阅读流畅度，而且在逻辑与物理上与 `booktabs` 的横线边距机制发生严重排版冲突。
- **表体内部禁止滥用横线**：标准三线表原则上只在表头和表体之间放置一条 `\midrule`。表体数据行之间绝不允许频繁使用横线进行物理区隔。如确实需要进行数据逻辑分组，应优先使用 `\addlinespace` 留出微间距，或极少量地在局部使用 `\cmidrule(lr){起始列-结束列}`。

### 4.2 表题、标签与单位对齐标准
- **表题与标签相对位置**：中文论文规范中，表题通常统一居中放在表格上方。在 LaTeX 中，`\caption{表题}` 必须放置在 `tabular` / `longtable` 声明之前，而用于交叉引用的 `\label{tab:英文短标签}` **必须紧跟在 `\caption{}` 之后**。绝对禁止将 `\label` 放在 `\caption` 之前或 `tabular` 之后，否则会导致 PDF 编译出来的引用编号出现异常漂移。
- **单位入表头**：表头字段必须清晰明确，任何度量衡单位必须使用小括号包裹，作为整体写入表头中（例如：`准确率(\%)`、`时间(ms)`、`文件大小(MB)`），表体内数据只保留纯净的数值或哈希。
- **高阶小数点对齐 (`siunitx`)**：对于学术级实验结果表或数值对比表，数字列优先在导言区加载 `\usepackage{siunitx}` 并在 `tabular` 列声明中使用大写字母 `S` 属性实现数字列小数点位置的物理居中对齐，杜绝普通 `c` 或 `r` 对齐造成的参差感。
- **表下注释规范 (`threeparttable`)**：如果表格下方存在显著性说明、缩写释义或数据来源，必须使用 `threeparttable` 包裹，并将说明内容统一写入标准的 `tablenotes` 降级环境（通常采用 `\footnotesize` 字体）中渲染。

### 4.3 审稿级 LaTeX 表格质量审计清单
在交付生命周期文档前，Agent 必须充当严肃的 LaTeX 学术论文审查员，对文档内所有表格执行如下 12 条军规级扫描过滤：
1. 是否根除 `\hline`？
2. 列声明中是否有任何 `|` 字符？
3. `\caption{}` 是否位于表格顶部且 `\label{}` 紧随其后？
4. 长单词/长路径（如 URL / DTO 纯英文字符串）是否注入了足够的 `\allowbreak` 折行指令以防止 Overfull horizontal overlap 重叠溢出？
5. 多级表头是否规范使用了 `\multicolumn` 和 `\cmidrule(lr){}` 组合？
6. 表体行之间是否滥用了横线？（是否多于三条主横线）
7. 表格在超长（行数 $\ge 6$ 行且字数多）时是否全量启用了 `longtable` 环境而非普通的 table 环境？
8. 表格是否能被 XeLaTeX 编译且无 undefined control 警告？
