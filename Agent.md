# Agent Guide

This file is the first stop for AI workers operating in this repository.

## Operating Principle

Use [prds/prd.md](./prds/prd.md) as the navigation entry, then read the active sprint file under [prds/sprints](./prds/sprints/). Keep [prds/prd.json](./prds/prd.json) parseable for older agent prompts that still require it. The approved source PRD is:

`/Users/caolei/Desktop/Obsidian_root/011_项目经验/互联网+/lingobridge/Records&Drafts/03-02-LingoBridge MVP PRD v2.0.md`

The MVP is a single-tenant CZU demo, not a full LMS or SaaS platform.

## Current State

- Existing frontend is a Vite/React prototype at repository root.
- `frontend/` is intentionally not created yet as a code home in this light refactor.
- `backend/`, `docker/`, `tests/`, and `scripts/` are placeholders for the next implementation phase.
- Do not move root frontend files unless a task explicitly includes build/Vercel migration.

## Work Rules

1. Do not commit or print real secrets.
2. Do not broaden MVP scope into multi-tenant, payments, social features, or AI pronunciation scoring.
3. Keep demo-critical work focused on teacher upload, student TTS/recording, teacher replay, and public test deployment.
4. Preserve existing frontend visual style unless the task explicitly asks for redesign.
5. Update the matching `prds/sprints/sprint-NN-...` file when a task is completed; update `prds/prd.json` only when an older machine-readable workflow still depends on it.
6. Add new docs to the correct folder instead of the repository root.

## Folder Rules

| Folder | Use |
|---|---|
| `.agent/rules/` | Durable rules for AI/human collaboration |
| `.agent/workflows/` | Repeatable workflows such as backend implementation or deployment |
| `context/` | Short, high-signal project context |
| `docs/` | Reference docs and longer technical notes |
| `drafts/` | Unapproved drafts |
| `prds/` | Approved PRD/control outputs |
| `prompts/` | Prompts for sub-agents or other AI tools |
| `templates/` | Reusable task/report templates |
| `tests/fixtures/` | PPT/PDF/Excel/audio/video sample assets |

## Audit Gate

Before handoff, verify:

- `npm run build` passes when frontend files change.
- Backend health passes when backend files change.
- No `.env` or uploaded media files are committed.
- Camera/mic/screen tracks stop on toggle off and exit.
- The MVP core loop is no longer mock-only.
