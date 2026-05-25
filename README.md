<p align="center">
  <img src="./public/logo.svg" alt="LingoBridge Logo" width="160" />
</p>

<h1 align="center">LingoBridge</h1>

<p align="center">
  中文学习直播课堂 MVP / Chinese Learning Live Classroom MVP
</p>

## 项目简介 / Overview

| 中文 | English |
| --- | --- |
| LingoBridge 是面向哈萨克斯坦来华留学生的中文学习 MVP。项目聚焦教师上传课件、学生同步学习、中文 TTS、录音练习、作业导入和直播课堂演示。 | LingoBridge is a Chinese learning MVP for Kazakhstani international students. It focuses on teacher courseware upload, synchronized student learning, Chinese TTS, recording practice, homework import, and live classroom demos. |
| 当前 MVP 范围刻意收窄，目标是稳定完成课堂演示闭环，而不是构建完整 LMS 或 SaaS 平台。 | The current MVP scope is intentionally narrow. The goal is to complete a reliable classroom demo loop, not a full LMS or SaaS platform. |
| 代码仍以仓库根目录的 Vite + React 前端为主，同时包含 Express API、测试、部署、脚本和 AI 协作规范。 | The codebase still centers on the root Vite + React frontend, with an Express API, tests, deployment assets, scripts, and AI collaboration rules. |

## 快速开始 / Quick Start

| 中文 | English |
| --- | --- |
| 安装依赖 | Install dependencies |
| `npm install` | `npm install` |
| 启动本地开发服务 | Start the local dev server |
| `npm run dev` | `npm run dev` |
| 构建前端 | Build the frontend |
| `npm run build` | `npm run build` |
| 运行类型检查 | Run type checks |
| `npm run lint` | `npm run lint` |
| 运行后端测试 | Run backend tests |
| `npm run backend:test` | `npm run backend:test` |

## 本地模拟顺序 / Local Simulation Order

| 中文 | English |
| --- | --- |
| 推荐先用 PM2 管理本地端口和进程，确认本地 E2E 稳定后，再进入 Docker 和云端部署。 | Use PM2 first for local port and process management. Move to Docker and cloud deployment only after local E2E is stable. |
| 后端 API 默认端口：`127.0.0.1:3001` | Backend API default port: `127.0.0.1:3001` |
| 前端 preview 默认端口：`127.0.0.1:4174` | Frontend preview default port: `127.0.0.1:4174` |

```bash
npm run build
npm run pm2:start
pm2 list
curl --noproxy '*' -sS http://127.0.0.1:3001/api/v1/health
curl --noproxy '*' -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:4174/
```

## 线上演示 / Public Demo

| 中文 | English |
| --- | --- |
| Vercel HTTPS 前端适合演示登录、页面流转、媒体权限和轻量 API。 | The Vercel HTTPS frontend is suitable for login, page flow, media permission, and lightweight API demos. |
| 腾讯云直连后端适合验证 API、健康检查和文件上传稳定性。 | The direct Tencent Cloud backend is suitable for API, health check, and file upload verification. |
| 大文件上传不应依赖 Vercel rewrite 链路，正式方案应走对象存储直传。 | Large file upload should not rely on the Vercel rewrite route. The long-term solution is direct object-storage upload. |

## 目录结构 / Directory Map

| 路径 / Path | 中文 | English |
| --- | --- | --- |
| `.agent/` | AI 协作规则、技能和工作流 | AI collaboration rules, skills, and workflows |
| `backend/` | Express API、数据仓库、文件存储和服务提供方 | Express API, repositories, file storage, and providers |
| `src/` | 当前 React 前端源码 | Current React frontend source |
| `public/` | 前端公共资源 | Public frontend assets |
| `tests/` | E2E、回归、验收和样本资产 | E2E, regression, acceptance, and sample assets |
| `scripts/` | 部署、种子数据、健康检查和演示脚本 | Deployment, seed, health check, and demo scripts |
| `docker/` | Docker Compose、Caddy/Nginx 部署配置 | Docker Compose, Caddy/Nginx deployment config |
| `docs/` | 长期技术文档、测试和部署说明 | Durable technical docs, testing, and deployment notes |
| `prds/` | 已批准 PRD 和 sprint 控制文档 | Approved PRDs and sprint control docs |
| `drafts/` | 未批准草稿和交付材料 | Unapproved drafts and delivery materials |
| `prompts/` | 可交给其他 agent 的任务提示词 | Delegation prompts for other agents |

## 事实来源 / Source Of Truth

| 文档 / Document | 中文用途 | English Purpose |
| --- | --- | --- |
| [PRD index](./prds/prd.md) | PRD 导航入口 | PRD navigation entry |
| [PRD maintenance guide](./prds/README.md) | PRD 维护规则 | PRD maintenance rules |
| [Sprint PRDs](./prds/sprints/) | sprint 执行计划 | Sprint execution plans |
| [Project brief](./context/project-brief.md) | 新协作者快速上下文 | Quick context for new contributors |
| [Agent guide](./Agent.md) | AI 工作规则和目录约定 | AI workflow rules and folder conventions |

## MVP 边界 / MVP Boundary

| 范围内 / In Scope | 范围外 / Out Of Scope |
| --- | --- |
| PPT/PDF 课件上传和课程页生成 / PPT/PDF upload and course page generation | 在线 PPT 编辑 / Online PPT editing |
| Excel 作业导入 / Excel homework import | 多租户 SaaS / Multi-tenant SaaS |
| 中文 TTS / Chinese TTS | 国际支付 / International payment |
| 学生录音、回放和管理 / Student recording, playback, and management | AI 发音评分 / AI pronunciation scoring |
| 教师直播课堂、PDF 同步和媒体演示 / Teacher live classroom, PDF sync, and media demo | 社交弹幕产品化 / Productized social comments |
| 中俄哈多语言 UI / Chinese, Russian, and Kazakh UI | 完整 LMS 平台 / Full LMS platform |

## 演示数据 / Demo Data

| 中文 | English |
| --- | --- |
| 拼音三课演示数据位于 `tests/samples/generated/pinyin-demo/`。 | Pinyin three-lesson demo data lives in `tests/samples/generated/pinyin-demo/`. |
| 可用脚本生成并注入演示课程、三页 PDF 和 Excel 作业。 | Use the script to generate and seed demo courses, three-page PDFs, and Excel homework. |

```bash
node scripts/demo/seed-pinyin-demo-data.mjs --generate-only
node scripts/demo/seed-pinyin-demo-data.mjs --base-url=https://lingobridge-lake.vercel.app
```

## 测试 / Testing

| 中文 | English |
| --- | --- |
| 后端 API 回归测试 | Backend API regression tests |
| `npm run backend:test` | `npm run backend:test` |
| 生产直播同步 smoke 脚本 | Production live-sync smoke script |
| `node tests/regression/prod-live-sync-smoke.mjs` | `node tests/regression/prod-live-sync-smoke.mjs` |
| Playwright E2E | Playwright E2E |
| `npm run e2e` | `npm run e2e` |

## 安全 / Security

| 中文 | English |
| --- | --- |
| 不要提交真实密钥、令牌、`.env` 文件或私有上传文件。 | Never commit real secrets, tokens, `.env` files, or private uploads. |
| `.env*` 默认忽略，只有 `.env.example` 可提交。 | `.env*` is ignored by default. Only `.env.example` may be committed. |
| Obsidian 或本地笔记里的密钥只能转写为脱敏说明。 | Secrets from Obsidian or local notes may only be copied as sanitized summaries. |
