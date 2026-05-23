# Tencent Cloud Public Deployment Runbook

> Scope: LingoBridge MVP public IP deployment on one Tencent Cloud CVM or Lighthouse instance, using Docker Compose, Nginx reverse proxy, and direct public IP access first. Domain and HTTPS are follow-up hardening tasks.

## 1. Current Findings

- Tencent Cloud CLI is TCCLI, exposed as the `tccli` command.
- Local CLI status: installed at `/Users/caolei/.local/bin/tccli`, version `3.1.97.1`.
- Official install options are pip, source install, and Homebrew. For this Mac workspace, pip user install is already done with:

```bash
python3 -m pip install --user tccli
```

- Browser authentication is supported:

```bash
tccli auth login
```

If the local browser cannot be used from the terminal session:

```bash
tccli auth login --browser no
```

- Tencent Cloud validation command after login:

```bash
tccli cvm DescribeRegions
```

For Lighthouse instances, use:

```bash
tccli lighthouse DescribeInstances
```

## 2. Target Architecture

```text
Browser / mobile network
  |
  | HTTP :80
  v
Tencent Cloud public IP
  |
  v
Nginx container
  |-- /                 -> static frontend in dist/
  |-- /api/             -> backend:3001
  |-- /uploads/         -> backend:3001
  v
Backend container
  |
  v
Postgres container + Docker volumes
```

Public exposure:

- Open to public: `80/tcp`, optionally `443/tcp` later.
- Admin SSH: `22/tcp`, preferably limited to trusted IPs.
- Keep internal only: `3001/tcp`, `5432/tcp`.

## 3. Server Preparation

On Tencent Cloud console or with `tccli`, confirm:

- CVM or Lighthouse instance has a public IP.
- Security group/firewall allows `80/tcp`.
- SSH works.
- Recommended minimum: 2 GB RAM; 4 GB is smoother for Docker build.

Ubuntu/Debian server bootstrap:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
docker compose version
```

If Docker Compose is missing, install the official Docker Compose plugin for the OS package manager or Docker repository.

## 4. Project Deployment

Clone or update the repo on the server:

```bash
sudo mkdir -p /opt/lingobridge
sudo chown "$USER":"$USER" /opt/lingobridge
cd /opt/lingobridge
git clone <repo-url> .
```

Create production env:

```bash
cp .env.example .env
```

Recommended `.env` values for public IP deployment:

```bash
VITE_API_BASE_URL="http://<PUBLIC_IP>/api/v1"
HOST="0.0.0.0"
PORT="3001"
JWT_SECRET="<replace-with-strong-secret>"
```

Build frontend and start containers:

```bash
npm install
npm run build
cd docker
docker compose build
docker compose up -d
```

The existing helper script performs the same core steps:

```bash
scripts/deploy/deploy.sh
```

## 5. Verification

On the server:

```bash
docker compose -f docker/docker-compose.yml ps
curl --noproxy "*" -sS http://127.0.0.1/api/v1/health
```

From your local machine:

```bash
curl --noproxy "*" -I http://<PUBLIC_IP>/
curl --noproxy "*" -sS http://<PUBLIC_IP>/api/v1/health
```

Business smoke:

```bash
scripts/healthcheck/healthcheck.sh "http://<PUBLIC_IP>/api/v1/health"
```

Then verify manually:

- Open `http://<PUBLIC_IP>/`.
- Log in as teacher.
- Upload one PDF courseware.
- Log in as student.
- Confirm courseware, homework, recording submission, and TTS fallback path work.
- Test from mobile 4G/5G, not only campus Wi-Fi.

## 6. Rollback

Code rollback:

```bash
cd /opt/lingobridge
git log --oneline -5
git checkout <known-good-commit>
npm install
npm run build
cd docker
docker compose up -d --build
```

Container restart without code rollback:

```bash
cd /opt/lingobridge/docker
docker compose restart
```

Data backup before risky changes:

```bash
cd /opt/lingobridge
tar -czf "lingobridge-files-$(date +%Y%m%d-%H%M%S).tar.gz" docker dist backend/storage 2>/dev/null || true
docker compose -f docker/docker-compose.yml exec -T postgres pg_dump -U lingobridge lingobridge > "lingobridge-db-$(date +%Y%m%d-%H%M%S).sql"
```

## 7. Tencent CLI Commands We Will Likely Use

After browser login:

```bash
tccli cvm DescribeRegions
tccli cvm DescribeInstances --region ap-guangzhou
tccli cvm DescribeSecurityGroups --region ap-guangzhou
```

For Lighthouse:

```bash
tccli lighthouse DescribeInstances --region ap-guangzhou
tccli lighthouse DescribeFirewallRules --region ap-guangzhou --InstanceId <instance-id>
```

Add port 80 for Lighthouse if needed:

```bash
tccli lighthouse CreateFirewallRules \
  --region ap-guangzhou \
  --InstanceId <instance-id> \
  --FirewallRules '[{"Protocol":"TCP","Port":"80","Action":"ACCEPT","FirewallRuleDescription":"LingoBridge HTTP"}]'
```

Use console for security group/firewall changes if CLI parameters are uncertain; public access correctness matters more than forcing automation during MVP.

## 8. Known Gaps Before Real Go-Live

- Docker Compose currently exposes backend `3001` and Postgres `5432` host ports. For public deployment, prefer removing host mappings or restricting security groups so only `80` is public.
- Postgres password in `docker/docker-compose.yml` is a development default. Replace it before any real external test.
- Domain and HTTPS are intentionally deferred for the IP-based MVP smoke.
- The current backend Dockerfile runs `npx tsx backend/src/server.ts`; acceptable for MVP, but a production image should compile or use a locked runtime path.

## References

- Tencent Cloud: Install TCCLI, https://cloud.tencent.com/document/product/440/34011
- Tencent Cloud: Browser auth for TCCLI, https://cloud.tencent.com/document/product/440/111345
- Tencent Cloud: Configure TCCLI, https://cloud.tencent.com/document/product/440/34012
