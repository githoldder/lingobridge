# Agent Ops Governance Rules (人类-AI 协同治理与本地提交规范)

This document establishes the canonical **Dual-Plate Governance, Requirement Synchronizer, and Git Task-Commit disciplines** for LingoBridge. All working agents must strictly adhere to these rules to maintain absolute codebase stability and prevent breaking regressions.

---

## 1. Project Plates: Layered Separation

LingoBridge divides ownership into two clean layers: the Human Layer (Strategic Milestones) and the Agent Layer (Technical Execution).

### 1.1 The Human Layer (战略与纠偏层)
* **Responsibility**: Outlines broad business **Objectives** and quantitative **Key-Results (KR Milestones)**. Drafts requirements, reviews code, and holds ultimate branch-merging authority.
* **Blockage Intervention (5W Root Cause Framework)**:
  When an Agent encounters a terminal blocker (Blockage), it must immediately raise a help signal. The Human will step in and apply the **5W Diagnosis** to resolve the root cause:
  1. **What**: What is the exact technical symptom or error?
  2. **Why**: Why did it fail? (Traced through 5 iterative "Why" questions).
  3. **Where/Who**: Where in the stack is the blocker located?
  4. **When**: When was the regression or limitation introduced?
  5. **How**: How do we resolve it? (Based on Human experience or deep technical research).

### 1.2 The Agent Layer (微观技术执行层)
* **Responsibility**: Owns technical task breakdowns, implementation details, dependencies, and code compliance.
* **Workspace Boundaries**:
  * `.agent/`: Houses global rules, skillsets (`skills/`), and repeatable release/smoke workflows (`workflows/`).
  * `prds/`: Translates raw functional goals into actionable technical instruction packages.

---

## 2. Requirement Reorg & Naming (Dual-Plate PRD)

We split requirement specs into two corresponding formats inside `prds/`:

### 2.1 Human Markdown Plate (`prds/md/`)
* **Path**: `prds/md/sprint{NN}-prd-{YYMMDD}-v{Version}.md`
* **Contents**: High-level Objective, Milestones (Key-Results), and Tasks lists.
* **Format Guidelines**: Every update requires identifying the current date and appending the precise update time in minutes:
  `Last Updated: YYYY-MM-DD HH:MM` (e.g. `Last Updated: 2026-05-25 11:08`).

### 2.2 Agent JSON Plate (`prds/json/`)
* **Path**: `prds/json/sprint{NN}-prd-{YYMMDD}-v{Version}.json`
* **Contents**: Machine-parseable micro-steps, references, inputs, and validation instructions mapping 1-to-1 with the Markdown Plate.

### 2.3 The Sync Discipline
* Both `.md` and `.json` plates are **synchronized automatically by the Agent**. Humans should only write/edit the Markdown files; the Agent holds responsibility for generating and matching the corresponding JSON instruction matrix.

---

## 3. Git Task-Commit Code of Conduct

To prevent massive breaking code leaks and regression in critical features (such as PDF viewing or classroom media flows), LingoBridge enforces a strict Git workflow:

1. **Local Commit-per-Task**:
   Upon completing any micro-task (e.g., S6-T01, S6-T02) and executing its verification steps, the Agent **must immediately stage and commit** the changes locally.
   * *Command Example*:
     ```bash
     git add <changed-files>
     git commit -m "docs/ops: complete task S6-TXX (Description)"
     ```
2. **Zero Remote Push**:
   During active sprint execution, all commits **must remain strictly local**. The Agent is forbidden from running `git push` to remote origins.
3. **Local Staging**: All commits must remain local. Zero push to the remote origin is allowed during execution. The human will review and batch-push the commits upon Sprint sign-off.

---

## 4. Ralph Execution Framework (四层分解约束)

所有文档生产和工程开发活动必须遵循 Ralph 四层分解模型：**Object → Key-Result → Task → Step**。详细规则参见 [ralph-execution-framework.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/ralph-execution-framework.md)。

核心执行纪律：
* **单次单问题**：Agent 每次只处理一个 Step，禁止跨 Step 混合执行。
* **调研先行**：涉及内容产出的 Step 必须先完成文献检索和调研日志。
* **脚本注入优先**：通过精确行号替换注入纯 LaTeX 源码，禁止全文覆写。

---

## 5. Adversarial Audit Protocol (对抗式审核)

所有生命周期文档（01-FA 至 07-UM）的内容产出必须经过执行-审核双 Agent 对抗环。详细规则参见 [adversarial-audit.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/adversarial-audit.md)。

核心机制：
* **Executor** 按原子任务产出 LaTeX 内容。
* **Auditor** 以"毒舌论文打假专家"人设执行 7 维度扫描。
* 审核不通过则 Executor 按修正指令逐条修复后重新提交。
* 三次返修仍 FAIL 则终止并上报人类层。
