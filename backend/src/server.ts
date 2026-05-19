import { createApp } from './app.ts';
import { initPostgres } from './db/postgres.ts';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

async function start() {
  // Initialize Postgres connection (falls back to JSON if not configured)
  await initPostgres();

  createApp().listen(port, host, () => {
    console.log(`LingoBridge MVP API listening on http://${host}:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
