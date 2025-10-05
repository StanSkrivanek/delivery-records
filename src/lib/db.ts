import { Pool } from 'pg';

// Use DATABASE_URL from env; fallback to local Supabase default.
const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:55422/postgres';

// Singleton pool instance
export const pgPool = new Pool({
  connectionString,
  max: 10,
  // Fail fast if DB is unreachable to avoid blocking page loads
  connectionTimeoutMillis: 1000, // 1s
  idleTimeoutMillis: 30000,      // 30s
  // Abort long-running queries server-side
  statement_timeout: 2000        // 2s
});

export async function healthcheck(): Promise<boolean> {
  try {
    const res = await pgPool.query('select 1 as ok');
    return res.rows?.[0]?.ok === 1;
  } catch (e) {
    return false;
  }
}
