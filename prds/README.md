# PRD Directory & Synchronization Governance

This directory serves as the unified specification center for LingoBridge, governing both human review and agent execution. It follows the **Sprint-Bound Dual-Plate Protocol**, establishing a clean boundary between high-level objectives and concrete machine instructions.

---

## Directory Architecture

```text
prds/
  ├── README.md               # This governance guide
  ├── md/                    # Human-focused markdown plates (Objectives & KR Milestones)
  │   └── sprintNN-prd-YYMMDD-vX.Y.md
  └── json/                  # Agent-focused json plates (Micro task breakdowns & steps)
      └── sprintNN-prd-YYMMDD-vX.Y.json
```

---

## The Dual-Plate Protocol

To maintain extreme robustness and prevent codebase regression, we separate requirements into two synced formats:

### 1. Human Markdown Plate (`prds/md/`)
* **Target Audience**: Human / Product Manager
* **Content**: Quantifiable high-level **Key-Results (KR Milestones)** and high-level **Tasks** list.
* **Format**: `sprint{NN}-prd-{YYMMDD}-v{X.Y}.md`
* **Sync Rule**: Created or modified by the Agent whenever a new human request or quantitative goal is approved.

### 2. Agent JSON Plate (`prds/json/`)
* **Target Audience**: AI Agent / Tech Lead
* **Content**: High-density **micro task-steps, parameters, dependencies, references, and acceptance criteria**.
* **Format**: `sprint{NN}-prd-{YYMMDD}-v{X.Y}.json`
* **Sync Rule**: The Agent reads instructions here to carry out actions. Must map 1-to-1 with the Markdown Plate.

---

## Synchronization & Versioning Rules

1. **AI Synchronization**:
   - Both `.md` and `.json` files are automatically synchronized and managed by the AI Agent. Humans only edit or review the Markdown files.
2. **Naming Convention**:
   - `sprintNN-prd-YYMMDD-vX.Y.{md|json}`
   - Example: `sprint06-prd-260525-v0.1.md` and `sprint06-prd-260525-v0.1.json`.
3. **Temporal Discipline**:
   - Every file must contain an explicit timestamp in the headers:
     `Last Updated: YYYY-MM-DD HH:MM` (e.g., `Last Updated: 2026-05-25 11:08`).
   - Every update requires checking the date and minute to ensure maximum traceability.

---

## Git Task-Commit Discipline

* **Zero-Regression Rule**: To prevent unexpected file conflicts or broad breaking regressions, all tasks are isolated at a micro-level.
* **Micro-Commits**: Upon completing any task's internal steps, the Agent must immediately perform `git add` and `git commit -m "<tag>: complete task <ID>"` locally.
* **Local Staging**: All commits must remain local. Zero push to the remote origin is allowed during execution. The human will review and batch-push the commits upon Sprint sign-off.
