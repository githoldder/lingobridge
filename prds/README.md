# PRD Folder Maintenance Guide

This folder stores product requirements, sprint execution plans, and machine-readable task packages for LingoBridge.

## Directory Layout

| Path | Purpose | Write Rule |
|---|---|---|
| `prd.md` | Lightweight compatibility index | Update only when navigation or canonical files change |
| `prd.json` | Legacy machine-readable package used by existing prompts | Keep parseable; do not keep appending narrative text |
| `current/` | Cross-sprint product baseline and current decisions | Write stable product decisions here |
| `sprints/` | Sprint-numbered OKRTS, execution plans, and reviews | Write sprint work here first |
| `machine/` | Split machine-readable summaries | Write JSON slices here when agents need structured input |
| `archive/` | Superseded or obsolete PRD material | Move stale versions here with dates |

## Canonical Reading Order

For a normal implementation task:

1. Read `prd.md` for navigation.
2. Read the active sprint file in `sprints/`.
3. Read only the needed `current/` baseline files.
4. Use `prd.json` only when an older prompt explicitly asks for it.

For Sprint 6 prelaunch work, read:

1. `sprints/sprint-06-prelaunch-smoke-deploy.md`
2. `current/01-current-status-and-guardrails.md`
3. `current/03-api-acceptance-and-next-questions.md`
4. `prd.json` only for compatibility checks.

## Naming Standard

Sprint files:

```text
sprint-NN-short-topic-okrts.md
sprint-NN-short-topic-review.md
sprint-NN-execution-plan.json
```

Examples:

- `sprint-04-data-pdf-course-okrts.md`
- `sprint-04-technical-review.md`
- `sprint-06-prelaunch-smoke-deploy.md`

Current baseline files:

```text
NN-short-topic.md
```

Machine files:

```text
prd-vMAJOR.MINOR-short-topic.json
sprint-NN-execution-plan.json
```

## Update Rules

- Do not append new sprint content to root `prd.md`.
- Do not make `prd.json` the only source of truth for a new sprint.
- Every task must have a sprint ID, for example `S6-T04`.
- Every sprint file should include Objective, Key Results, Task Breakdown, Execution Order, and Exit Criteria or Definition of Done.
- If a cross-sprint decision changes product behavior, update `current/00-latest-product-decisions.md`.
- If a sprint status changes, update the sprint file first, then update `current/01-current-status-and-guardrails.md` only when the change affects global execution.
- If a file is superseded, move it to `archive/YYYY-MM-DD-original-name.md` instead of deleting it.

## Maintenance Checklist

Run this checklist after each sprint or before major deployment work:

- [ ] Root `prd.md` is under 100 lines and only acts as an index.
- [ ] Active sprint file is the single narrative source for current tasks.
- [ ] Machine JSON files parse with `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`.
- [ ] No new unnumbered sprint files were added.
- [ ] Stale drafts are in `archive/`.
- [ ] Any agent prompt points to the split files instead of the old giant PRD where possible.

## Current Files

| File | Purpose |
|---|---|
| `current/00-latest-product-decisions.md` | Latest cross-sprint product decisions from PRD v4.6 |
| `current/01-current-status-and-guardrails.md` | Status, risk, guardrails, and OKRTS phase prompts |
| `current/02-product-boundary-and-business-rules.md` | Diagnosis, product boundary, rules, module boundaries |
| `current/03-api-acceptance-and-next-questions.md` | API boundaries, acceptance, closeout, next strategy questions |
| `sprints/sprint-03-mvp-recovery-okrts.md` | Sprint 3 plan |
| `sprints/sprint-04-data-pdf-course-okrts.md` | Sprint 4 OKRTS |
| `sprints/sprint-04-execution-plan.json` | Sprint 4 machine execution plan |
| `sprints/sprint-04-technical-review.md` | Sprint 4 technical review |
| `sprints/sprint-05-class-live-learning-cache-okrts.md` | Sprint 5 OKRTS |
| `sprints/sprint-06-prelaunch-smoke-deploy.md` | Sprint 6 prelaunch plan |
| `sprints/sprint-07-candidate-speech-demo-spike.json` | Candidate speech demo spike plan |
| `machine/prd-v4.6-current-summary.json` | Split current machine summary |

