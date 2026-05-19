/**
 * S4-T03: Postgres connection layer
 *
 * - Reads DATABASE_URL from environment
 * - Provides connection pool, query helper, transaction helper
 * - Graceful fallback when DATABASE_URL is not set (JSON mode)
 * - Health check support
 */

import pg from 'pg';
const { Pool } = pg;

export type { QueryResult, QueryResultRow } from 'pg';

export type DbMode = 'postgres' | 'json';

let pool: pg.Pool | null = null;
let _mode: DbMode = 'json';
let _connected = false;

/**
 * Detect and return the current database mode.
 * - If DATABASE_URL is set and DB_MODE is not 'json', use Postgres.
 * - Otherwise, fall back to JSON file storage.
 */
export function getDbMode(): DbMode {
  const dbMode = (process.env.DB_MODE || '').toLowerCase();
  if (dbMode === 'json') return 'json';
  if (dbMode === 'postgres') return 'postgres';
  // Auto-detect: if DATABASE_URL is set, prefer Postgres
  if (process.env.DATABASE_URL) return 'postgres';
  return 'json';
}

/**
 * Initialize the Postgres connection pool.
 * Safe to call multiple times; returns existing pool if already connected.
 * Does NOT throw if DATABASE_URL is missing — just logs and returns null.
 */
export async function initPostgres(): Promise<pg.Pool | null> {
  _mode = getDbMode();
  if (_mode === 'json') {
    console.log('[db] DB_MODE=json or DATABASE_URL not set — using JSON file storage');
    return null;
  }

  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL!;
  console.log(`[db] Connecting to Postgres: ${maskUrl(databaseUrl)}`);

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('[db] Unexpected Postgres pool error:', err.message);
    });

    // Verify connection
    const client = await pool.connect();
    const result = await client.query('SELECT 1 AS ok');
    client.release();

    if (result.rows[0]?.ok === 1) {
      _connected = true;
      console.log('[db] Postgres connection established');
    }

    return pool;
  } catch (err: any) {
    console.error(`[db] Failed to connect to Postgres: ${err.message}`);
    if (process.env.DB_MODE === 'postgres') {
      // Explicitly required Postgres — this is a fatal error
      throw new Error(`Postgres connection required but failed: ${err.message}`);
    }
    // Auto-detect mode — fall back to JSON
    console.warn('[db] Falling back to JSON file storage');
    pool = null;
    _mode = 'json';
    return null;
  }
}

/**
 * Get the current pool (throws if not initialized in postgres mode).
 */
export function getPool(): pg.Pool {
  if (!pool) throw new Error('Postgres pool not initialized. Call initPostgres() first.');
  return pool;
}

/**
 * Whether Postgres is currently connected.
 */
export function isPostgresConnected(): boolean {
  return _connected && pool !== null;
}

/**
 * Execute a query and return rows.
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params);
}

/**
 * Execute a query and return just the rows.
 */
export async function queryRows<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a query and return the first row, or null.
 */
export async function queryRow<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Run a function inside a transaction.
 * BEGIN -> fn -> COMMIT, or ROLLBACK on error.
 */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Health check: verify Postgres is reachable.
 */
export async function healthCheck(): Promise<{
  mode: DbMode;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  available?: boolean;
}> {
  if (_mode === 'json') {
    return { mode: 'json', connected: true, available: true };
  }

  if (!pool) {
    return { mode: 'postgres', connected: false, error: 'Pool not initialized' };
  }

  try {
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { mode: 'postgres', connected: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { mode: 'postgres', connected: false, error: err.message };
  }
}

/**
 * Close the pool gracefully.
 */
export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    _connected = false;
  }
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '<invalid-url>';
  }
}
