# Tencent TAT Patch Deploy Skill

Use this skill when deploying a small LingoBridge source patch to Tencent Cloud and direct GitHub access from the server is unreliable.

## When To Use

- Tencent Cloud server cannot reliably `git pull` from GitHub.
- SSH host key or GitHub TLS errors block normal deploy.
- You need a small, controlled source update without overwriting remote Docker/Caddy/manual config.

Do not use this skill for broad refactors, large binary assets, secret rotation, or destructive rollback.

## Known Failure Modes

- SSH remote: `Host key verification failed`.
- HTTPS remote: `GnuTLS recv error` or early TLS connection termination.
- Remote tree contains manual deployment files such as `docker/Caddyfile`, `docker/docker-compose.yml`, `.bak`, or certificate-related files.
- Docker build can fail after patch application even when patch itself applies.

## Safety Rules

1. Never run `git reset --hard` on the server unless the human explicitly approves it.
2. Do not overwrite remote `docker/` or certificate config unless the task specifically owns those files.
3. Keep patches small and source-focused.
4. Capture the remote command invocation ID and health check result in the handoff.
5. Never place secrets in a patch, prompt, or command log.

## Local Patch Preparation

From the repository root:

```bash
git status --short
git diff -- <paths-you-own> > /tmp/lingobridge.patch
wc -c /tmp/lingobridge.patch
```

Inspect the patch before sending:

```bash
sed -n '1,220p' /tmp/lingobridge.patch
```

Encode for transport:

```bash
base64 < /tmp/lingobridge.patch > /tmp/lingobridge.patch.b64
```

Keep the patch small enough to fit the Tencent RunCommand payload comfortably. If it is too large, split by file or switch to an artifact-based deploy.

## Remote Command Shape

Run through Tencent TAT or the Tencent Cloud console:

```bash
cd /opt/lingobridge
git status --short
cat >/tmp/lingobridge.patch.b64 <<'EOF'
<BASE64_PATCH>
EOF
base64 -d /tmp/lingobridge.patch.b64 >/tmp/lingobridge.patch
patch -p1 --dry-run < /tmp/lingobridge.patch
patch -p1 < /tmp/lingobridge.patch
npm run build
docker compose -f docker/docker-compose.yml up -d --build
curl --noproxy "*" -sS http://127.0.0.1/api/v1/health
```

If `patch --dry-run` fails, stop. Do not partially apply by hand unless the human explicitly asks for manual remote surgery.

## Smoke Checks

Run at least:

```bash
curl --noproxy "*" -sS http://127.0.0.1/api/v1/health
curl --noproxy "*" -sS http://101.34.72.227/api/v1/health
```

If the change touches auth/upload/courseware, also run the project smoke from `.agent/workflows/devops-smoke-test.md`.

## Handoff Template

Report:

- Patch source commit or local diff scope.
- Files changed.
- Tencent instance/region if known.
- TAT invocation ID or console run timestamp.
- Build result.
- Docker service result.
- Health/login/upload smoke result.
- Any remote files intentionally left untouched.
