# Project Map

This file is the quick orientation map for agents working in LingoBridge.

## Product Shape

LingoBridge is a single-tenant CZU Mandarin teaching MVP. Treat it as a demo-critical learning workflow, not a generic LMS or SaaS platform.

The core loop is:

1. Teacher logs in.
2. Teacher uploads courseware and homework assets.
3. Student opens assigned learning material.
4. Student uses TTS, recording, homework, and classroom flows.
5. Teacher reviews class/course/student progress.

## Primary Source Areas

| Path | Ownership |
| --- | --- |
| `src/` | Vite React frontend, views, API client, browser media flows |
| `backend/` | Express API, repositories, storage, providers, database integration |
| `backend/db/` | SQL schema and seed data |
| `docker/` | Local and Tencent Cloud container deployment assets |
| `scripts/` | Deploy helpers, health checks, screenshots, data cleanup, demo utilities |
| `tests/` | Manual smoke scripts, regression scripts, sample assets, acceptance reports |
| `e2e/` | Playwright end-to-end specs |
| `prds/` | Approved product and sprint control documents |
| `docs/` | Durable technical references, deployment notes, testing notes |
| `drafts/` | Unapproved plans and teacher-facing drafts |
| `prompts/` | Ready-to-send prompts for sub-agents or other AI tools |
| `.agent/` | Agent rules, skills, and repeatable workflows |

## Important Frontend Files

| Path | Notes |
| --- | --- |
| `src/components/App.tsx` | Main route/view orchestration |
| `src/context/AuthContext.tsx` | Auth state and session behavior |
| `src/services/apiClient.ts` | API base URL and request wrapper |
| `src/services/entryResolver.ts` | Courseware/homework entry resolution |
| `src/components/TeacherClassroomView.tsx` | Teacher live classroom and media-sensitive flow |
| `src/components/StudentClassroomView.tsx` | Student classroom and recording flow |
| `src/components/PdfViewer.tsx` | PDF rendering and drawing behavior |

## Important Backend Files

| Path | Notes |
| --- | --- |
| `backend/src/app.ts` | Express app, routes, middleware |
| `backend/src/server.ts` | Server startup |
| `backend/src/db.ts` | Database mode entry |
| `backend/src/db/postgres.ts` | Postgres connection and helpers |
| `backend/src/repositories/` | Data access layer |
| `backend/src/storage.ts` | Uploaded/generated file storage |
| `backend/src/providers/` | TTS, speech, and provider facade logic |
| `backend/src/excelParser.ts` | Homework Excel parsing |

## Deployment Surfaces

| Path | Notes |
| --- | --- |
| `vercel.json` | Vercel frontend and API rewrite behavior |
| `docker/docker-compose.yml` | Container runtime for backend/frontend/static/reverse proxy |
| `docker/Caddyfile` | Caddy reverse proxy config used on Tencent Cloud |
| `docker/nginx/` | Nginx configs and public test proxy assets |
| `scripts/deploy/` | Deployment scripts; keep remote-dirty-tree constraints in mind |
| `scripts/healthcheck/healthcheck.sh` | Basic health check helper |
| `docs/03-testing-deployment/` | Runbooks and smoke testing docs |

## Current Deployment Facts

- Vercel HTTPS is useful for browser media permission demos.
- Vercel rewrite to Tencent Cloud is not suitable for 20MB+ file uploads.
- Tencent Cloud direct HTTP is fast for API and multipart upload, but is not a secure browser context for camera/mic demos.
- Localhost is the reliable fallback for full camera/mic/upload demonstrations.
- Tencent Cloud remote GitHub access has been unreliable; small patch deployment through Tencent TAT has worked.

## Change Discipline

- Keep business behavior shared across deployment branches whenever possible.
- Put environment-specific differences in config, scripts, docs, or environment variables.
- Do not overwrite remote Caddy/Docker/manual certificate work unless the task explicitly says to own that deployment config.
- Do not commit uploaded media, generated private assets, real credentials, or `.env` files.
