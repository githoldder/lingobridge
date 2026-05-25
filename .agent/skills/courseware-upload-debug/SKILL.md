# Courseware Upload Debug Skill

Use this skill when debugging PDF/PPTX upload, courseware parsing, Vercel 502 behavior, multipart/base64 changes, storage, or PDF preview regressions.

## Core Mental Model

Courseware upload can fail in different layers:

1. Browser file picker and request construction.
2. Frontend API base URL or auth header.
3. Vercel router/rewrite.
4. Tencent Caddy/Nginx reverse proxy.
5. Express multipart middleware.
6. Backend storage and metadata persistence.
7. PDF.js rendering or PPTX conversion/viewing.

Always isolate the layer before changing code.

## Baseline Matrix

Test the same file through multiple routes:

| File | Localhost | Vercel HTTPS | Tencent direct |
| --- | --- | --- | --- |
| Small PDF | Should pass | Should pass | Should pass |
| 20MB+ PPTX/PDF | Should pass if limits allow | Known risky/failing through rewrite | Should pass if direct multipart is healthy |

Known fact:

- A 27MB PPTX has succeeded through direct Tencent multipart upload.
- The same scale upload through Vercel rewrite has returned `502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR`.

## First Checks

Confirm environment:

```bash
cat vercel.json
cat .env.example
rg "VITE_API_BASE_URL|upload|multipart|courseware|pdf" src backend vercel.json docker
```

Confirm health:

```bash
curl --noproxy "*" -sS http://127.0.0.1:3001/api/v1/health
curl --noproxy "*" -sS http://101.34.72.227/api/v1/health
```

## Browser Symptoms

Use DevTools or Playwright logs to capture:

- Request URL.
- HTTP status.
- Response body.
- Request payload type: `multipart/form-data` vs JSON/base64.
- Request duration.
- Console errors from PDF.js or route guards.

If the Vercel path fails but Tencent direct succeeds with the same file, treat it as a routing/proxy limitation until proven otherwise.

## Backend Symptoms

Check:

- Upload body size limits.
- Multipart parser errors.
- Storage path and permissions.
- Courseware metadata row creation.
- File URL generation.
- Whether preview route is returning file bytes or metadata.

Important files:

- `backend/src/app.ts`
- `backend/src/storage.ts`
- `backend/src/repositories/files.ts`
- `src/services/apiClient.ts`
- `src/components/PdfViewer.tsx`
- `src/services/entryResolver.ts`

## Decision Rules

- If small PDF fails everywhere, debug app/auth/storage first.
- If small PDF passes but large file fails everywhere, debug size limits, middleware, storage, and proxy limits.
- If large file passes direct Tencent/local but fails through Vercel, do not churn backend code; document the Vercel boundary and move large upload to direct route or future COS signed upload.
- If upload succeeds but preview fails, debug file URL, MIME type, CORS, and PDF.js separately.

## Handoff Template

Report:

- File tested and size.
- Route tested.
- Exact status/error.
- Whether health/login passed on that route.
- Whether upload metadata was created.
- Whether raw file URL opens.
- Whether PDF.js/viewer failed after upload.
- Layer judged responsible.
