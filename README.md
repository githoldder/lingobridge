# LingoBridge

LingoBridge is a Chinese learning MVP for Kazakhstani international students. The approved MVP scope is intentionally narrow: teachers upload PPT/PDF courseware, students follow the generated course pages, use Chinese TTS, record pronunciation, and manage their own recordings.

The current codebase is still a Vite/React prototype at the repository root. This light refactor adds project-management, AI-collaboration, testing, deployment, and future backend folders without moving the existing frontend code yet.

## Source Of Truth

| Document | Purpose |
|---|---|
| [PRD control plan](./prds/prd.md) | Human-readable MVP execution plan based on the approved PRD v2.0 |
| [PRD task package](./prds/prd.json) | Machine-readable task package for AI delegation and audit |
| [Project brief](./context/project-brief.md) | Short context for new contributors and AI workers |
| [Agent guide](./Agent.md) | AI workflow, rules, and folder conventions |

## Current App

```bash
npm install
npm run dev
npm run build
npm run lint
```

Current frontend entry points remain at the repository root:

- `src/`
- `public/`
- `index.html`
- `package.json`
- `vite.config.ts`

Do not move these into `frontend/` until Vercel/build configuration is updated deliberately.

## Directory Map

```text
LingoBridge/
├─ .agent/                    # AI rules, workflows, project-specific collaboration notes
├─ analysis/                  # Business and scope analysis drafts
├─ context/                   # High-signal project context for humans and AI
├─ docs/                      # Reference docs, architecture notes, testing/deployment docs
├─ drafts/                    # Unapproved drafts and archive
├─ prds/                      # Approved PRD/control outputs
├─ prompts/                   # Delegation prompts for backend/frontend/deployment/audit workers
├─ templates/                 # Reusable report and task templates
├─ backend/                   # Reserved for MVP backend implementation
├─ tests/                     # E2E, fixtures, and acceptance artifacts
├─ docker/                    # Nginx and compose deployment assets
├─ scripts/                   # Deploy, seed, and health-check automation
├─ src/                       # Current frontend source, not moved in this light refactor
└─ public/                    # Current frontend public assets
```

## MVP Boundary

In scope:

- PPT/PDF upload and generated course pages.
- Excel practice/homework import linked to course/page.
- Chinese TTS.
- Student recording capture, upload, playback, download, delete.
- Teacher screen/camera recording and replay.
- Teacher live local-screen mode and PDF/canvas mode.
- Chinese/Russian/Kazakh UI switching.
- Tencent Cloud public test deployment.

Out of scope for MVP:

- Online PPT editing.
- Real-time bilingual subtitles.
- Bullet comments/social features.
- Multi-tenant SaaS.
- International payment.
- AI pronunciation scoring.

## Security

Never commit real secrets. Local Obsidian server notes may contain plaintext keys and tokens; only sanitized summaries may be copied into this repository. `.env*` is ignored except `.env.example`.

