# Tencent Release Workflow

Use this workflow when preparing or validating the Tencent Cloud direct deployment.

## Goal

Keep the Tencent deployment stable for API, login, and direct upload proof without damaging remote manual operations config.

## Preflight

1. Read `.agent/rules/deployment-boundaries.md`.
2. Read `.agent/skills/tencent-tat-patch-deploy/SKILL.md` if GitHub pull is unreliable.
3. Identify whether this is a source deploy, config deploy, or smoke-only task.
4. Confirm the target public API URL, currently:

```text
http://101.34.72.227/api/v1
```

## Remote Dirty Tree Rule

Before applying changes, inspect the remote tree:

```bash
cd /opt/lingobridge
git status --short
```

If remote changes include `docker/`, `Caddyfile`, certificates, `.bak`, `.env`, or service-specific files, do not overwrite them during an application-source deploy.

## Source Deploy Path

Preferred near-term path when remote GitHub access is unstable:

1. Generate a small local patch for owned source files.
2. Send it through Tencent TAT.
3. Dry-run `patch -p1`.
4. Apply the patch.
5. Run `npm run build`.
6. Rebuild/restart containers.
7. Run smoke checks.

Use `.agent/skills/tencent-tat-patch-deploy/SKILL.md` for exact command shape.

## Config Deploy Path

Only use this path when the task explicitly owns deployment config.

1. Back up the current remote config.
2. Document what will change.
3. Apply the minimal config patch.
4. Restart only the affected service.
5. Run health/login/upload smoke.

Never mix config cleanup with unrelated app source changes during demo prep.

## Smoke Gate

Run `.agent/workflows/devops-smoke-test.md` with `Route: tencent-direct`.

Minimum pass:

- Health 200.
- Teacher login 200.
- Courses/classes load.
- Small PDF upload passes.
- Large multipart upload passes through direct Tencent route, if upload behavior was touched.

Media note:

- Do not use plain Tencent HTTP as the main camera/mic demo route.

## Rollback

Prefer the smallest reversible action:

1. Restart containers if the code was unchanged.
2. Reapply the previous patch if known.
3. Check out a known-good commit only if the remote tree impact is understood.

Do not run destructive cleanup commands without explicit human approval.

## Release Note Template

```text
Tencent release:
Scope:
Patch/commit:
Remote config touched: yes/no
TAT invocation:
Build:
Docker:
Health:
Login:
Upload:
Known gaps:
Rollback note:
```
