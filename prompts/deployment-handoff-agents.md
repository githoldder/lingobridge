# Deployment Handoff Agent Prompts

Use these prompts to split the remaining deployment/documentation work across independent agents. Each agent should work in its own branch or clearly report changed files before merge.

## Agent 1: Local Demo Runbook

```text
You are taking over the LingoBridge local demo runbook task.

Goal: create docs/03-testing-deployment/local-demo-runbook.md for a reliable localhost demo path for the imminent presentation.

Read first:
- Agent.md
- .agent/rules/project-map.md
- .agent/rules/deployment-boundaries.md
- .agent/workflows/devops-smoke-test.md
- drafts/08-multi-deploy-branch-and-agent-ops-plan.md
- README.md
- package.json
- docker/README.md if relevant

Requirements:
- Explain how to run the frontend and backend locally.
- Include localhost camera/mic secure-context note.
- Include teacher/student demo login assumptions without inventing secrets.
- Include small PDF upload and student recording smoke steps.
- Include fallback if Docker is unavailable.
- Do not modify business code.
- Do not add real credentials.

Acceptance:
- The runbook is concise and executable.
- It names exact commands where the repo already supports them.
- It clearly says local demo is the full media/upload fallback.
- It links or references .agent/workflows/devops-smoke-test.md.

Return:
- Files changed.
- Any commands you verified.
- Any unresolved assumptions.
```

## Agent 2: Overseas Vercel Runbook

```text
You are taking over the LingoBridge overseas Vercel runbook task.

Goal: create docs/03-testing-deployment/overseas-vercel-runbook.md for the HTTPS Vercel demo path.

Read first:
- Agent.md
- .agent/rules/deployment-boundaries.md
- .agent/skills/courseware-upload-debug/SKILL.md
- drafts/08-multi-deploy-branch-and-agent-ops-plan.md
- vercel.json
- .env.example
- docs/03-testing-deployment/tencent-cloud-docker-nginx-runbook.md

Requirements:
- Document Vercel as HTTPS frontend/light API/media-permission route.
- Explicitly warn that 20MB+ uploads through Vercel rewrite are out of scope/known risky.
- Include deployment variables and API base URL/rewrite checks.
- Include smoke steps for health, login, courses, and media permission.
- Include demo guidance: use preloaded or small assets; switch to localhost/Tencent direct for large uploads.
- Do not add secrets.
- Do not change runtime code unless you find a small documentation-linked config bug and explain it.

Acceptance:
- A new agent can deploy or validate the Vercel route without rediscovering the large-upload limitation.
- The runbook distinguishes Vercel from Tencent direct and local demo routes.

Return:
- Files changed.
- Commands or checks run.
- Risks left open.
```

## Agent 3: Tencent Direct Runbook Refresh

```text
You are taking over the Tencent direct deployment runbook task.

Goal: create or update docs/03-testing-deployment/tencent-runbook.md as the current Tencent direct deployment guide, using existing docs/03-testing-deployment/tencent-cloud-docker-nginx-runbook.md as source material.

Read first:
- Agent.md
- .agent/rules/project-map.md
- .agent/rules/deployment-boundaries.md
- .agent/skills/tencent-tat-patch-deploy/SKILL.md
- .agent/workflows/tencent-release.md
- docs/03-testing-deployment/tencent-cloud-docker-nginx-runbook.md
- drafts/08-multi-deploy-branch-and-agent-ops-plan.md

Requirements:
- Make the current public IP route explicit: http://101.34.72.227/api/v1
- Include health/login/direct multipart upload smoke steps.
- Include the warning that plain HTTP public IP is not the camera/mic demo route.
- Include remote dirty-tree protection guidance.
- Include TAT patch deploy as the short-term fallback when GitHub pull fails.
- Include rollback/restart guidance.
- Do not remove the existing older runbook unless asked.
- Do not add secrets.

Acceptance:
- The runbook is usable by an ops agent who has not seen the prior debugging session.
- It separates application source deploys from remote Docker/Caddy config edits.

Return:
- Files changed.
- Whether you created a new runbook or updated an existing one.
- Any missing server facts that need human confirmation.
```

## Agent 4: CI Workflow

```text
You are taking over the LingoBridge CI workflow task.

Goal: add .github/workflows/ci.yml for pull request and main-branch validation.

Read first:
- Agent.md
- package.json
- backend/package.json if present, otherwise inspect root scripts.
- playwright.config.ts
- .agent/rules/security.md
- .agent/rules/project-map.md

Requirements:
- Use GitHub Actions.
- Run npm ci.
- Run the repo's lint/test/build scripts that actually exist.
- Include backend tests if package scripts support them.
- Avoid requiring real cloud secrets.
- Do not run deployment.
- Cache dependencies if it is simple and safe.
- Keep workflow modest; demo project reliability matters more than elaborate matrix builds.

Acceptance:
- The workflow YAML is syntactically valid.
- It does not reference nonexistent scripts unless guarded or clearly adjusted.
- It can run on PRs without secrets.

Return:
- Files changed.
- Exact scripts wired into CI.
- Any scripts missing from package.json that you recommend adding separately.
```

## Agent 5: Prototype Vibe Coding Workflow

```text
You are taking over the prototype workflow documentation task.

Goal: create .agent/workflows/prototype-vibe-coding.md for quick product-prototype work inside LingoBridge.

Read first:
- Agent.md
- .agent/rules/mvp-scope.md
- .agent/rules/project-map.md
- .agent/workflows/mvp-implementation.md
- prds/current/README.md
- prds/sprints/README.md

Requirements:
- Define a workflow for fast prototype/product iteration.
- Keep it constrained by MVP scope.
- Emphasize starting from a user path, making the first screen usable, then adding edge states.
- Include design/testing guardrails for frontend work.
- Include when to update PRD/sprint docs.
- Do not modify app code.

Acceptance:
- A future agent can use the workflow without bloating scope into a SaaS/LMS.
- It is short, practical, and specific to this repo.

Return:
- Files changed.
- Any linked docs you relied on.
```

## Agent 6: Technical Research Workflow

```text
You are taking over the technical research workflow documentation task.

Goal: create .agent/workflows/technical-research.md for researching deployment, browser media, speech, object storage, and other technical options.

Read first:
- Agent.md
- .agent/rules/security.md
- .agent/rules/deployment-boundaries.md
- docs/01-reference/
- drafts/08-multi-deploy-branch-and-agent-ops-plan.md

Requirements:
- Define how to form a research question, gather sources, separate facts from assumptions, and produce a decision note.
- Require official docs or primary sources for cloud/browser/API behavior when possible.
- Require a repo impact section: files likely affected, env vars, tests, rollout risk.
- Include how to document rejected options.
- Do not browse unless your environment/tooling supports it and the task requires fresh facts.
- Do not add secrets.

Acceptance:
- The workflow prevents vague research dumps.
- It produces actionable recommendations and acceptance criteria.

Return:
- Files changed.
- Any open research questions you suggest next.
```

## Agent 7: Open Source Contributor Guide

```text
You are taking over the README contributor guide task.

Goal: update README.md or add docs/CONTRIBUTING.md with a concise open-source contributor guide for LingoBridge.

Read first:
- Agent.md
- README.md
- .agent/rules/project-map.md
- .agent/rules/security.md
- .agent/rules/mvp-scope.md
- prds/README.md
- docs/README.md

Requirements:
- Explain repo structure.
- Explain setup, build, test, and demo basics using existing package scripts.
- Explain PR expectations and scope limits.
- Explain no-secrets/no-uploaded-media rules.
- Point agents to Agent.md and .agent/ docs.
- Do not claim production readiness beyond what docs support.

Acceptance:
- A new contributor can orient in under 10 minutes.
- The guide does not duplicate long runbooks; it links to them.

Return:
- Files changed.
- Commands you verified.
- Any recommended follow-up docs.
```

## Agent 8: Environment Variable Matrix

```text
You are taking over the environment variable matrix task.

Goal: audit .env.example and create a clear deployment environment variable matrix, either by updating .env.example comments or adding docs/03-testing-deployment/env-matrix.md.

Read first:
- Agent.md
- .env.example
- README.md
- backend/src/
- src/services/apiClient.ts
- backend/src/providers/
- vercel.json
- docker/docker-compose.yml
- docker/docker-compose.host-backend.yml if relevant
- .agent/rules/security.md
- .agent/rules/deployment-boundaries.md

Requirements:
- List variables by local, Vercel, Tencent direct, and future COS/object storage routes.
- Mark required vs optional.
- Do not include real secrets.
- Include speech/TTS provider variables only as names and purpose.
- Include VITE_API_BASE_URL behavior.
- Mention which vars are frontend-build-time vs backend-runtime.

Acceptance:
- A deploy agent can configure an environment without reading the full codebase.
- No secret values are committed.
- The matrix reflects variables actually used by the code or clearly labels future variables.

Return:
- Files changed.
- Variables found in code.
- Variables that appear documented but unused, if any.
```
