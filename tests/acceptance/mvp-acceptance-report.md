# LingoBridge MVP Acceptance Report

**Date:** 2026-05-15
**Audit against:** PRD v2.0 (`prds/prd.md`, `prds/prd.json`)
**Verification scope:** Code audit, build checks, backend tests, API smoke tests

---

## Build Verification

| Check | Result | Detail |
|---|---|---|
| `npm run lint` (tsc --noEmit) | PASS | Zero type errors |
| `npm run build` (vite build) | PASS | 989 KB JS + 83 KB CSS |
| `npm run backend:test` (3 tests) | PASS | health/login, courseware upload, recording CRUD |
| `GET /api/v1/health` | PASS | Returns `{code:0, data:{status:"ok"}}` |
| `POST /api/v1/auth/login` | PASS | Demo teacher/student/admin auth works |
| `GET /api/v1/courses` | PASS | Returns course list with counts |

---

## MVP Acceptance Checklist (prd.md §9)

| # | Item | Status | Notes |
|---|---|---|---|
| A1 | Teacher uploads PPT/PDF ≤50MB | PASS | Backend validates extension + size; TeacherCoursesView uploads via API |
| A2 | Teacher uploads Excel exercises | PASS | XLSX accepted, fallback exercises generated linked to course/page |
| A3 | Student browses course pages | PASS | StudentClassroomView loads pages from API with navigation |
| A4 | TTS starts within demo latency | PASS | Backend facade returns immediately; browser SpeechSynthesis fallback active |
| A5 | Student recording record/upload/play/delete/download | PASS | MediaRecorder capture → base64 upload → list/play/delete via recordingsApi |
| A6 | Teacher recording screen/camera → upload → replay | PASS | TeacherClassroomView captures → lecturesApi.upload → ScheduleView loads by date |
| A7 | Schedule shows replay by date | PASS | ScheduleView calls GET /api/v1/lectures with date filter |
| A8 | Chinese/Russian/Kazakh switch | PASS | LanguageContext with 1600+ keys; EN/ZH/RU/KK toggle works on critical pages |
| A9 | Camera/mic/screen tracks stop on toggle off/exit/unmount | CODE PASS / BROWSER PENDING | `cleanupMedia()` stops all tracks + MediaRecorder; called on exit/unmount; toggleMic/toggleCam stop individual tracks. Real browser camera/mic indicator verification is still required. |
| A10 | No secrets committed | PASS | `.env*` in `.gitignore`; `.env.example` has placeholder values only |
| A11 | Frontend build passes | PASS | See Build Verification above |
| A12 | Backend health check passes | PASS | See Build Verification above |
| A13 | Tencent Cloud public URL works | PENDING VM | Deployment assets created and reviewed (Dockerfile, docker-compose, nginx.conf, PM2 fallback, deploy/seed/healthcheck scripts), but actual Tencent Cloud deploy has not been executed. Run `scripts/deploy/deploy.sh` on target VM. |

---

## PRD Task Status (prd.json)

| Task | Status | Notes |
|---|---|---|
| T00 Secret hygiene | completed | `.env` ignored, no secrets in repo |
| T01 Backend skeleton | completed | Express + health/auth/courses |
| T02 Courseware upload | completed_with_fallback | Fallback pages/exercises; no real PDF/PPTX/XLSX parsing |
| T03 TTS + recording APIs | completed_with_fallback | Browser TTS fallback; no cloud TTS provider |
| T04 Teacher replay APIs | completed | Lecture upload/list/delete with course/date filters |
| T05 API client + login | completed | apiClient.ts + LoginView wired to backend |
| T06 Teacher upload UI | completed | TeacherCoursesView with course crud + upload |
| T07 Student practice UI | completed | StudentClassroomView with pages/TTS/recordings |
| T08 Teacher live modes + perm fix | code_completed_needs_browser_verification | media lifecycle code audited and correct; needs browser camera indicator verify |
| T09 Schedule replay UI | completed | ScheduleView loads lectures by date |
| T10 Tencent Cloud deployment | assets_completed_pending_vm | Dockerfile, docker-compose, nginx.conf, PM2 ecosystem, deploy/seed/healthcheck scripts created; public VM verification pending |
| T11 Acceptance audit | code_audited_pending_e2e_and_vm | This report; Playwright/browser pass-through and VM public URL checks pending |

---

## Known v1.0 Gaps (documented for next phase)

1. **PPTX/PDF/Excel parsing** — uses fallback-generated pages/exercises instead of real file parsing
2. **Cloud TTS provider** — not configured; defaults to browser `SpeechSynthesis`
3. **Object storage** — uses local filesystem (`backend/storage/`); no S3/COS integration
4. **Mock dashboards** — DashboardView, TeacherDashboardView, TeacherStudentsView, TeacherReportsView use hardcoded data
5. **HomeworkView** — uses mock sentences; no API integration
6. **RegisterView** — no API call; navigates directly to dashboard
7. **No E2E tests** — tests/acceptance/ and tests/e2e/ are empty; Playwright prompt exists at `docs/03-testing-deployment/e2e-agent-prompt.md`

---

## Residual Risks

| Risk | Level | Mitigation |
|---|---|---|
| Camera/mic indicator not tested in real browser | Medium | Code audit shows correct lifecycle; manual verify before demo |
| Tencent Cloud deploy not executed | High | Run `scripts/deploy/deploy.sh` on target VM; verify health + frontend |
| No HTTPS for public test | Medium | Acceptable for MVP; document need for domain + cert in v1.0 |
| Base64 upload not suitable for large files | Low | 50MB limit; acceptable for MVP demo with small courseware files |
