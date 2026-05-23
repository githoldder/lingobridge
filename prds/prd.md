# LingoBridge PRD Index

> Status: compatibility entry point for agents and humans.
> Canonical sprint work now lives under `prds/sprints/`.
> Current cross-sprint product decisions live under `prds/current/`.

## Current Baseline

| Area | File |
|---|---|
| Latest product decisions | `current/00-latest-product-decisions.md` |
| Current status and guardrails | `current/01-current-status-and-guardrails.md` |
| Product boundary and business rules | `current/02-product-boundary-and-business-rules.md` |
| API, acceptance, and next questions | `current/03-api-acceptance-and-next-questions.md` |
| Machine-readable current summary | `machine/prd-v4.6-current-summary.json` |

## Sprint Files

| Sprint | Canonical file | Purpose |
|---|---|---|
| Sprint 3 | `sprints/sprint-03-mvp-recovery-okrts.md` | MVP recovery and public trial closure |
| Sprint 4 | `sprints/sprint-04-data-pdf-course-okrts.md` | Postgres, real data, PDF/course closure |
| Sprint 4 | `sprints/sprint-04-execution-plan.json` | Machine-readable task operations for agent execution |
| Sprint 4 | `sprints/sprint-04-technical-review.md` | Technical review and follow-up notes |
| Sprint 5 | `sprints/sprint-05-class-live-learning-cache-okrts.md` | Class/live/homework cache model upgrade |
| Sprint 6 | `sprints/sprint-06-prelaunch-smoke-deploy.md` | Prelaunch smoke, packaging, deployment, tutorials |
| Candidate Sprint 7 | `sprints/sprint-07-candidate-speech-demo-spike.json` | Speech demo and subtitle spike candidate plan |

## Compatibility Notes

- `prd.json` remains at the root for existing prompts that still require `prds/prd.json` to parse.
- New sprint updates should not be appended to this index. Update the matching file in `prds/sprints/`.
- Cross-sprint product decisions should be added to `prds/current/00-latest-product-decisions.md` and summarized here only if they change the reading order.
