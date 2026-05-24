# Sprint 7 Public HTTPS Demo：域名绑定、可信 HTTPS、录音/摄像头公网演示上线

> 日期：2026-05-24  
> 来源：Sprint 6 部署结果、DuckDNS 当前配置截图、HTTPS/MediaDevices 官方调研、腾讯云 TCCLI 当前可用性  
> 目标：把 LingoBridge 从“公网 HTTP/自签 HTTPS 可访问”推进到“绑定域名 + 浏览器可信 HTTPS + 录音/摄像头可用”的公网演示状态。

## 0. Milestone Definition

本 sprint 的里程碑不是“浏览器地址栏显示 `https://`”，而是：

- `https://lingobridge.duckdns.org/` 能在普通 Chrome/Edge/Safari 无证书警告打开。
- 浏览器 DevTools 中 `window.isSecureContext === true`。
- 录音/摄像头 API 可以正常触发权限弹窗并采集，至少覆盖桌面 Chrome 和一台移动端浏览器。
- 前端、API、上传资源都走同源 HTTPS 或可信 HTTPS，不出现 mixed content。
- 服务器重启或容器重建后证书与数据仍能保留，证书可自动续期。

如果使用自签证书、需要手动点击“不安全继续访问”、需要安装本地 CA 到每个观众设备，均不算达成。

## 1. Current Situation

### 1.1 已完成基础

- 代码侧已完成公网 Postgres 模式下的 Live Class 关键 bug 修复：
  - `GET/POST /api/v1/courses/:id/lesson-nodes` 从 JSON-only 改为走 `coursesRepo`。
  - 新增 `coursesRepo.createLessonNode()`。
  - 创建 Live Class 时同步写入 `lesson_nodes`、`assignment_nodes`、`live_class_students`。
  - `PATCH /api/v1/lesson-nodes/:id`、`/live-classes/:id/students` 已改为双模 repository 路径。
- 已记录本地 commit：
  - `b80ce92 docs: split PRD files by sprint`
  - `86f1f2c fix: create live classes in postgres mode`
- 已验证：
  - `npm run lint`
  - `npm run build`
  - `npm run backend:test`，28/28 passed
- 服务器部署命令路径已存在：
  - `git pull`
  - `npm install`
  - `npm run build`
  - `cd docker`
  - `docker compose up -d --build`

### 1.2 当前部署资产

现有 Docker 入口仍是 Nginx HTTP：

- `docker/docker-compose.yml`：`nginx` 只映射 `80:80`。
- `docker/nginx/nginx.conf`：只监听 `80`，`server_name _`。
- `docs/03-testing-deployment/tencent-cloud-docker-nginx-runbook.md`：明确“Domain and HTTPS are follow-up hardening tasks”。

因此，当前仓库不是“已配置可信 HTTPS”的状态。若服务器上出现自签 HTTPS，属于服务器侧临时改造，不应作为最终上线方案。

### 1.3 DuckDNS 当前状态

从截图确认：

- DuckDNS 账号已登录。
- 当前域名：`lingobridge.duckdns.org`。
- 当前 IPv4：`101.34.72.227`。
- DuckDNS token 已在浏览器截图和聊天日志中暴露。

安全处置：

- S7-T01 必须先轮换 DuckDNS token。
- 轮换后的 token 只允许进入服务器 `.env`、Docker secret 或受控环境变量。
- 不允许写进仓库、Caddyfile、README、PRD、聊天记录或 shell history。

## 2. Research Conclusions

### 2.1 Browser requirement

`getUserMedia()` 是 secure context only API。MDN 明确说明该 API 只在 HTTPS 等安全上下文可用；若页面是 HTTP 或不可信上下文，可能抛出 `NotAllowedError`，也可能导致 `navigator.mediaDevices` 不可用。

来源：

- [MDN - MediaDevices: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN - Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)

### 2.2 Caddy certificate behavior

Caddy 官方文档区分两种 HTTPS：

- 公网 DNS 名称：使用 Let's Encrypt 或 ZeroSSL 等公开 ACME CA 自动签发可信证书。
- IP、localhost、内网 hostname：使用 Caddy local CA/自签证书；未信任本地 CA 的客户端会报安全错误。

因此，自签证书只适合本机或受控内网测试，不适合公网演示录音/摄像头。

来源：

- [Caddy - Automatic HTTPS](https://caddyserver.com/docs/automatic-https)

### 2.3 Let's Encrypt challenge routes

Let's Encrypt 常用两条验证路线：

- `HTTP-01`：需要公网 DNS 指向服务器，且 80 端口可由 CA 访问。
- `DNS-01`：需要自动或手动写 `_acme-challenge` TXT；可用 CNAME/NS 委派。

来源：

- [Let's Encrypt - 验证方式](https://letsencrypt.org/zh-cn/docs/challenge-types/)

### 2.4 DuckDNS with Caddy

Caddy 官方 Docker 镜像默认不包含 DuckDNS DNS provider。若使用 `tls { dns duckdns ... }` 做 DNS-01，需要自定义 Caddy build，把 `github.com/caddy-dns/duckdns` 编译进去。DuckDNS 模块为社区模块，不是 Caddy 标准模块。

来源：

- [Caddy install docs](https://caddyserver.com/docs/install)
- [caddy-dns/duckdns](https://github.com/caddy-dns/duckdns)

### 2.5 Tencent Cloud CLI

本机已有 `tccli`。官方支持：

- `tccli auth login` 通过浏览器授权。
- `tccli auth login --browser no` 在无浏览器机器上复制授权链接。
- `tccli cvm DescribeRegions` 作为登录后验证命令。
- `tccli configure list/get/set` 查看和设置 region/output/profile。

来源：

- [Tencent Cloud - Obtaining Credentials Through Browser Authorization](https://intl.cloud.tencent.com/document/product/1013/64709)
- [Tencent Cloud - TCCLI Configuration Method](https://intl.cloud.tencent.com/document/product/1013/52421)

## 3. Objective

完成 LingoBridge 公网演示环境的可复现上线：

- 域名：`lingobridge.duckdns.org`
- 入口：Caddy 或等价可信 TLS reverse proxy
- 协议：HTTP 自动跳转 HTTPS
- 证书：Let's Encrypt 或 ZeroSSL 公开信任证书
- 应用：前端静态文件、`/api/`、`/uploads/` 全部 HTTPS 可用
- 验收：录音/摄像头在公网域名下可用

## 4. Non-goals

本 sprint 不处理：

- 大规模生产高可用、负载均衡、多机部署。
- 长期商业域名品牌策略。
- 完整 CI/CD、蓝绿发布或自动数据库迁移平台。
- ASR/翻译供应商最终选型。
- ICP 备案完整办理流程本身；这里只做风险识别和预案。

## 5. Key Results

- KR1：DuckDNS token 完成轮换，旧 token 不再可用。
- KR2：`lingobridge.duckdns.org` 解析到 `101.34.72.227`，公网 DNS 查询稳定。
- KR3：腾讯云安全组和实例防火墙允许 `80/tcp`、`443/tcp`，`3001/tcp`、`5432/tcp` 不对公网开放。
- KR4：Caddy 成功签发公开信任证书，浏览器无安全警告。
- KR5：HTTP 自动 301/308 跳转 HTTPS。
- KR6：`/api/v1/health`、登录、课程页、Live Class、上传资源均通过 HTTPS 可用。
- KR7：桌面 Chrome 录音/摄像头 smoke 通过；移动端至少一台设备通过。
- KR8：部署文档记录命令、验证输出、回滚步骤、常见故障处理。

## 6. Recommended Architecture

### 6.1 Preferred path: Caddy + HTTP-01

优先采用 Caddy 默认 Automatic HTTPS，不使用 DuckDNS DNS-01 插件。

理由：

- 当前已有 DuckDNS A 记录指向服务器公网 IP。
- 若腾讯云 `80` 和 `443` 可公网访问，HTTP-01 最简单、最稳。
- 不需要自定义 Caddy 镜像。
- 不需要把 DuckDNS token 放进服务器证书签发链路。

目标结构：

```text
Browser / Mobile
  |
  | https://lingobridge.duckdns.org
  v
Tencent Cloud public IP 101.34.72.227
  |
  | 80/tcp -> HTTPS redirect
  | 443/tcp -> TLS termination
  v
Caddy container
  |-- /         -> static frontend dist
  |-- /api/     -> backend:3001
  |-- /uploads/ -> backend:3001
  v
Backend container
  |
  v
Postgres container
```

### 6.2 Secondary path: Caddy + DuckDNS DNS-01

仅在以下场景使用：

- 80 端口无法开放。
- HTTP-01 因网络、运营商、腾讯云策略失败。
- 需要 wildcard 证书。

要求：

- 使用自定义 Caddy image，编译 `github.com/caddy-dns/duckdns`。
- 轮换 DuckDNS token。
- token 通过环境变量注入，不写进配置文件。
- 持久化 `/data`，否则每次重建都可能丢证书和账户状态。

### 6.3 Emergency fallback paths

若腾讯云大陆实例因域名备案、端口策略或网络问题阻断：

- 短期演示 fallback A：使用非中国大陆地域的临时云主机，仍走 Caddy + HTTP-01。
- 短期演示 fallback B：使用 Cloudflare Tunnel、ngrok、Tailscale Funnel 等提供公开信任 HTTPS 的临时隧道。
- 长期 production fallback：购买正式域名并完成 ICP 备案，再切回腾讯云大陆实例。

fallback 只能用于演示救火，最终里程碑仍以稳定域名 + 可信 HTTPS + 可复现部署为准。

## 7. Task Breakdown

| ID | 任务 | 交付 | 状态 |
|---|---|---|---|
| S7-T01 | DuckDNS token 安全处置 | 轮换 token；旧 token 失效；新 token 不进仓库/日志 | todo |
| S7-T02 | 腾讯云资源识别 | 用 `tccli` 找到 CVM/Lighthouse 实例、region、公网 IP、安全组 | todo |
| S7-T03 | DNS 验证 | `lingobridge.duckdns.org` A 记录解析到 `101.34.72.227`，无旧 IP 残留 | todo |
| S7-T04 | 安全组与防火墙 | 开 `80/443`，关公网 `3001/5432`，SSH 保持受控 | todo |
| S7-T05 | Caddy 入口改造 | 用 Caddy 替代 Nginx 或作为前置入口，配置静态文件与反代 | todo |
| S7-T06 | HTTPS 签发 | 使用 HTTP-01 获取公开信任证书；若失败再评估 DNS-01 | todo |
| S7-T07 | App HTTPS 配置 | `VITE_API_BASE_URL` 使用同源或 `https://lingobridge.duckdns.org/api/v1` | todo |
| S7-T08 | 部署执行 | 服务器 `git pull`、依赖安装、build、compose up | todo |
| S7-T09 | API 与业务 smoke | health、login、课程、Live Class、上传资源通过 HTTPS | todo |
| S7-T10 | 录音/摄像头 smoke | 桌面和移动端验证 `getUserMedia()` 可用 | todo |
| S7-T11 | 故障与回滚演练 | 证书失败、端口失败、DNS 失败、应用失败均有处理路径 | todo |
| S7-T12 | 交付记录 | 写入公网 URL、命令、验证结果、截图/录屏、剩余风险 | todo |

## 8. Execution Order

### Phase 1 - Freeze and protect secrets

1. 停止继续在聊天、PRD、脚本里粘贴 DuckDNS token。
2. 在 DuckDNS 控制台生成新 token。
3. 更新服务器环境变量或 secret。
4. 确认旧 token 不再可用于更新 IP。
5. 检查仓库：

```bash
rg -n "duckdns|DUCKDNS|token|api_token" .
```

若发现真实 token，立即移除并重新轮换。

### Phase 2 - Discover Tencent Cloud resources with tccli

本机登录：

```bash
tccli auth login
```

若当前终端无法打开浏览器：

```bash
tccli auth login --browser no
```

验证 CLI 可用：

```bash
tccli cvm DescribeRegions
```

查看配置：

```bash
tccli configure list
tccli configure get region
```

常见 region 候选：

- `ap-guangzhou`
- `ap-shanghai`
- `ap-beijing`
- `ap-hongkong`

查询 CVM：

```bash
tccli cvm DescribeInstances --region ap-guangzhou
tccli cvm DescribeInstances --region ap-shanghai
tccli cvm DescribeInstances --region ap-beijing
tccli cvm DescribeInstances --region ap-hongkong
```

查询 Lighthouse：

```bash
tccli lighthouse DescribeInstances --region ap-guangzhou
tccli lighthouse DescribeInstances --region ap-shanghai
tccli lighthouse DescribeInstances --region ap-beijing
tccli lighthouse DescribeInstances --region ap-hongkong
```

要记录：

- `InstanceId`
- `InstanceName`
- `PublicIpAddresses`
- `PrivateIpAddresses`
- `Zone`
- `SecurityGroupIds`
- OS 类型
- 是否为 CVM 或 Lighthouse

### Phase 3 - Verify DNS before touching Caddy

本机验证：

```bash
dig +short lingobridge.duckdns.org A
nslookup lingobridge.duckdns.org
curl --noproxy "*" -sS http://lingobridge.duckdns.org/api/v1/health
```

服务器验证公网出口看到的 IP：

```bash
curl --noproxy "*" -sS https://api.ipify.org
```

若 DuckDNS 记录错误，更新 IP 后等待 DNS 生效，再继续。

### Phase 4 - Open only required public ports

公网允许：

- `80/tcp`
- `443/tcp`
- `22/tcp`，最好限制为可信 IP

公网不允许：

- `3001/tcp`
- `5432/tcp`
- Redis、Docker daemon、Postgres、内部管理端口

服务器本机检查：

```bash
ss -tulpn
docker compose ps
```

本机远程检查：

```bash
curl --noproxy "*" -I http://lingobridge.duckdns.org/
curl --noproxy "*" -kI https://lingobridge.duckdns.org/
```

`-k` 只能用于诊断当前证书状态，不可作为验收标准。

### Phase 5 - Replace Nginx ingress with Caddy

建议新增：

- `docker/Caddyfile`
- 可选：`docker/docker-compose.https.yml` 或直接更新 `docker/docker-compose.yml`

推荐 Caddyfile：

```caddyfile
{
	email admin@example.com
}

lingobridge.duckdns.org {
	encode gzip zstd

	root * /usr/share/caddy

	handle /api/* {
		reverse_proxy backend:3001
	}

	handle /uploads/* {
		reverse_proxy backend:3001
	}

	handle {
		try_files {path} /index.html
		file_server
	}
}
```

注意：

- `admin@example.com` 替换为可接收证书通知的邮箱。
- 不要写 `tls internal`，那会使用 Caddy 内部 CA。
- 不要手动挂自签证书。
- 不要把站点地址写成 `http://lingobridge.duckdns.org`，否则会禁用自动 HTTPS。
- Caddy `/data` 和 `/config` 必须持久化。

推荐 compose 入口：

```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../dist:/usr/share/caddy:ro
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - backend
    restart: unless-stopped
```

同时删除或停用旧 `nginx` 服务，避免端口冲突。

### Phase 6 - Build with HTTPS API base

优先使用同源 API。若代码要求显式环境变量：

```bash
VITE_API_BASE_URL=https://lingobridge.duckdns.org/api/v1 npm run build
```

检查前端产物里没有硬编码旧 HTTP：

```bash
rg -n "http://|127.0.0.1:3001|localhost:3001" dist src
```

允许存在：

- 文档示例
- 测试 fixture
- `apiClient.ts` 的 local fallback

不允许存在：

- 生产 bundle 指向 `http://101.34.72.227`
- 生产 bundle 指向 `http://lingobridge.duckdns.org`
- 生产组件绕过 `apiClient.ts`

### Phase 7 - Deploy on server

服务器执行：

```bash
cd /opt/lingobridge
git status --short
git pull
npm install
VITE_API_BASE_URL=https://lingobridge.duckdns.org/api/v1 npm run build
cd docker
docker compose up -d --build
docker compose ps
docker compose logs --tail=120 caddy
```

如果使用单文件 compose 且服务名还叫 `nginx`，必须先停旧服务：

```bash
docker compose stop nginx
docker compose rm nginx
docker compose up -d --build caddy backend postgres
```

### Phase 8 - Certificate verification

本机验证：

```bash
curl --noproxy "*" -I http://lingobridge.duckdns.org/
curl --noproxy "*" -I https://lingobridge.duckdns.org/
openssl s_client -connect lingobridge.duckdns.org:443 -servername lingobridge.duckdns.org </dev/null
```

验收标准：

- HTTP 返回 301/308 到 HTTPS。
- HTTPS 不需要 `curl -k`。
- 证书 Subject/SAN 包含 `lingobridge.duckdns.org`。
- Issuer 是 Let's Encrypt、ZeroSSL 或其他公开信任 CA，不是 Caddy Local Authority。
- 浏览器地址栏无“不安全”警告。

### Phase 9 - Business smoke

API smoke：

```bash
curl --noproxy "*" -sS https://lingobridge.duckdns.org/api/v1/health
```

人工 smoke：

1. 打开 `https://lingobridge.duckdns.org/`。
2. 登录 teacher。
3. 打开课程页。
4. 添加 Live Class。
5. 验证 `lesson_nodes`/`assignment_nodes` 对应路径不再 `Course not found`。
6. 上传或打开课件资源。
7. 登录 student。
8. 确认 student 能看到课程/live/作业入口。

### Phase 10 - Recording/camera smoke

浏览器控制台：

```js
window.isSecureContext
navigator.mediaDevices
await navigator.mediaDevices.getUserMedia({ audio: true })
```

如果有摄像头场景：

```js
await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
```

验收标准：

- `window.isSecureContext` 是 `true`。
- `navigator.mediaDevices.getUserMedia` 存在。
- 浏览器出现权限弹窗。
- 允许后能获得 `MediaStream`。
- 应用内录音/摄像头流程可用。

移动端补充：

- 使用移动网络测试一次，避免只验证校园/办公 Wi-Fi。
- iOS Safari 必须由用户手势触发录音/摄像头请求。
- Android Chrome 若重复弹权限，检查是否多次调用 `getUserMedia()`。

## 9. Troubleshooting Runbook

### 9.1 浏览器仍提示证书不安全

检查：

```bash
docker compose logs --tail=200 caddy
openssl s_client -connect lingobridge.duckdns.org:443 -servername lingobridge.duckdns.org </dev/null
```

常见原因：

- Caddyfile 使用了 `tls internal`。
- 访问的是 IP，不是域名。
- Caddy 没拿到公开证书，回退到 local CA。
- 443 被旧 Nginx/其他服务占用。
- Caddy `/data` 没持久化，重启后重复签发或状态丢失。

处理：

- 删除 `tls internal`。
- 用域名访问。
- 停掉旧入口。
- 持久化 `caddy-data`。
- 重新 `docker compose up -d --build` 后看 Caddy 日志。

### 9.2 Caddy 无法签发证书

检查：

- DNS 是否指向当前服务器。
- 80/443 是否公网开放。
- 腾讯云安全组是否放行。
- 实例内防火墙是否放行。
- 是否达到 Let's Encrypt rate limit。

命令：

```bash
dig +short lingobridge.duckdns.org A
curl --noproxy "*" -I http://lingobridge.duckdns.org/
docker compose logs --tail=200 caddy
```

处理：

- DNS 错：更新 DuckDNS IP。
- 80 不通：修安全组/防火墙。
- 443 被占：停旧服务。
- rate limit：切到 Caddy staging 测试，或等待限制解除。
- 80 长期不可用：评估 DuckDNS DNS-01 自定义 Caddy 镜像。

### 9.3 录音/摄像头仍不可用

检查：

```js
window.isSecureContext
navigator.permissions?.query({ name: "microphone" })
navigator.mediaDevices
```

常见原因：

- 页面证书仍不被信任。
- HTTP 页面嵌入 HTTPS/HTTP iframe，顶层上下文不安全。
- 浏览器权限被用户点了 Block。
- 移动端不是用户手势触发。
- 应用代码在 HTTP API 或 HTTP asset 上触发 mixed content。

处理：

- 清理站点权限后重试。
- 用无痕窗口测试。
- DevTools Console 查 mixed content。
- 确保所有 API/资源都是 HTTPS。
- 确保录音按钮点击后才调用 `getUserMedia()`。

### 9.4 API 健康检查 HTTPS 正常但前端登录失败

检查：

- `VITE_API_BASE_URL` 是否仍指向 HTTP/IP/localhost。
- 后端是否设置正确 CORS。
- cookie/session 是否需要 `Secure`、`SameSite` 调整。
- Caddy 是否正确转发 `/api/*`。

命令：

```bash
rg -n "VITE_API_BASE_URL|http://|101.34.72.227|127.0.0.1:3001" dist src
curl --noproxy "*" -sS https://lingobridge.duckdns.org/api/v1/health
docker compose logs --tail=120 backend
```

### 9.5 `/uploads/` 资源 404 或 mixed content

检查：

- 后端返回的 upload URL 是否是相对路径。
- 前端是否拼接了 HTTP origin。
- Caddy 是否把 `/uploads/*` 反代到 backend。

处理：

- 优先让后端返回相对 URL。
- 前端用 `new URL(path, window.location.origin)`。
- Caddy 保留 `/uploads/* -> backend:3001`。

### 9.6 腾讯云大陆域名备案风险

风险：

- 中国大陆云服务器对未备案域名的 Web 访问可能存在平台策略、接入审核或后续封堵风险。
- DuckDNS `.org` 免费域名通常不适合作为长期生产域名备案。

短期演示预案：

- 若 `80/443` 当前可用，先完成 Sprint 7 demo。
- 若因备案或策略阻断，切到香港/海外实例或可信 HTTPS 隧道。

长期预案：

- 购买正式域名。
- 完成 ICP 备案。
- 将正式域名 CNAME/A 到生产入口。
- Caddy 自动签发正式域名证书。

## 10. Rollback Plan

### 10.1 回滚到 HTTP Nginx

仅用于恢复基本访问，不满足录音/摄像头里程碑。

```bash
cd /opt/lingobridge/docker
docker compose stop caddy
docker compose up -d nginx backend postgres
```

### 10.2 回滚到上一代码版本

```bash
cd /opt/lingobridge
git log --oneline -8
git checkout <known-good-commit>
npm install
VITE_API_BASE_URL=https://lingobridge.duckdns.org/api/v1 npm run build
cd docker
docker compose up -d --build
```

### 10.3 保留证书数据

不要删除：

- `caddy-data`
- `caddy-config`

除非明确要清空 ACME 账户和证书状态。误删可能触发重复签发和 rate limit。

## 11. Verification Checklist

### Infrastructure

- [ ] DuckDNS token 已轮换。
- [ ] DNS A 记录指向 `101.34.72.227`。
- [ ] 腾讯云安全组放行 `80/443`。
- [ ] 服务器防火墙放行 `80/443`。
- [ ] 旧 Nginx 没有占用 `80/443`。
- [ ] Postgres 不对公网开放。
- [ ] Backend `3001` 不对公网开放。

### HTTPS

- [ ] `http://lingobridge.duckdns.org/` 自动跳转 HTTPS。
- [ ] `https://lingobridge.duckdns.org/` 无证书警告。
- [ ] 证书不是 self-signed。
- [ ] 证书 SAN 包含 `lingobridge.duckdns.org`。
- [ ] Caddy 日志无 ACME 错误。
- [ ] Caddy data volume 持久化。

### Application

- [ ] `/api/v1/health` HTTPS 正常。
- [ ] 登录正常。
- [ ] Teacher 课程页正常。
- [ ] 添加 Live Class 正常。
- [ ] Student 可见课程/live/作业入口。
- [ ] 上传资源可 HTTPS 访问。
- [ ] DevTools 无 mixed content。

### Media

- [ ] `window.isSecureContext === true`。
- [ ] `navigator.mediaDevices.getUserMedia` 存在。
- [ ] 桌面 Chrome 麦克风通过。
- [ ] 移动端浏览器麦克风通过。
- [ ] 摄像头场景如需演示则通过。
- [ ] 用户拒绝权限时有可理解提示或 fallback。

## 12. Agent Prompt

```text
你是 LingoBridge Sprint 7 公网 HTTPS 上线工程师。目标不是“能打开 HTTPS”，而是让 https://lingobridge.duckdns.org 成为普通浏览器可信的 HTTPS 公网演示环境，并让录音/摄像头权限可用。

必须先读：
- prds/sprints/sprint-07-public-https-demo-deploy.md
- docs/03-testing-deployment/tencent-cloud-docker-nginx-runbook.md
- docker/docker-compose.yml
- docker/nginx/nginx.conf

执行原则：
1. 不使用自签证书作为公网演示验收。
2. 优先 Caddy 默认 Automatic HTTPS + HTTP-01。
3. 只有在 80 端口无法公网验证时，才评估 DuckDNS DNS-01 自定义 Caddy 镜像。
4. DuckDNS token 已暴露，必须先轮换；新 token 不得写入仓库、Caddyfile、PRD 或日志。
5. 3001 和 5432 不得对公网开放。
6. 前端生产构建不得指向 http://、公网 IP、localhost 或 127.0.0.1 API。
7. 完成声明前必须验证 window.isSecureContext 和 getUserMedia。

执行顺序：
1. 用 tccli auth login / configure list / DescribeInstances 找到腾讯云实例、region、安全组、公网 IP。
2. 验证 lingobridge.duckdns.org A 记录指向 101.34.72.227。
3. 放行安全组 80/443，确认服务器本机防火墙。
4. 新增 Caddyfile 和 compose 入口，替代旧 Nginx。
5. 使用 VITE_API_BASE_URL=https://lingobridge.duckdns.org/api/v1 npm run build。
6. 服务器 git pull、npm install、npm run build、docker compose up -d --build。
7. 检查 Caddy 日志和 openssl 证书链，确认公开信任 CA。
8. 执行业务 smoke：health、login、Teacher 添加 Live Class、Student 查看入口。
9. 执行录音/摄像头 smoke：window.isSecureContext、navigator.mediaDevices、getUserMedia。
10. 输出公网 URL、证书 issuer、测试设备、失败项、回滚命令。

禁止：
- 不要用 tls internal。
- 不要手工挂载自签证书。
- 不要把 DuckDNS token 写进任何提交文件。
- 不要为了通过测试使用 curl -k 作为验收。
- 不要开放 Postgres 或 backend 到公网。
```

## 13. Done Definition

Sprint 7 只有在以下条件全部满足时关闭：

- `https://lingobridge.duckdns.org/` 在普通浏览器无证书警告。
- `curl --noproxy "*" -I https://lingobridge.duckdns.org/` 不需要 `-k`。
- `https://lingobridge.duckdns.org/api/v1/health` 正常。
- Teacher 添加 Live Class 的公网 bug 不复现。
- Student 端可进入相关课程/live/作业入口。
- 录音/摄像头 smoke 通过。
- 回滚命令已记录。
- DuckDNS token 已轮换且未进入仓库。
