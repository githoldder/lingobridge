# Document LaTeX Injection And Delivery Workflow

Use this workflow for LingoBridge lifecycle documents, LaTeX formal writing, GB/T-style charts, and software engineering deliverables.

## Skills

- `.agent/skills/01_latex_infrastructure/SKILL.md`
- `.agent/skills/01_latex_infrastructure/structured-injection-review.md`
- `.agent/skills/05_lingobridge_docs_standard/SKILL.md`
- `.agent/skills/05_lingobridge_docs_standard/document-engineering-writing.md`
- `.agent/skills/05_lingobridge_docs_standard/gbt-chart-and-modeling.md`
- `.agent/skills/05_lingobridge_docs_standard/software-engineering-docs.md`
- `.agent/skills/05_lingobridge_docs_standard/document-quality-checklist.md`

## Flow

1. Identify the target document and lifecycle stage.
2. Read the relevant source material from `docs/01-reference`, `prds/`, `context/`, or `drafts/`.
3. Generate a structured patch, not free Markdown prose.
4. If the target is LaTeX, apply `structured-injection-review.md`.
5. If the content includes charts, tables, UML, architecture diagrams, or process diagrams, apply `gbt-chart-and-modeling.md`.
6. If the document is SRS/HLD/LLD/API/test/deploy/user manual, apply `software-engineering-docs.md`.
7. Run syntax, format, academic/document reviewer, and quality checklist reviews.
8. Inject the approved patch.
9. Build, render, or preview the output.
10. Record checkpoint and commit-ready summary.

## Hard Rules

1. Do not paste AI Markdown prose into formal documents.
2. Do not invent citations, requirement IDs, test IDs, architecture claims, or cost numbers.
3. Do not inline large TikZ or drawing code into `.tex`; prefer external diagram artifacts.
4. Do not modify `.cls` or template infrastructure unless the task explicitly requires it.
5. Every deliverable document must pass a quality checklist before handoff.
6. Do not use itemize or enumerate lists in LaTeX prose. Every paragraph must be a coherent, fluid academic natural section.

## Delivery Verification Protocols

### 1. Pre-delivery Command Gate (交付前强制正则清扫)
在正式向用户交付或宣布完成前，**必须**在终端执行以下指令执行全仓静态扫描，阻断 Markdown 残留及绝对路径泄漏。任何扫描结果中如果存在匹配项，**判定为 fail，必须整改后复扫**：
```bash
rg -n '\\*\\*|file:///Users|/Users/caolei/|```|TODO|undefined' docs/00-project-docs/01-FA/templates/data/ docs/00-project-docs/02-SRS/templates/data/ docs/00-project-docs/03-HLD/templates/data/ docs/00-project-docs/shared/refs.bib .agent/skills/ .agent/workflows/
```

### 2. Citation Source Synchronization (文献源同步链)
若修改了参考文献，必须严格遵循同步流水线，保持各文档副本与共享源一致：
```
修改 [shared/refs.bib] 权威源头 -> 一键同步至 [01-FA/templates/ref/refs.bib] -> 一键同步至 [02-SRS/templates/ref/refs.bib] -> 一键同步至 [03-HLD/templates/ref/refs.bib]
```
不允许只修改局部副本而遗忘源头，否则会导致后续迭代及其他模板被重新污染。

### 3. Log Classification Report (日志分级审计)
禁止把“编译生成 PDF”简单地等同于“无问题”。交接报告必须对 XeLaTeX 编译日志进行分级事实汇报：
* **Fatal Errors**：导致编译中断的阻断性错误（必须为 0）。
* **Undefined Citation/Reference**：未定义引用（必须为 0，如有必修）。
* **Non-blocking Warnings**：包括 `overfull \hbox`、`underfull \hbox` 或 `rerun LaTeX` 等警告（必须如实列出数量和分布，禁止伪造“0 warning”）。

### 4. 交接语审计 (No Exaggerated Claims)
Agent 在做交付汇报时，**禁止使用“彻底”、“100%”、“完美”、“完全符合”等绝对化的、充满傲慢的词汇**。应保持极度谦逊，只有在有具体的静态扫描命令和真实的 XeLaTeX 日志作为确凿事实支撑时，方可以事实为准绳进行低调客观的陈述。

### 5. Paragraph Coherence Audit (学术自然段清剿列表检测)
Agent 在交付前，必须审查并确保目标修改文档的正文段落（除硬性表格和定义清单外）中无任何 `itemize` 或 `enumerate` 列表环境。所有分点表述必须合并改写为通过因果、递进、对照与限定关系自然贯通的学术长自然段，可使用“在……方面”“与此同时”“相应地”“由此”“此外”等承接表达，但不得机械套用序号式模板词。
