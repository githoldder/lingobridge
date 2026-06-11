# Ralph 执行框架 (Ralph Execution Framework)

Ralph 是 LingoBridge 项目的核心迭代约束框架，将宏观出版目标拆解为可被 Agent 原子执行的最小任务单元。所有文档生产和工程开发活动必须严格遵循此四层分解结构。

---

## 一、四层分解模型

```text
Object (大目标)
  └── Key-Result (阶段性关键结果)
        └── Task (Sprint 级任务)
              └── Step (JSON 约束的原子步骤)
```

### Layer 1: Object (大目标)
- 定义：项目的终极交付物或里程碑（如"完成可行性研究报告出版"）。
- 归属：人类层战略规划。
- 存储：`prds/md/` 的 Objective 字段。

### Layer 2: Key-Result (关键结果)
- 定义：达成 Object 所需的阶段性可量化成果（如"01-FA 通过国标 GB/T 8567 合规审查"）。
- 特征：每个 KR 必须可量化、可验证。
- 存储：`prds/md/` 的 Key-Results 列表。

### Layer 3: Task (Sprint 任务)
- 定义：单次 Sprint 中的可交付任务（如"完成 chap01.tex 经济可行性章节"）。
- 约束：
  - 每个 Task 必须有明确的输入/输出定义。
  - 每个 Task 完成后必须执行 Git Task-Commit。
- 存储：`prds/md/` 的 Tasks 列表 + `prds/json/` 的对应结构。

### Layer 4: Step (原子步骤)
- 定义：Task 内的最小可执行单元（如"使用 skill-02 调研 Azure TTS 定价 → 写入 chap01 第 3.2 节第 2 段"）。
- JSON 约束字段：
  ```json
  {
    "step_id": "S07-T01-STEP03",
    "action": "research_then_write",
    "skill_ref": "02_research_and_sourcing",
    "target_file": "docs/00-project-docs/01-FA/templates/data/chap01.tex",
    "target_location": "section 3.2, paragraph 2",
    "input_refs": ["docs/01-reference/azure-speech-tts-provider.md"],
    "output_format": "latex_paragraph",
    "audit_required": true
  }
  ```
- 存储：`prds/json/` 的 steps 数组。

---

## 二、执行规程

### 2.1 单次单问题原则
Agent 每次只处理一个 Step。禁止在单次调用中跨多个 Step 混合执行。

### 2.2 调研先行原则
任何涉及内容产出的 Step，必须先执行调研阶段：
1. 读取指定 skill 中的调研规范。
2. 检索 `docs/01-reference/` 中的一手文献。
3. 如有必要，通过 `search_web` 补充外部权威信源。
4. 生成调研摘要（存入 `docs/01-reference/` 或 scratch 目录）。

### 2.3 产出-审核闭环
所有内容产出必须经过对抗式审核（参见 `adversarial-audit.md`），审核通过后方可写入目标文件。

### 2.4 Commit 纪律
每个 Task 完成后立即执行本地 Git Task-Commit，commit message 格式：
```
docs/<scope>: complete <task_id> (<brief description>)
```

---

## 三、脚本注入 vs 文本注入

### 3.1 优先脚本注入
- Agent 在向 `.tex` 文件注入内容时，优先通过代码编辑工具的精确行号替换进行注入。
- 禁止通过大段文本复制粘贴式的"全文覆写"注入。

### 3.2 防止格式污染
- 脚本注入的内容必须是纯 LaTeX 源码字符串，不经过任何 Markdown 渲染管道。
- Agent 在生成注入内容时，必须在内部将输出模式切换为"raw LaTeX mode"，完全跳过 Markdown 格式化习惯。

### 3.3 注入前校验
- 每次注入前，Agent 必须对待注入内容执行正则扫描：
  - 扫描 `\*\*`, `` ` ``, `^#+ `, `^- `, `^\d+\. ` 等 Markdown 特征模式。
  - 命中任何一个即中止注入，回退重新生成。

---

## 四、与现有规则的层级关系

```text
ralph-execution-framework.md (本文件)
  ├── 引用 → adversarial-audit.md (对抗式审核)
  ├── 引用 → latex-writing-discipline.md (LaTeX 写作防线)
  ├── 引用 → agent-ops-governance.md (Git 纪律 + 双板协议)
  └── 引用 → skills/05_lingobridge_docs_standard (本地化规范)
```
