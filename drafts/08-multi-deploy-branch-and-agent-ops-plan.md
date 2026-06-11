# LingoBridge 多部署方案与 Agent 工程化交接计划

Date: 2026-05-25
Status: Draft, core `.agent` handoff assets completed
Owner: caolei + Codex

## 0. 一句话结论

后天演示的优先目标不是把所有部署路线都做到完美，而是保证至少一条路线稳定可演示，并且为每条路线准备清晰的 fallback。

建议优先级：

1. **主演示路径：Vercel HTTPS 前端 + 腾讯云后端轻量 API + 避免大文件上传演示**
2. **备份演示路径：本机 localhost 演示完整摄像头/麦克风/上传能力**
3. **备用公网路径：腾讯云公网 IP 直连，用于证明后端服务和大文件上传稳定**

原因：

- 摄像头/麦克风需要 HTTPS 或 localhost。
- 腾讯云公网 IP 直连 HTTP 非常快，但浏览器安全上下文不足，不能作为完整媒体演示入口。
- Vercel 有 HTTPS，可拿摄像头/麦克风权限，但大文件经 Vercel 回源腾讯云仍会 502。
- 当前 multipart 已证明直连腾讯云 27MB 文件上传成功，瓶颈在 Vercel Router，不在后端代码。

## 1. 已踩坑事实库

### 1.1 HTTPS 与媒体权限

浏览器调用摄像头、麦克风、屏幕共享等能力依赖安全上下文：

- `localhost` 可以。
- HTTPS 域名可以。
- 普通 `http://公网IP` 不适合作为正式媒体演示入口。

这意味着国内腾讯云公网 IP 即使访问很快，也不能单独承载完整媒体演示。

### 1.2 Vercel 回源腾讯云的大文件问题

已经验证：

- 小请求、健康检查、登录：Vercel -> 腾讯云可用。
- 大文件上传：即使改成 multipart，27MB PPTX 经 Vercel 回源仍返回 `502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR`。
- 同一个 27MB PPTX 直连腾讯云公网 IP 上传成功，约 12.5 秒。

结论：短期不要把“大文件上传”放在 Vercel rewrite 链路上。

### 1.3 GitHub from 腾讯云不稳定

通过 Tencent TAT 远程部署时遇到：

- SSH remote：host key verification failed。
- HTTPS remote：GnuTLS recv error，TLS connection 非正常终止。

最终可行方案：

- 本地生成小 patch。
- 通过 TAT 将 patch 注入服务器。
- 在服务器上 `patch -p1`、`npm run build`、`docker compose up -d --build`。

### 1.4 远端工作区不是干净 Git 状态

腾讯云服务器上存在手工部署改动：

- `docker/Caddyfile`
- `docker/docker-compose.yml`
- 若干 `.bak`、ssl 相关文件

因此自动化部署不能默认 `git reset --hard` 或覆盖 Docker/Caddy 配置。必须区分：

- 应用源码更新
- 远端运维配置
- 证书/端口/反代配置

## 2. 三套部署方案

## 2.1 方案 A：本地 MVP 稳定演示版

目标：

- 用于后天现场兜底演示。
- 保证功能完整、可控、低延迟。
- 允许依赖本机运行。

建议分支：

- `demo/local-static`

运行形态：

- 前端：本地静态 `dist` 或 Vite preview。
- 后端：本地 Node/Express 或 Docker Compose。
- 数据库：本地 Postgres/Docker 或 JSON fallback。
- 媒体权限：使用 `localhost`，摄像头/麦克风可用。

可选公网访问：

- 若只给同一局域网用户访问，可用本机局域网 IP，但摄像头/麦克风可能受非安全上下文限制。
- 若要公网访问并保留媒体权限，优先用 HTTPS 隧道，例如 Cloudflare Tunnel/ngrok/localtunnel 一类方案。
- Nginx 反代适合做本机统一入口，但如果没有 HTTPS，仍解决不了媒体权限问题。

需要写入项目的内容：

- `docker/nginx/local-demo.conf`
- `docs/03-testing-deployment/local-demo-runbook.md`
- `.agent/workflows/local-static-demo.md`

验收标准：

- `npm run build` 成功。
- 本地前端可登录老师账号。
- 老师进入课堂可调用摄像头/麦克风。
- 小 PDF 上传和 PDF 预览通过。
- 学生端作业/录音主链路可用。

不建议在后天前强求：

- 本地 Nginx HTTPS 自签证书。
- 多人公网稳定访问。
- 大文件公网上传。

## 2.2 方案 B：海外 Vercel 开发/展示版

目标：

- 作为外部开发者最容易访问的 HTTPS 演示环境。
- 保留 GitHub/Vercel 自动化部署体验。
- 适合轻量 API、登录、媒体权限、页面演示。

建议分支：

- `dev/overseas-vercel`

当前形态：

- 前端：Vercel。
- API：Vercel rewrite 到腾讯云公网 IP。
- 优点：HTTPS、摄像头/麦克风可用、访问地址好发。
- 缺点：海外 Vercel 到国内腾讯云回源不稳定，大文件上传失败。

后天演示策略：

- 可以演示登录、课程页面、摄像头/麦克风、轻量 API。
- 避免现场上传 20MB+ PDF/PPTX。
- 准备好预置课件或小文件。
- 大文件上传如需展示，切到本地或腾讯直连接口证明。

是否可以“全部海外”：

可以，而且从工程上更干净：

- GitHub Actions 做 CI。
- Vercel 托管前端。
- 后端迁到海外服务，例如 Render/Fly.io/Railway/VPS。
- 数据库迁到 Neon/Supabase/Railway Postgres。
- 文件存储迁到 Cloudflare R2/S3 兼容对象存储。

这样国内访问可能需要科学上网，但链路会变成：

`用户 -> Vercel HTTPS -> 海外后端 -> 海外数据库/对象存储`

不再出现海外 Vercel 回源国内腾讯云的跨境大文件问题。

适合开源后的默认开发环境，因为其他开发者更容易复现。

需要建设：

- `.github/workflows/ci.yml`
- `.github/workflows/vercel-preview.yml` 或使用 Vercel GitHub App
- `docs/03-testing-deployment/overseas-vercel-runbook.md`
- `.agent/workflows/overseas-vercel-release.md`

验收标准：

- PR 触发 lint/backend tests/build。
- main 或指定分支触发 Vercel preview/production。
- 后端健康检查和登录 smoke 通过。
- 大文件上传明确标为“非本链路能力”，直到接入对象存储直传。

## 2.3 方案 C：国内腾讯云公网稳定版

目标：

- 不依赖本机。
- 国内访问后端和大文件上传稳定。
- 后续做 HTTPS 后成为正式国内演示环境。

建议分支：

- `release/tencent-static`

当前状态：

- 腾讯云公网 IP：`101.34.72.227`
- 后端健康检查非常快，约 0.05 秒。
- 27MB PPTX 直连腾讯云 multipart 上传成功。
- Caddy/Docker 已在远端运行。

主要缺口：

- 还没有稳定 HTTPS 域名入口。
- 没有 HTTPS 时，摄像头/麦克风不能作为正式浏览器能力演示。
- 远端 GitHub 拉取不稳定，TAT patch 是临时可用手段，不是长期运维方式。

后天演示策略：

- 用它证明“公网后端服务和大文件上传是稳定的”。
- 不把它作为摄像头/麦克风主入口。
- 若老师/评委只看访问性，可展示 IP 入口的健康检查、登录、课程 API 和上传接口。

长期改造：

- 正式域名 + ICP 备案或使用可用 HTTPS 入口。
- Caddy HTTPS 自动证书或托管证书。
- COS 签名直传。
- GitHub Actions 构建 artifact，然后通过 TAT/SSH/对象存储部署到腾讯云，减少服务器直连 GitHub 依赖。

需要建设：

- `docs/03-testing-deployment/tencent-runbook.md`
- `scripts/deploy/tencent-patch-deploy.sh`
- `.agent/workflows/tencent-release.md`
- `.agent/skills/tencent-tat-patch-deploy/SKILL.md`

验收标准：

- `http://101.34.72.227/api/v1/health` 200。
- 登录 200。
- 27MB multipart 上传 200。
- Docker 服务状态健康。
- 回滚方式明确。

## 3. 分支模型

建议采用“演示分支 + 主干开发”的临时模型，后天演示结束后再收敛。

| 分支 | 职责 | 是否演示优先 | 备注 |
| --- | --- | --- | --- |
| `main` | 稳定主干 | 中 | 不直接实验高风险部署 |
| `demo/local-static` | 本地稳定演示 | 高 | 后天兜底第一优先 |
| `dev/overseas-vercel` | 海外 HTTPS 开发版 | 高 | Vercel 演示入口 |
| `release/tencent-static` | 国内腾讯云稳定版 | 中 | 当前适合 API/上传证明 |
| `codex/bugfix-multipart-courseware-upload` | multipart 修复 | 已完成 | 应合并/挑拣进入三个方案分支 |

分支原则：

- 不同部署方案可以有不同配置，但业务代码尽量共享。
- 配置差异放在 `vercel.json`、`docker/`、`scripts/deploy/`、环境变量说明里。
- 不允许为了某个部署环境改坏主业务。
- 每个分支必须有对应 runbook。

## 4. `.agent` 体系建设计划

当前 `.agent` 目录太轻，不够支撑开源协作和 agent 交接。建议建设为：

```text
.agent/
  rules/
    project-map.md
    branch-and-release.md
    deployment-boundaries.md
    security.md
    mvp-scope.md
    docs-and-prd.md
    testing-gates.md
  skills/
    local-demo-build/
      SKILL.md
    tencent-tat-patch-deploy/
      SKILL.md
    vercel-smoke-deploy/
      SKILL.md
    courseware-upload-debug/
      SKILL.md
    docs-research-synthesis/
      SKILL.md
    git-release-manager/
      SKILL.md
  workflows/
    local-static-demo.md
    vercel-release.md
    tencent-release.md
    devops-smoke-test.md
    technical-research.md
    git-project-management.md
    prototype-vibe-coding.md
```

### 4.1 Rules 应该写什么

#### `project-map.md`

描述项目目录和所有权：

- `src/`：React 前端。
- `backend/`：Express API、Postgres/JSON 双模、文件存储。
- `docker/`：腾讯云/本地容器部署。
- `scripts/`：部署、截图、健康检查、数据维护脚本。
- `tests/`：回归和验收测试。
- `prds/`：已批准产品/执行合同。
- `drafts/`：未批准草案。
- `.agent/`：agent 协作规范。

#### `branch-and-release.md`

规定：

- 分支命名。
- 何时从 main 切 demo/release 分支。
- 什么改动可以 cherry-pick。
- 演示前冻结策略。
- 回滚策略。

#### `deployment-boundaries.md`

规定三套部署方案边界：

- local 不追求公网多人稳定。
- Vercel 不承载大文件上传。
- Tencent HTTP 不作为媒体权限主入口。
- COS 直传是大文件正式方案。

#### `testing-gates.md`

规定每类改动最低测试：

- 前端：`npm run lint`、`npm run build`。
- 后端：`npm run backend:test`。
- 部署：health/login/upload smoke。
- 媒体改动：浏览器手测或 Playwright/Browser 检查。

### 4.2 Skills 应该抽象什么

重复两次以上、且容易出错的操作应该抽象成 skill：

#### `tencent-tat-patch-deploy`

抽象原因：

- SSH 不通。
- GitHub from 腾讯云不稳。
- TAT patch 部署已经验证可行。

Skill 内容：

- 如何生成小 patch。
- 如何 base64 编码。
- 如何 RunCommand。
- 如何 DescribeInvocationTasks。
- 如何解读失败：dirty tree、host key、GnuTLS、Docker build。
- 如何 health check。

#### `courseware-upload-debug`

抽象原因：

- 已多次排查 PDF/PPTX 上传、Vercel 502、multipart/base64、PDF.js 渲染问题。

Skill 内容：

- 小 PDF vs 27MB PPTX 对照测试。
- 直连腾讯云 vs Vercel rewrite 对照。
- 如何判断是前端、后端、Vercel Router、Caddy、PDF.js 哪一层。

#### `vercel-smoke-deploy`

抽象原因：

- Vercel 部署后必须检查 alias、health、login、轻量 API。

Skill 内容：

- `vercel deploy --prod`
- 读取 production URL 和 alias。
- curl health/login。
- 明确不要用它测大文件上传，除非是为了验证失败。

#### `local-demo-build`

抽象原因：

- 后天演示需要稳定本地环境。

Skill 内容：

- 启动后端/前端。
- 构建 dist。
- 本地账号和测试样例。
- 摄像头/麦克风检查。

### 4.3 Workflows 应该沉淀什么

#### `devops-smoke-test.md`

固定顺序：

1. health
2. login
3. courses
4. lesson nodes
5. small PDF upload
6. large PPTX upload, only for direct Tencent/local
7. media permission check, only for HTTPS/localhost

#### `tencent-release.md`

固定顺序：

1. 检查远端 dirty tree。
2. 不覆盖 Caddy/Docker 手工配置。
3. patch 源码。
4. build。
5. docker compose up。
6. health/login/upload smoke。
7. 记录 TAT invocation。

#### `prototype-vibe-coding.md`

适合快速做产品原型：

- 先定义用户路径。
- 先让第一屏可用。
- 再补边界状态。
- 最后跑 smoke，不先做过度抽象。

## 5. 我建议 Codex 亲自完成的复杂活

这些任务难、容易踩坑，适合由当前已掌握上下文的 Codex 继续做：

1. **写 `.agent/rules/project-map.md`** - Done
   - 需要了解整个项目目录和历史决策。
2. **写 `.agent/rules/deployment-boundaries.md`** - Done
   - 需要把 HTTPS、Vercel、Tencent、COS、localhost 的坑讲清楚。
3. **写 `.agent/skills/tencent-tat-patch-deploy/SKILL.md`** - Done
   - 这是最有项目特异性的经验。
4. **写 `.agent/skills/courseware-upload-debug/SKILL.md`** - Done
   - 这是最容易反复踩坑的调试流程。
5. **写 `.agent/workflows/devops-smoke-test.md`** - Done
   - 后续所有 agent 都会用。
6. **写 `.agent/workflows/tencent-release.md`** - Done
   - 远端部署有 dirty tree 和网络限制，必须明确保护规则。

完成位置：

- `.agent/rules/project-map.md`
- `.agent/rules/deployment-boundaries.md`
- `.agent/skills/tencent-tat-patch-deploy/SKILL.md`
- `.agent/skills/courseware-upload-debug/SKILL.md`
- `.agent/workflows/devops-smoke-test.md`
- `.agent/workflows/tencent-release.md`

## 6. 可交给其他 agent 的任务

这些任务相对独立，可以并行分派：

1. 写 `docs/03-testing-deployment/local-demo-runbook.md`
2. 写 `docs/03-testing-deployment/overseas-vercel-runbook.md`
3. 写 `docs/03-testing-deployment/tencent-runbook.md`
4. 写 `.github/workflows/ci.yml`
5. 写 `.agent/workflows/prototype-vibe-coding.md`
6. 写 `.agent/workflows/technical-research.md`
7. 整理 README 的开源贡献指南
8. 梳理 `.env.example` 和部署环境变量矩阵

可直接复制给其他 agent 的完整提示词已写入：

- `prompts/deployment-handoff-agents.md`

分派建议：

| Agent | 任务 | 产物 |
| --- | --- | --- |
| Agent 1 | 本地演示 Runbook | `docs/03-testing-deployment/local-demo-runbook.md` |
| Agent 2 | Vercel 海外 HTTPS Runbook | `docs/03-testing-deployment/overseas-vercel-runbook.md` |
| Agent 3 | 腾讯云直连 Runbook | `docs/03-testing-deployment/tencent-runbook.md` |
| Agent 4 | GitHub Actions CI | `.github/workflows/ci.yml` |
| Agent 5 | 原型开发 Workflow | `.agent/workflows/prototype-vibe-coding.md` |
| Agent 6 | 技术调研 Workflow | `.agent/workflows/technical-research.md` |
| Agent 7 | 开源贡献指南 | `README.md` 或 `docs/CONTRIBUTING.md` |
| Agent 8 | 环境变量矩阵 | `.env.example` 与/或 `docs/03-testing-deployment/env-matrix.md` |

## 7. 后天演示建议脚本

### 7.1 开场证明服务在线

- 打开 `https://lingobridge-lake.vercel.app`
- 登录老师账号
- 展示课程、Live Class、课堂页面

### 7.2 媒体能力演示

- 在 Vercel HTTPS 页面或 localhost 页面演示摄像头/麦克风。
- 不在 `http://101.34.72.227` 页面演示媒体权限。

### 7.3 课件演示

- 使用预置小 PDF 或已上传课件。
- 不现场通过 Vercel 上传 27MB 大文件。
- 如需证明大文件能力，切换到接口测试或腾讯直连路径，说明 Vercel 是代理瓶颈，正式方案将走 COS 直传。

### 7.4 兜底

- 本地 localhost 版本必须提前启动并验证。
- 准备一份屏幕录制或截图，防止现场网络不稳。

## 8. COS 直传进入条件

当后天演示准备稳定后，再进入 COS 直传：

需要准备：

- `COS_BUCKET`
- `COS_REGION`
- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- Bucket CORS 规则
- 签名 API

验收：

- 浏览器向后端请求签名。
- 浏览器直接上传 COS HTTPS。
- 后端保存 file metadata。
- PDF.js 从 COS HTTPS URL 读取原文件。

## 9. 立即下一步

当前 Codex 已完成 `.agent` 核心骨架，不再碰部署：

1. 新增 `.agent/rules/project-map.md`
2. 新增 `.agent/rules/deployment-boundaries.md`
3. 新增 `.agent/skills/tencent-tat-patch-deploy/SKILL.md`
4. 新增 `.agent/skills/courseware-upload-debug/SKILL.md`
5. 新增 `.agent/workflows/devops-smoke-test.md`
6. 新增 `.agent/workflows/tencent-release.md`
7. 新增 `prompts/deployment-handoff-agents.md`

这些是最难转述、最能减少后续 agent 重复踩坑的部分。

后续进入并行执行：

1. 先分派 Agent 1、2、3，把三条演示路线 runbook 补齐。
2. 同时分派 Agent 4，补 CI，但不阻塞后天演示。
3. 再分派 Agent 8，补环境变量矩阵，降低部署误配风险。
4. Agent 5、6、7 可以作为文档治理任务排在演示稳定之后。
