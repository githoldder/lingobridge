# LingoBridge MVP PRD v3.0 Customer Delivery Control Plan

> Source of truth: `/Users/caolei/Desktop/Obsidian_root/011_项目经验/互联网+/lingobridge/Records&Drafts/03-02-LingoBridge MVP PRD v2.0.md`
> Source status: user-reviewed and approved
> Control draft date: 2026-05-15
> Immediate delivery target: 2026-05-15 first MVP demo/public test

## 0. Product Boundary

**One sentence:** LingoBridge is a Chinese learning tool website for Kazakhstani international students. Students follow the teacher's PPT/courseware and practice pronunciation after class.

**MVP is not:** a full course management system, online PPT editor, broad social platform, international payment system, or multi-tenant SaaS.

The MVP must stay centered on one core loop:

```
Teacher uploads PPT/PDF + structured homework Excel
-> system generates course pages + homework/vocabulary tasks
-> student opens course practice/homework/vocabulary -> clicks Chinese TTS
-> records local pronunciation -> uploads recording to cloud
-> plays/deletes/downloads own recordings
```

## 1. Current Repo Reality

- GitHub repo: `https://github.com/githoldder/lingobridge`
- Local workspace: `/Users/caolei/Desktop/LingoBridge`
- Current stack: Vite + React 19 + TypeScript + Tailwind + lucide-react + motion (frontend); Express + TypeScript (backend); Docker Compose + Nginx (deployment); PM2 (local process management).
- Backend: Express API with health, demo auth, courses CRUD, courseware upload (pptx/pdf/xlsx), recording upload/list/delete, lecture replay upload/list/delete. Local JSON file store for metadata, local filesystem for uploads.
- Deployment: Dockerfile, docker-compose.yml, nginx.conf, PM2 ecosystem.config.cjs, health-check scripts all exist and verified locally.
- Current mock surfaces that remain:
  - `HomeworkView` uses hardcoded `CURRICULUM_DATA` and `MOCK_SENTENCES` — no API integration.
  - `VocabularyView` uses hardcoded `INITIAL_WORDS` — no API integration.
  - Backend `createExercisesFromExcel()` returns 2 hardcoded exercises — no real XLSX parsing.
  - Teacher live PDF mode renders a mock `<h2>Lesson Plan: Page {pdfPage}</h2>` placeholder — no PDF.js.
  - Teacher live virtual background is not implemented (no MediaPipe/Selfie Segmentation).
  - Live session API (`live-sessions`, `classroom-comments`) does not exist — classroom is a local recording tool, not a real-time session.
  - MinIO/S3 object storage adapter does not exist — all files use local filesystem.
  - Dashboard and report visuals remain static mocks.
- Fixed surfaces (previously mock, now API-backed):
  - `LoginView` calls backend demo auth.
  - `TeacherCoursesView` loads courses from API, creates/upload to real endpoints.
  - Student course practice calls API for pages, recordings, TTS facade.
  - Teacher lecture recording uploads to backend (local storage) and replay listing works.

Security note: local server notes contain plaintext secrets. Do not copy them into this repo. Rotate exposed keys before a real public demo.

## 2. OKRTS

### Objective

By 2026-05-15, make the PRD v3.0 MVP demonstrable: teacher can upload courseware and structured Excel, student can follow course pages/homework/vocabulary, use TTS, record pronunciation, manage cloud-backed recordings, and teacher can run/save/replay a live class for demo video capture and Tencent Cloud public test.

### Key Results

| ID | Key Result | Acceptance |
|---|---|---|
| KR1 | MVP core learning loop works | PPT/PDF upload -> course page -> TTS -> student record -> upload -> play/delete/download |
| KR2 | Teacher courseware upload works | teacher can upload `.pptx`, `.pdf`, `.xlsx`; `.pptx/.pdf` become course pages; `.xlsx` syncs as preview/homework exercise data |
| KR3 | Student practice page works | course pages support page navigation, Chinese TTS button, recording button, and own recording list |
| KR4 | Recording storage is real | audio is uploaded to backend/object-storage abstraction and linked to student/course/page |
| KR5 | Teacher recording/replay works | teacher classroom recording auto-starts after media permission, saves to MinIO/object storage, and students can find replay by date in schedule/calendar history |
| KR6 | Live mode demo works | teacher can choose local screen share or uploaded/existing PDF mode; PDF page turning, annotation canvas drawing, camera, recording controls, and student comments work; AI transcript panel is hideable |
| KR7 | Camera/mic permission bug is fixed | toggling camera/mic off stops all tracks; browser no longer shows camera in use after exit |
| KR8 | Three-language UI remains usable | Chinese/Russian/Kazakh switching works on demo-critical pages |
| KR9 | Public test URL is reachable | Tencent Cloud public URL opens frontend and `/api/v1/health` returns OK |

### Risks

| Risk | Level | Control |
|---|---|---|
| Scope expands into LMS/SaaS | P0 | PRD v3.0 is source of truth; only core loop plus stated live/replay additions |
| PPTX rendering is hard | P0 | MVP accepts PPTX converted to PDF/pages; direct PPT editing is out of scope |
| Browser media permission stuck | P0 | centralize `stopMediaStream(stream)` and call on toggle off, exit, unmount, and recording stop |
| Browser cannot silently cast to hardware | P0 | use `getDisplayMedia()` for real screen share; use Google Cast/desktop wrapper only if external device casting is required |
| Lecture recordings are too large for backend relay | P1 | use MinIO/S3-compatible presigned PUT upload for production path; keep backend direct upload only as local MVP fallback |
| Real cloud TTS or object storage not ready | P1 | provide backend facade and local storage fallback; keep env-based provider switch |
| Secrets leak | P0 | `.env*` ignored, no real keys in repo, rotate already exposed keys |
| Direct IP lacks HTTPS | P1 | acceptable for public test only; formal launch needs domain + HTTPS |

### Tasks

Detailed AI-dispatch tasks are encoded in `prd.json`. The implementation status by phase:

| Phase | Status |
|---|---|
| P0-foundation (T00) | ✅ completed |
| P0-backend (T01) | ✅ completed |
| P0-courseware (T02) | ✅ completed (real parser) |
| P0-student-loop (T03) | ✅ completed (fallback TTS) |
| P0-replay (T04) | ✅ completed |
| P0-frontend (T05-T07) | ✅ completed |
| P0-media-bugfix (T08) | ✅ code_completed (needs browser verification) |
| P1-replay-ui (T09) | ✅ completed |
| P1-deploy (T10) | ✅ assets completed (blocked by tccli) |
| P1-audit (T11) | ✅ code audited |
| P0-brand-polish (T12) | ✅ completed (logo.svg wired) |
| P0-data-standard (T13) | ✅ completed (real XLSX parser with schema validation) |
| P0-homework-route (T14) | ✅ completed (HomeworkView API-backed) |
| P0-vocabulary-route (T15) | ✅ completed (VocabularyView API-backed) |
| P0-teacher-courses (T25) | ✅ completed (upload separated, API-driven) |
| P1-live (T16) | ⏳ planned (virtual background) |
| P1-student-live (T17) | 🔶 partially completed (route fixed, no API state) |
| P1-deploy (T18) | 🔴 blocked (tccli not installed) |
| P0-live-ui (T19) | 🔶 partially completed (transcript hidden, placeholders remain) |
| P0-live-pdf-whiteboard (T20) | ⏳ planned (no PDF.js) |
| P0-live-recording-storage (T21) | ⏳ planned (no MinIO) |
| P0-live-auto-record (T22) | ⏳ planned (manual only) |
| P1-live-cast (T23) | ⏳ planned (real screen share pending) |
| P0-live-routing-guard (T24) | ⏳ planned (no regression test) |
| P0-i18n-audit (T26) | ⏳ planned (some hardcoded strings remain) |
| P0-live-api (T27) | ⏳ planned (no live session API) |
| P0-component-boundary (T28) | 🔶 partially completed (route fixed, file not deleted) |

Highest priority remaining work:
1. T13: Implement real Excel parser and schema validation
2. T14/T15: Wire homework and vocabulary views to Excel-derived API data
3. T20: Implement PDF.js preview, page turning, and annotation canvas
4. T17/T27: Live session API and live-state routing
5. T12: Replace embedded logo with root logo.svg
6. T25: Separate courseware upload from Excel upload
7. T26: Full i18n/static text audit
8. T21/T22: MinIO storage and auto-recording
9. T18: Tencent Cloud deployment

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
  8. Teacher switches to PDF mode, flips PDF pages, and draws on the annotation canvas.
  9. Teacher starts/stops camera and confirms camera indicator closes.
  10. Teacher enters classroom and recording auto-starts after permission.
  11. Teacher saves lecture to MinIO/object storage.
  12. Student finds replay in schedule/history by date.

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
| F08 | Replay | teacher classroom recording auto-starts after permission; video saves to MinIO/object storage; student can replay from schedule/history |
| F09 | Teacher live modes | local screen share mode; uploaded/existing PDF mode with PDF.js page turning, annotation canvas drawing, camera preview, recording controls, student comments, and hideable AI transcript panel |
| F10 | Permission bugfix | camera/mic/screen tracks stop reliably on toggle off and exit |
| F11 | Teacher virtual background | browser-side camera segmentation/canvas composition for blur or static virtual background |
| F12 | Excel homework standard | teacher structured Excel creates homework tasks and vocabulary bank items |
| F13 | Homework/vocabulary data integration | student homework and vocabulary views consume Excel-derived API data instead of mock-only local arrays |
| F14 | Live recording storage and comments | teacher live room supports student comments, recording metadata, and MinIO-backed media persistence |

### Out Of Scope

- Online PPT editing.
- Real-time bilingual subtitles.
- Broad social/community features beyond lightweight classroom comments.
- Multi-tenant SaaS.
- ICP filing.
- International payment.
- AI pronunciation scoring.

## 3.1 Teacher Live Classroom Requirements

Teacher live mode must behave like a teaching workspace, not a demo dashboard:

- The main area prioritizes PDF/screen content.
- Camera preview, microphone/camera toggles, recording status/save, and student comments remain visible.
- Real-time AI transcription/translation is not a teacher-default panel. It must be hideable and default-collapsed for live teaching; it can be shown for replay, captions, or student-facing review.
- Student comments/danmaku are in scope as lightweight classroom interaction, not as a broad social feature.

PDF and annotation:

- PDF preview must support previous/next page, current page, page count, and responsive fit.
- MVP technical choice: PDF.js renders the PDF page to a canvas.
- A separate annotation canvas sits above the PDF layer for brush strokes.
- Minimum annotation controls: color, brush width, eraser or clear-current-page, undo if time allows.
- Excalidraw or tldraw can be introduced later for richer whiteboard editing; MVP should prefer PDF.js + lightweight canvas to reduce bundle and integration risk.

Screen share and casting:

- Real local screen share uses `navigator.mediaDevices.getDisplayMedia()` and requires teacher permission.
- The selected screen/window/tab stream can be recorded or sent through WebRTC/TRTC later.
- A browser page cannot silently cast to external projectors or conference devices. If hardware casting is required, evaluate Google Cast Web Sender, AirPlay/system casting, or a desktop wrapper separately.

Auto recording and storage:

- Teacher entering the live room should auto-start recording after required media permissions are granted.
- Browser security prompts cannot be bypassed; if permissions are denied, record available streams and show a warning.
- Recording should save lecture media to MinIO/S3-compatible object storage for MVP private deployment.
- Preferred upload path: backend creates presigned PUT URL, frontend uploads media directly to MinIO, then backend writes `lecture_recording` metadata.

## 3.2 Agent Handoff Guardrails

The next agent must treat the following as hard product rules, not suggestions:

- Student live and teacher live are the same live classroom experience with different permissions.
- `teacher-classroom` is the teacher role. It can manage the class, upload/select PDF, draw annotations, share screen, record, save replay, and moderate comments.
- `student-classroom` is the student role. It can view the live stage/PDF/screen, use student camera/mic if allowed, send comments, raise hand, and leave.
- The old `StudentClassroomView` is not the live room. If it remains in the codebase, it must be renamed or routed only as homework/practice.
- Dashboard and Schedule `Join Live Class` buttons must go to `student-classroom`, and that route must resolve to the shared live classroom in student role.

Forbidden mistakes:

- Do not create a separate fake student live page to satisfy routing.
- Do not route live class to a practice/recording page.
- Do not add timer-generated fake danmaku, fake transcript, fake students, fake courses, or fake live sessions as if they were real data.
- Do not hardcode English UI text in teacher courses/live pages.
- Do not make AI transcript/translation occupy the teacher default live layout.
- Do not claim PPTX/PDF rendering is real if the implementation only shows placeholder pages.
- Do not silently start camera/mic/screen capture; browser permissions are mandatory.

Partially completed context:

- Student live route has been partially corrected in code to use the shared classroom with student role, but live session API/state is still missing.
- Teacher live transcript is hideable/default hidden and mock auto-danmaku/transcript were removed, but placeholder participants, placeholder PDF visuals, and incomplete API-backed comments remain.
- Teacher courses uses API list/create/upload and several labels are translated, but course management is still shallow and Excel upload is not a distinct workflow.

Recommended next order:

1. Implement Excel parser and schema validation (T13).
2. Wire homework and vocabulary to Excel-derived APIs (T14/T15).
3. Implement PDF.js preview/page turning and annotation canvas (T20).
4. Implement live session API and route guard (T17/T27/T24).
5. Replace embedded logo with root logo.svg (T12).
6. Separate courseware upload from homework Excel upload in TeacherCoursesView (T25).
7. Run full static text/i18n audit across all demo-critical pages (T26).
8. Add MinIO recording storage and auto-recording (T21/T22).
9. Install/configure Tencent Cloud CLI and finish deployment (T18).

## 4. Data Model

Minimum entities from PRD v3.0:

```sql
user (id, username, password_hash, role, display_name, language_pref, created_at)
course (id, teacher_id, title, description, created_at)
course_page (id, course_id, page_number, content_html, audio_text, image_url)
exercise (id, course_id, page_number, prompt, answer, source_file_id, created_at)
learning_task (id, course_id, source_file_id, task_id, task_type, unit, lesson, zh_text, pinyin, translation_ru, translation_kk, publish_to_homework, publish_to_vocab, created_at, updated_at)
vocabulary_item (id, course_id, task_id, zh_text, pinyin, translation_ru, translation_kk, initial, final, tone, rhyme_group, source_file_id, created_at)
learning_record (id, student_id, task_id, context, status, score, attempts_count, last_recording_id, completed_at, updated_at)
recording (id, student_id, course_id, page_number, task_id, audio_url, duration_sec, created_at)
lecture_recording (id, course_id, teacher_id, live_session_id, video_url, storage_provider, object_key, duration_sec, auto_started_at, saved_at, created_at)
live_session (id, course_id, teacher_id, status, source_mode, current_page, recording_status, started_at, ended_at)
classroom_comment (id, live_session_id, student_id, body, created_at, visibility)
file_metadata (id, owner_id, course_id, type, filename, mime_type, size_bytes, storage_url, created_at)
```

Storage:

| Data | Storage |
|---|---|
| generated page images/html | object storage or local upload directory for MVP |
| student audio | WebM/Opus object |
| lecture video | WebM object in MinIO/S3-compatible storage for MVP |
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
| GET | `/api/v1/homework/tasks?courseId=&unit=&lesson=` | Excel-derived homework learning path |
| GET | `/api/v1/vocabulary?courseId=&q=&initial=&final=&tone=` | Excel-derived vocabulary self-study bank |
| POST | `/api/v1/learning-records` | save homework/vocabulary progress and bind latest recording |
| GET | `/api/v1/tts?text=&lang=` | TTS facade |
| POST | `/api/v1/recordings` | upload student recording |
| GET | `/api/v1/recordings?courseId=&page=` | list own/student recordings |
| DELETE | `/api/v1/recordings/:id` | delete own recording |
| POST | `/api/v1/lectures` | upload teacher lecture recording |
| GET | `/api/v1/lectures?courseId=&date=` | list replays |
| DELETE | `/api/v1/lectures/:id` | teacher deletes replay |
| POST | `/api/v1/live-sessions` | create/start teacher live session and recording state |
| PATCH | `/api/v1/live-sessions/:id` | update source mode/current PDF page/recording status |
| GET | `/api/v1/live-sessions/active?courseId=` | student live room entry |
| GET | `/api/v1/live-sessions/:id/comments` | list student comments |
| POST | `/api/v1/live-sessions/:id/comments` | student sends classroom comment |
| POST | `/api/v1/uploads/presigned-url` | create MinIO/S3-compatible presigned upload URL |

## 6. Frontend Integration Priorities

Replace only demo-critical mocks first:

- `src/components/LoginView.tsx`: real demo login.
- `src/components/TeacherCoursesView.tsx`: course list, create course, upload PPT/PDF/Excel.
- `src/components/StudentClassroomView.tsx`: legacy practice component only. Do not use for live class. Rename to `StudentPracticeView` or route it only from homework/practice after it is API-backed.
- `src/components/HomeworkView.tsx`: reuse recording workflow or show Excel-derived practice items.
- `src/components/TeacherClassroomView.tsx`: fix camera/mic/screen track lifecycle; hideable AI transcript; student comments; PDF preview/page turning; annotation canvas; auto recording; MinIO lecture upload.
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

Use PRD v3.0 as source of truth. Implement only the single-tenant CZU MVP backend: auth demo users, course/courseware upload, page generation fallback, Excel-to-homework/vocabulary parsing, TTS facade, student recordings, live sessions/comments, MinIO-backed teacher lecture replays, and health. Do not implement multi-tenant SaaS, AI scoring, payments, or broad social features. Do not commit real secrets.

### Frontend Worker

Replace mock behavior only on demo-critical pages: login, teacher courseware upload, student course practice/TTS/recordings, homework/vocabulary from Excel, teacher live/replay, and schedule replay history. Preserve existing UI style. Fix camera/mic/screen lifecycle so tracks stop on toggle off, exit, and unmount. In teacher live mode, collapse AI transcript by default, keep student comments and recording controls visible, render PDF with page turning, and draw annotations on a canvas layer.

### Live Route Worker

Fix and protect the live route contract. `student-classroom` must enter the same live classroom as `teacher-classroom`, but with student permissions. It must not render the old practice/recording page. Add a regression check that proves student live entry reaches `#classroom-view`, old `Practice mode` is absent, student teacher-only controls are hidden, and teacher controls still appear in teacher role.

### Teacher Courses Worker

Finish TeacherCoursesView as a real management page. Remove mock/default course cards and fake default titles. Use API data for courses, counts, status, and upload results. Separate courseware upload (`pptx/pdf`) from homework Excel upload (`xlsx`). Every visible label, empty state, error, and action must use `t(...)`; API course/user names may remain as user content.

### Deployment Worker

Create minimal deployment assets for Tencent Cloud public test: env example, Docker Compose or PM2 fallback, Nginx proxy/static hosting, upload-size config, and health-check commands. Never include real secrets.

### Auditor

Audit against PRD v3.0, not against a broad platform roadmap. Block if the MVP core loop fails, if a demo-critical path is still mock-only, if camera tracks remain active after toggle off/exit, if secrets appear in repo, or if public test health cannot be verified.

## 9. Acceptance Checklist

- [ ] Teacher can upload PPT/PDF <= 50MB.
- [ ] Teacher can upload Excel exercise file and students can see derived practice items.
- [ ] Student dashboard/schedule live entry opens the shared live classroom in student role, not a practice page.
- [ ] Student live route hides teacher-only screen share/PDF upload/annotation/recording/end-class controls.
- [ ] Teacher live route keeps teacher controls visible.
- [ ] Teacher courses page has no mock course cards or default fake course titles.
- [ ] Teacher courses upload flows separate courseware (`pptx/pdf`) from homework Excel (`xlsx`).
- [ ] Student can browse course pages and flip pages smoothly.
- [ ] Teacher PDF mode supports preview, page turning, and annotation rendering.
- [ ] Teacher live transcript/translation panel can be hidden and is collapsed by default.
- [ ] Teacher live room shows camera, recording status/save, and student comments.
- [ ] No timer-generated fake danmaku, fake transcript, fake students, fake courses, or fake live sessions appear as real data.
- [ ] Language switch updates demo-critical UI chrome with no hardcoded English leftovers.
- [ ] TTS starts within acceptable demo latency.
- [ ] Student recording flow supports record/upload/play/delete/download.
- [ ] Teacher recording flow auto-starts after permission, supports screen/camera/PDF capture, uploads to MinIO/object storage, and supports replay.
- [ ] Student schedule/history shows replay by date.
- [ ] Chinese/Russian/Kazakh switch works on critical pages.
- [ ] Camera/mic/screen tracks stop on toggle off, exit, and unmount.
- [ ] No secrets are committed.
- [ ] Frontend build passes.
- [ ] Backend health check passes.
- [ ] Tencent Cloud public test URL works.
