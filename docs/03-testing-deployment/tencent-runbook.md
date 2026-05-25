# Tencent Direct Runbook (腾讯云直连部署运维指南)

This runbook documents the deployment architecture, configuration rules, and patch-based operations for the Tencent Cloud direct-access route.

---

## 1. Role & Facts of the Tencent Direct Lane

* **Direct Public IP**: `http://101.34.72.227/api/v1`
* **Purpose**: Serves as the primary validation host for high-speed backend execution, database state consistency, and high-volume direct multipart uploads (27MB+ PPTX/PDF files).
* **Media Security Boundary**: Direct HTTP access does not establish a secure browser context.
  
> [!WARNING]
> **Do not use `http://101.34.72.227` to demonstrate camera and microphone permissions.**
> Browsers will block media access by default over plain HTTP. For media capture showcases, switch to a Vercel HTTPS page or a Localhost sandbox.

---

## 2. Remote Configuration Protection

The remote host contains manually adjusted runtime configurations:
* `docker/Caddyfile` (manually bound to port 80 to manage direct IP proxying).
* SSL certificates and `.env` settings.

> [!CAUTION]
> **Strict Handoff Boundary**: Do not perform destructive git commands (such as `git reset --hard`) on the server unless human operations explicitly authorize it.
> Do not overwrite the remote `docker/` configuration folder during standard application-source deploys.

---

## 3. Remote Application Deployment: TAT Patch-Deploy

Since direct GitHub authentication (`git pull`) from the domestic instance can be unstable or time out, use **Tencent TAT (Tencent Cloud Automation Tools)** to patch source updates:

### Step 1: Prepare and Encode Local Patch
Generate a source diff from your local root:
```bash
git status --short
git diff -- <source-paths> > /tmp/lingobridge.patch
base64 < /tmp/lingobridge.patch > /tmp/lingobridge.patch.b64
```

### Step 2: Apply Patch Remotely via TAT
Paste the base64 payload into the server via Tencent TAT Command Runner:
```bash
cd /opt/lingobridge

# Decode and apply patch
cat > /tmp/lingobridge.patch.b64 <<'EOF'
<BASE64_PAYLOAD_HERE>
EOF
base64 -d /tmp/lingobridge.patch.b64 > /tmp/lingobridge.patch
patch -p1 < /tmp/lingobridge.patch

# Rebuild and restart application
npm run build
docker compose -f docker/docker-compose.yml up -d --build
```

### Step 3: Local Health Check
Verify the container correctly initialized:
```bash
curl --noproxy "*" -sS http://127.0.0.1/api/v1/health
```

---

## 4. Troubleshooting & Rollback

### If Caddy or Port Binding Breaks
Ensure port 80 is occupied by Caddy reverse proxy:
```bash
docker compose -f docker/docker-compose.yml restart caddy
```

### Source Code Rollback
To revert a faulty patch on the server safely:
```bash
git checkout -- <paths-to-revert>
```

---

## 5. References & Links
* TAT Patch Skill: [.agent/skills/tencent-tat-patch-deploy/SKILL.md](file:///Users/caolei/Desktop/LingoBridge/.agent/skills/tencent-tat-patch-deploy/SKILL.md)
* Release Workflow: [.agent/workflows/tencent-release.md](file:///Users/caolei/Desktop/LingoBridge/.agent/workflows/tencent-release.md)
* DevOps Smoke: [.agent/workflows/devops-smoke-test.md](file:///Users/caolei/Desktop/LingoBridge/.agent/workflows/devops-smoke-test.md)
