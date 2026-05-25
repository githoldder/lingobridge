# Open Source Contributing Guide

Thank you for your interest in contributing to LingoBridge! This guide provides the basic orientation, command reference, and safety regulations needed to develop features and submit Pull Requests smoothly.

---

## 1. Project Navigation & Structure

LingoBridge divides ownership between a Vite React frontend and an Express Node.js backend. 

Refer to [.agent/rules/project-map.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/project-map.md) for full folder maps:
* `src/`: Frontend React components, views, context states, and API clients.
* `backend/`: Express API routers, data-access repositories, database init schemas.
* `docker/`: Configurations for Caddy proxying and containerization.
* `scripts/`: Devops helpers, screenshot generators, and sandbox cleaners.
* `prds/`: Sprint requirement boards and execution plans.

---

## 2. Setting Up & Launching Locally

For a detailed local walkthrough, consult: [docs/03-testing-deployment/local-demo-runbook.md](file:///Users/caolei/Desktop/LingoBridge/docs/03-testing-deployment/local-demo-runbook.md).

### Base Commands
```bash
# 1. Install all dependencies
npm install

# 2. Check TypeScript code compilation
npm run lint

# 3. Start local backend service
npm run backend

# 4. Start frontend React app
npm run dev

# 5. Build for production distribution
npm run build
```

---

## 3. Pull Request Guidelines & Scope

1. **Adhere to MVP Scope**: We focus strictly on custom CZU learning loops. Avoid bloated architecture, SaaS billing abstractions, multi-tenant databases, or generic LMS features.
2. **Design-First Rule**: Do not submit code that shifts business logic without updating the respective Sprint PRD first (`prds/md/` and `prds/json/`).
3. **No Legacy Fallbacks**: When adding API components, use unified configurations in `src/services/apiClient.ts` rather than embedding hardcoded URLs inside components.

---

## 4. Crucial Security Regulations

> [!CAUTION]
> **Zero-Secrets Policy**:
> * **Never commit private API keys, client secrets, or cloud provider tokens** to the Git repository.
> * Always keep environment configurations local inside a `.env` file (which is ignored by Git).
> * **Never commit real user recordings, large PPTX files, or real student profile databases** under `backend/storage/` or `tests/`.

---

## 5. Developer Orientation
* Always read and conform to [Agent.md](file:///Users/caolei/Desktop/LingoBridge/Agent.md) in the repository root.
* Check active boundaries in [.agent/rules/deployment-boundaries.md](file:///Users/caolei/Desktop/LingoBridge/.agent/rules/deployment-boundaries.md) before writing deploy pipelines.
