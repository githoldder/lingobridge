# Deployment Boundaries

Use this file to avoid mixing deployment routes that solve different problems.

## One-Line Rule

For the near-term demo, optimize for at least one stable path plus clear fallbacks. Do not force one path to carry every capability.

## Route A: Local Demo

Purpose:

- Full demo fallback.
- Best path for camera, microphone, upload, and classroom flows when network conditions are unknown.

Allowed assumptions:

- `localhost` is a secure browser context for camera and microphone.
- Local Docker/Node/Postgres can be used if the laptop is prepared.
- Public multi-user access is not the goal.

Do not overbuild before the demo:

- Local self-signed HTTPS.
- Public tunnel hardening.
- Multi-user load guarantees.

Minimum proof:

- Frontend opens locally.
- Teacher login works.
- Teacher classroom media permissions work.
- Small PDF upload and preview work.
- Student recording/homework path works.

## Route B: Vercel HTTPS Demo

Purpose:

- Shareable HTTPS frontend.
- Browser camera/mic permission demos.
- Lightweight API and page flow demos.

Allowed assumptions:

- Vercel provides HTTPS and a clean external URL.
- Small requests through rewrite can work.
- Media permissions are appropriate to demonstrate from this route.

Hard boundary:

- Do not treat Vercel rewrite to Tencent Cloud as the production path for large courseware uploads.
- Known 27MB PPTX uploads through Vercel rewrite have failed with `502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR`.

Minimum proof:

- Vercel page loads.
- Teacher login works.
- Lightweight course/class APIs work.
- Camera/mic browser permissions can be requested.

Recommended demo behavior:

- Use preloaded assets or small files.
- Switch to localhost or direct Tencent for large upload proof.

## Route C: Tencent Cloud Direct

Purpose:

- Prove stable public backend/API behavior in China.
- Prove direct multipart upload capability.
- Serve as the base for a future HTTPS domestic demo.

Allowed assumptions:

- Direct HTTP public IP access is fast enough for API and upload proof.
- Direct HTTP public IP is not the complete media demo route.

Hard boundary:

- Do not present `http://101.34.72.227` as the formal camera/mic entry while it lacks HTTPS.
- Do not overwrite remote Caddy/Docker/manual certificate changes without explicit ownership.
- Do not rely on server-side GitHub pull as the only deployment mechanism.

Minimum proof:

- `http://101.34.72.227/api/v1/health` returns 200.
- Login returns 200.
- Direct multipart upload of a large PPTX/PDF returns 200.
- Docker services are healthy.
- Rollback or restart steps are written down.

## Future Large File Boundary

The stable long-term solution for large files is object storage direct upload:

1. Browser requests a signed upload URL from the backend.
2. Browser uploads directly to COS/S3/R2 over HTTPS.
3. Backend stores file metadata.
4. PDF/courseware viewers load from HTTPS object storage URLs.

Do not spend demo-critical time forcing large files through a fragile reverse-proxy chain when signed direct upload is the intended design.
