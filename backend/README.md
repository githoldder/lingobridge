# LingoBridge Backend — Data Source Configuration

## Database Mode

LingoBridge supports two data storage modes, controlled by environment variables:

| Mode | When | Storage |
|------|------|---------|
| **JSON** (default) | No `DATABASE_URL` set | `backend/data/db.json` file |
| **Postgres** | `DATABASE_URL` is set | PostgreSQL via connection pool |

### Environment Variables

- `DATABASE_URL` — Postgres connection string (e.g. `postgres://lingobridge:lingobridge_dev@localhost:5432/lingobridge`)
- `DB_MODE` — Explicit override: `json` or `postgres`. If not set, auto-detects from `DATABASE_URL`.

### Switching Rules

1. **No mixing**: A single process uses exactly ONE data source. JSON and Postgres are never used simultaneously for the same request.
2. **Auto-detect**: If `DATABASE_URL` is set and `DB_MODE` is not `json`, Postgres is used. Otherwise, JSON.
3. **Graceful fallback**: In auto-detect mode, if Postgres connection fails, the server falls back to JSON. If `DB_MODE=postgres` is set explicitly, connection failure is fatal.
4. **Health check**: `GET /api/v1/health` returns `{ db: { mode, connected, latencyMs } }` to verify which source is active.

### Quick Start

```bash
# JSON mode (no database needed)
npm run backend:dev

# Postgres mode (with Docker)
docker compose -f docker/docker-compose.yml up -d postgres
DATABASE_URL=postgres://lingobridge:lingobridge_dev@localhost:5432/lingobridge npm run backend:dev

# Seed Postgres with demo data
DATABASE_URL=postgres://lingobridge:lingobridge_dev@localhost:5432/lingobridge npm run db:seed
```

### Architecture

- **Repositories** (`backend/src/repositories/`): All data access goes through repository modules that support both JSON and Postgres modes.
- **Connection layer** (`backend/src/db/postgres.ts`): Manages the Postgres pool, query helpers, transactions, and health checks.
- **JSON fallback** (`backend/src/db.ts`): Original file-based storage, used when Postgres is not available.

### Current Status (Sprint 4)

- ✅ Postgres connection layer with pool, query, transaction helpers
- ✅ Repository abstraction with dual-mode support (JSON + Postgres)
- ✅ Seed script for Postgres demo data
- ✅ Health endpoint shows DB mode and connection status
- ⏳ API handlers still use direct `readDb()/writeDb()` calls — migration to repository calls happens in S4-T07~T11
- ⏳ Password hashing: JSON mode uses plaintext, Postgres mode uses plaintext (bcrypt planned for later sprint)
