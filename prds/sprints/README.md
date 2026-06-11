# Sprint PRD Files

Use this folder as the canonical source for sprint-numbered execution.

## Active Files

| Sprint | File | Format | Purpose |
|---|---|---|---|
| Sprint 3 | `sprint-03-mvp-recovery-okrts.md` | Markdown | MVP recovery and public trial closure |
| Sprint 4 | `sprint-04-data-pdf-course-okrts.md` | Markdown | Real data, Postgres, PDF, course closure |
| Sprint 4 | `sprint-04-execution-plan.json` | JSON | Machine-readable task operations |
| Sprint 4 | `sprint-04-technical-review.md` | Markdown | Technical review |
| Sprint 5 | `sprint-05-class-live-learning-cache-okrts.md` | Markdown | Class/live/homework cache model upgrade |
| Sprint 6 | `sprint-06-prelaunch-smoke-deploy.md` | Markdown | Prelaunch smoke, deployment, tutorials |
| Sprint 7 | `sprint-07-public-https-demo-deploy.md` | Markdown | Public domain, trusted HTTPS, camera/microphone demo deployment |
| Sprint 7 | `sprint-07-public-https-demo-deploy.json` | JSON | Canonical machine-readable execution contract for public HTTPS deployment |
| Candidate Sprint 7 | `sprint-07-candidate-speech-demo-spike.json` | JSON | Speech demo and subtitle spike candidate |
| Sprint 11 | `../json/sprint11-prd-260606-v0.1.json` | JSON | Demo-first data console and analytics API integration |
| Sprint 12 | `../json/sprint12-prd-260606-v0.1.json` | JSON | Public dataset, data pipeline, ML modeling, and report figures |
| Sprint 13 | `../json/sprint13-prd-260606-v0.1.json` | JSON | Student and teacher product depth, mock reduction, dashboards |
| Sprint 14 | `../json/sprint14-prd-260606-v0.1.json` | JSON | LingoBridge 2.0 software-engineering document synchronization |

## Write Rules

- Use two-digit sprint numbers: `sprint-06-...`.
- Use task IDs in the form `S6-T01`.
- One sprint file should own its own Objective, Key Results, Task Breakdown, Execution Order, and Exit Criteria.
- JSON files are for agent execution and must parse cleanly.
- For Sprint 7 public HTTPS deployment, update `sprint-07-public-https-demo-deploy.json` first; Markdown is background context.
- Do not create unnumbered files such as `next-plan.md` or `latest.md`.
