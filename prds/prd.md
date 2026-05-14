# LingoBridge MVP PRD v2.0 Execution Control Plan

> Source of truth: `/Users/caolei/Desktop/Obsidian_root/011_项目经验/互联网+/lingobridge/Records&Drafts/03-02-LingoBridge MVP PRD v2.0.md`
> Source status: user-reviewed and approved
> Control draft date: 2026-05-14
> Immediate delivery target: 2026-05-15 first MVP demo/public test

## 0. Product Boundary

**One sentence:** LingoBridge is a Chinese learning tool website for Kazakhstani international students. Students follow the teacher's PPT/courseware and practice pronunciation after class.

**MVP is not:** a full course management system, online PPT editor, social platform, international payment system, or multi-tenant SaaS.

The MVP must stay centered on one core loop:

```
Teacher uploads PPT/PDF -> system generates course pages
-> student opens course practice -> clicks Chinese TTS
-> records local pronunciation -> uploads recording to cloud
-> plays/deletes/downloads own recordings
```

## 1. Current Repo Reality

- GitHub repo: `https://github.com/githoldder/lingobridge`
- Local workspace: `/Users/caolei/Desktop/LingoBridge`
- Current stack in repo: Vite + React 19 + TypeScript + Tailwind + lucide-react + motion.
- Current gap: no backend, no database schema, no object storage integration, no deployment compose/nginx files.
- Current mock surfaces:
  - `LoginView` simulates login.
  - Course/student/report dashboards use hardcoded arrays.
  - `ttsService.ts` uses browser `speechSynthesis`, not cloud TTS.
  - Student classroom recording is simulated.
  - Teacher lecture recording saves to browser `localStorage`.
  - Teacher live classroom has UI for screen share/PDF/camera/canvas, but no backend persistence/sync.

Security note: local server notes contain plaintext secrets. Do not copy them into this repo. Rotate exposed keys before a real public demo.

## 2. OKRTS

### Objective

By 2026-05-15, make the PRD v2.0 MVP demonstrable: teacher can upload courseware, student can follow course pages, use TTS, record pronunciation, manage cloud-backed recordings, and teacher can record/save/replay a class for demo video capture and Tencent Cloud public test.

### Key Results

| ID | Key Result | Acceptance |
|---|---|---|
| KR1 | MVP core learning loop works | PPT/PDF upload -> course page -> TTS -> student record -> upload -> play/delete/download |
| KR2 | Teacher courseware upload works | teacher can upload `.pptx`, `.pdf`, `.xlsx`; `.pptx/.pdf` become course pages; `.xlsx` syncs as preview/homework exercise data |
| KR3 | Student practice page works | course pages support page navigation, Chinese TTS button, recording button, and own recording list |
| KR4 | Recording storage is real | audio is uploaded to backend/object-storage abstraction and linked to student/course/page |
| KR5 | Teacher recording/replay works | teacher screen/camera recording can be saved; students can find replay by date in schedule/calendar history |
| KR6 | Live mode demo works | teacher can choose local screen share or uploaded/existing PDF mode; PDF page + canvas drawing work in teacher view |
| KR7 | Camera/mic permission bug is fixed | toggling camera/mic off stops all tracks; browser no longer shows camera in use after exit |
| KR8 | Three-language UI remains usable | Chinese/Russian/Kazakh switching works on demo-critical pages |
| KR9 | Public test URL is reachable | Tencent Cloud public URL opens frontend and `/api/v1/health` returns OK |

### Risks

| Risk | Level | Control |
|---|---|---|
| Scope expands into LMS/SaaS | P0 | PRD v2.0 is source of truth; only core loop plus stated live/replay additions |
| PPTX rendering is hard | P0 | MVP accepts PPTX converted to PDF/pages; direct PPT editing is out of scope |
| Browser media permission stuck | P0 | centralize `stopMediaStream(stream)` and call on toggle off, exit, unmount, and recording stop |
| Real cloud TTS or object storage not ready | P1 | provide backend facade and local storage fallback; keep env-based provider switch |
| Secrets leak | P0 | `.env*` ignored, no real keys in repo, rotate already exposed keys |
| Direct IP lacks HTTPS | P1 | acceptable for public test only; formal launch needs domain + HTTPS |

### Tasks

Detailed AI-dispatch tasks are encoded in `prd.json`. The implementation order is:

1. Secret hygiene and repo guardrails.
2. Minimal backend with health/auth/users.
3. Courseware upload and course page generation.
4. Student TTS + recording storage/management.
5. Teacher recording/replay persistence.
6. Frontend replacement of demo-critical mocks.
7. Live permission bug and local/PDF mode polish.
8. Tencent Cloud public test deployment.
9. MVP acceptance audit.

### Signals

- `npm run lint` passes.
- `npm run build` passes.
- Backend health check passes.
- Manual demo path passes:
  1. Teacher login.
  2. Upload PPT/PDF.
  3. Upload Excel practice file.
  4. Student opens generated course page.
  5. Student uses TTS.
  6. Student records, uploads, plays, downloads, deletes recording.
  7. Teacher starts live local screen mode.
  8. Teacher switches to PDF mode and draws on canvas.
  9. Teacher starts/stops camera and confirms camera indicator closes.
  10. Teacher records/saves lecture.
  11. Student finds replay in schedule/history by date.

## 3. MVP Functional Scope

### In Scope

| ID | Feature | MVP implementation note |
|---|---|---|
| F01 | PPT/PDF import | upload <= 50MB; generate course pages; PDF can be first-class fallback for PPTX |
| F02 | Course-practice sync | pages include `audio_text`; Excel rows can create practice/homework items by course/page |
| F03 | Chinese TTS | frontend calls backend TTS facade; browser TTS fallback allowed only if provider missing |
| F04 | Student recording | `MediaRecorder` audio capture |
| F05 | Recording storage | upload WebM/Opus to object-storage abstraction; metadata links student/course/page |
| F06 | Recording management | student can play/delete/download own recordings |
| F07 | Kazakh adaptation | Chinese/Russian/Kazakh switch on critical pages |
| F08 | Replay | teacher records screen/camera; video saved; student can replay from schedule/history |
| F09 | Teacher live modes | local screen share mode; uploaded/existing PDF mode with PDF paging and canvas drawing |
| F10 | Permission bugfix | camera/mic/screen tracks stop reliably on toggle off and exit |

### Out Of Scope

- Online PPT editing.
- Real-time bilingual subtitles.
- Bullet comments/social interaction.
- Multi-tenant SaaS.
- ICP filing.
- International payment.
- AI pronunciation scoring.
- Teacher virtual background.

## 4. Data Model

Minimum entities from PRD v2.0:

```sql
user (id, username, password_hash, role, display_name, language_pref, created_at)
course (id, teacher_id, title, description, created_at)
course_page (id, course_id, page_number, content_html, audio_text, image_url)
exercise (id, course_id, page_number, prompt, answer, source_file_id, created_at)
recording (id, student_id, course_id, page_number, audio_url, duration_sec, created_at)
lecture_recording (id, course_id, teacher_id, video_url, duration_sec, created_at)
file_metadata (id, owner_id, course_id, type, filename, mime_type, size_bytes, storage_url, created_at)
```

Storage:

| Data | Storage |
|---|---|
| generated page images/html | object storage or local upload directory for MVP |
| student audio | WebM/Opus object |
| lecture video | WebM object |
| structured metadata | PostgreSQL preferred; SQLite/local JSON acceptable only as emergency demo fallback |

## 5. API Contract

Response envelope:

```json
{ "code": 0, "data": {}, "message": "success" }
```

Core routes:

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/health` | deployment check |
| POST | `/api/v1/auth/login` | demo login |
| GET | `/api/v1/users/me` | current user |
| GET | `/api/v1/courses` | course list |
| POST | `/api/v1/courses` | teacher creates course |
| GET | `/api/v1/courses/:id/pages` | course pages |
| POST | `/api/v1/coursewares` | upload pptx/pdf/xlsx |
| GET | `/api/v1/exercises?courseId=&page=` | student practice items from Excel |
| GET | `/api/v1/tts?text=&lang=` | TTS facade |
| POST | `/api/v1/recordings` | upload student recording |
| GET | `/api/v1/recordings?courseId=&page=` | list own/student recordings |
| DELETE | `/api/v1/recordings/:id` | delete own recording |
| POST | `/api/v1/lectures` | upload teacher lecture recording |
| GET | `/api/v1/lectures?courseId=&date=` | list replays |
| DELETE | `/api/v1/lectures/:id` | teacher deletes replay |

## 6. Frontend Integration Priorities

Replace only demo-critical mocks first:

- `src/components/LoginView.tsx`: real demo login.
- `src/components/TeacherCoursesView.tsx`: course list, create course, upload PPT/PDF/Excel.
- `src/components/StudentClassroomView.tsx`: render selected course page, TTS, real recording upload/list/play/delete/download.
- `src/components/HomeworkView.tsx`: reuse recording workflow or show Excel-derived practice items.
- `src/components/TeacherClassroomView.tsx`: fix camera/mic/screen track lifecycle; lecture upload; PDF mode polish.
- `src/components/ScheduleView.tsx`: show lecture replay history by date.
- `src/services/ttsService.ts`: call backend first, fallback to browser TTS.

Dashboards, reports, rankings, and non-core analytics can remain visual mocks for the MVP video if they do not block the core loop.

## 7. Deployment Plan

### Local

1. Start backend on `127.0.0.1:3001`.
2. Run frontend on Vite.
3. Configure `VITE_API_BASE_URL=http://127.0.0.1:3001/api/v1`.
4. Verify the manual path.

### Tencent Cloud Public Test

1. Build frontend with `npm run build`.
2. Deploy backend + static frontend behind Nginx.
3. Use Docker Compose if available; PM2 fallback is acceptable for the one-day demo.
4. Open only required ports.
5. Verify:
   - frontend URL
   - `/api/v1/health`
   - upload endpoint
   - media playback URL

## 8. AI Delegation Prompts

### Backend Worker

Use PRD v2.0 as source of truth. Implement only the single-tenant CZU MVP backend: auth demo users, course/courseware upload, page generation fallback, Excel-to-exercise parsing, TTS facade, student recordings, teacher lecture replays, and health. Do not implement multi-tenant SaaS, AI scoring, subtitles, payments, or social features. Do not commit real secrets.

### Frontend Worker

Replace mock behavior only on demo-critical pages: login, teacher courseware upload, student course practice/TTS/recordings, teacher live/replay, and schedule replay history. Preserve existing UI style. Fix camera/mic/screen lifecycle so tracks stop on toggle off, exit, and unmount.

### Deployment Worker

Create minimal deployment assets for Tencent Cloud public test: env example, Docker Compose or PM2 fallback, Nginx proxy/static hosting, upload-size config, and health-check commands. Never include real secrets.

### Auditor

Audit against PRD v2.0, not against a broad platform roadmap. Block if the MVP core loop fails, if a demo-critical path is still mock-only, if camera tracks remain active after toggle off/exit, if secrets appear in repo, or if public test health cannot be verified.

## 9. Acceptance Checklist

- [ ] Teacher can upload PPT/PDF <= 50MB.
- [ ] Teacher can upload Excel exercise file and students can see derived practice items.
- [ ] Student can browse course pages and flip pages smoothly.
- [ ] TTS starts within acceptable demo latency.
- [ ] Student recording flow supports record/upload/play/delete/download.
- [ ] Teacher recording flow supports screen/camera capture, upload, and replay.
- [ ] Student schedule/history shows replay by date.
- [ ] Chinese/Russian/Kazakh switch works on critical pages.
- [ ] Camera/mic/screen tracks stop on toggle off, exit, and unmount.
- [ ] No secrets are committed.
- [ ] Frontend build passes.
- [ ] Backend health check passes.
- [ ] Tencent Cloud public test URL works.
