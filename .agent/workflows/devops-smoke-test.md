# DevOps Smoke Test Workflow

Use this workflow after deployment, deploy-config edits, API URL changes, upload changes, or demo prep.

## Inputs

Record these before testing:

- Route name: `local`, `vercel`, or `tencent-direct`.
- Frontend URL.
- API base URL.
- Commit or patch ID.
- Test account used.
- File sizes used for upload checks.

## Smoke Order

Run checks in this order so failures are easy to localize.

### 1. Health

```bash
curl --noproxy "*" -sS <API_BASE_URL>/health
```

Expected: HTTP 200 and a JSON health payload.

### 2. Login

Use the app UI or API smoke. Confirm teacher login first, then student login if the task touches student flows.

Expected: login succeeds, user identity is visible in UI or response.

### 3. Courses

Open the teacher course/class view or query the relevant courses endpoint.

Expected:

- Courses/classes load.
- No blank page.
- No auth loop.

### 4. Lesson/Courseware Nodes

Open an existing courseware item.

Expected:

- PDF/page content loads when a file exists.
- Missing assets fail with a visible UI state, not a crash.

### 5. Small PDF Upload

Use a small sample from `tests/samples/pdf/` or `samples/`.

Expected:

- Upload completes.
- Metadata appears in the course/class view.
- Preview opens.

### 6. Large PPTX/PDF Upload

Only run this for `local` or `tencent-direct` unless the explicit goal is to reproduce Vercel failure.

Expected:

- Local/direct Tencent should pass if multipart and proxy limits are healthy.
- Vercel rewrite is allowed to fail for large files; document it as a known boundary.

### 7. Media Permission

Only run this for HTTPS or localhost.

Expected:

- Teacher classroom can request camera/mic.
- Turning off camera/mic stops tracks.
- Leaving the page does not leave active capture running.

Do not treat plain `http://<public-ip>` camera/mic failure as a product bug. It is a browser secure-context limitation.

## Result Template

```text
Route:
Frontend URL:
API URL:
Commit/Patch:

Health:
Login:
Courses:
Courseware open:
Small PDF upload:
Large upload:
Media permission:

Blocking issues:
Known acceptable gaps:
Next action:
```
