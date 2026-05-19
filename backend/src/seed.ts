/**
 * S4-T05: Seed script — loads seed.sql into Postgres
 *
 * Usage: npx tsx backend/src/seed.ts
 * Or:   npm run db:seed
 *
 * Requires DATABASE_URL to be set.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[seed] DATABASE_URL not set. Cannot seed Postgres.');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    console.log('[seed] Connecting to Postgres...');
    const client = await pool.connect();
    console.log('[seed] Connected. Running seed.sql...');

    const seedPath = path.resolve(import.meta.dirname, '../db/seed.sql');
    const sql = await readFile(seedPath, 'utf8');
    await client.query(sql);

    client.release();
    console.log('[seed] ✅ Seed completed successfully.');
  } catch (err: any) {
    console.error(`[seed] ❌ Seed failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
