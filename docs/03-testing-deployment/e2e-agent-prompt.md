# Playwright E2E Delegation Prompt

Use this prompt when delegating initial browser-based pass-through testing to another agent.

## Prompt

You are testing the LingoBridge MVP after the backend/frontend API integration.

Read:

- `prds/prd.md`
- `context/project-brief.md`
- `.agent/rules/mvp-scope.md`

Start the services:

```bash
npm run backend:dev
npm run dev
```

Then use Playwright or browser automation to verify the minimum pass-through path:

1. Open the frontend.
2. Log in as teacher:
   - email: `teacher@test.com`
   - password: `Test@123456`
3. Go to teacher courses.
4. Create/select a course.
5. Upload one small `.pdf` or `.pptx` fixture and confirm pages count updates.
6. Upload one small `.xlsx` fixture and confirm exercises count updates.
7. Enter teacher classroom.
8. Toggle camera on/off and confirm browser camera indicator closes after off/exit.
9. Start screen share if the test environment permits it; otherwise document the browser limitation.
10. Record a short teacher replay and confirm upload succeeds.
11. Log in as student:
    - email: `student_a@test.com`
    - password: `Test@123456`
12. Enter student classroom.
13. Flip course pages.
14. Click TTS and confirm no UI crash. Backend may return browser fallback.
15. Record a short pronunciation sample.
16. Confirm recording appears in the list.
17. Play, download, and delete the recording.
18. Go to schedule/replays and confirm teacher replay is listed by date.

## Report Format

Write the result to `tests/acceptance/e2e-smoke-report.md`:

```markdown
# E2E Smoke Report

## Environment

- Frontend URL:
- Backend URL:
- Browser:

## Results

| Step | Result | Notes |
|---|---|---|
| Teacher login | Pass/Fail | |
| Course creation | Pass/Fail | |
| PDF/PPTX upload | Pass/Fail | |
| Excel upload | Pass/Fail | |
| Teacher camera cleanup | Pass/Fail | |
| Teacher replay upload | Pass/Fail | |
| Student login | Pass/Fail | |
| Course page navigation | Pass/Fail | |
| TTS | Pass/Fail | |
| Student recording upload | Pass/Fail | |
| Recording play/download/delete | Pass/Fail | |
| Schedule replay | Pass/Fail | |

## Blocking Defects

## Non-Blocking Notes

## Screenshots
```

## Acceptance Rule

Block the MVP if the student recording loop or teacher courseware upload loop is still mock-only.

