# Connection Pooling (Pool)

This document explains the "Pool" concept, its purpose, when to use it, and examples.

## What is a Pool?
A connection pool maintains a set of ready-to-use database connections and multiplexes many short-lived client requests over a smaller number of persistent connections.

In Supabase, connection pooling is provided by PgBouncer. Supabase exposes a pooled port distinct from the direct Postgres port.

- Direct Postgres port (session-based): typically 5432
- Pooled port (transaction pooling): typically 6543

## Why Pooling is Useful
- Avoids exhausting Postgres connection limits (especially critical with serverless functions)
- Reduces connection overhead and latency from frequent connect/disconnect cycles
- Improves overall throughput for short-lived queries
- Stabilizes workloads under bursty traffic

## When to Use Pooling
- Serverless environments (Next.js API routes, Vercel/Netlify functions, Cloudflare Workers using compatible drivers)
- Background jobs and scripts that spawn many short tasks
- Any service that would otherwise open many concurrent connections

Use the direct 5432 port when:
- You need session-level features (CTEs spanning multiple statements, temp tables, LISTEN/NOTIFY, or long transactions)
- ORMs/drivers require session semantics and cannot operate with transaction pooling

## Important Considerations (PgBouncer transaction mode)
- Prepared statements: disable them when using pooling, or use an ORM/driver config that avoids them.
  - Prisma: add `?pgbouncer=true&connection_limit=1&pool_timeout=0` or use `pgbouncer`+`statement_cache_mode=describe` depending on version.
  - node-postgres: set `statement_timeout` as needed and avoid session-bound features.
- Advisory locks and temp tables don’t work as expected in transaction pooling.

## Example: Node (node-postgres)
Use the pooled connection string (port 6543) and keep queries short.
```ts path=null start=null
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_POOLED_URL, // e.g. postgres://user:pass@host:6543/db
  // Recommended when pooling to avoid prepared statements across connections
  // connectionTimeoutMillis: 5_000,
  // idleTimeoutMillis: 10_000,
})

export async function runQuery(sql: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return res.rows
  } finally {
    client.release()
  }
}
```

## Example: Prisma
Prisma works with PgBouncer with specific settings. Use the pooled URL on port 6543 and disable prepared statements.
```env path=null start=null
DATABASE_URL="postgres://user:pass@host:6543/db?pgbouncer=true&connection_limit=1&pool_timeout=0"
PRISMA_CLIENT_ENGINE_TYPE="dataproxy" # or as recommended for your deployment
```

```ts path=null start=null
// prisma/schema.prisma (snippet)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Using supabase-js vs Direct DB
- supabase-js uses HTTP to call PostgREST/Auth/Storage; it does not need a Postgres connection and is not affected by DB pooling.
- Use direct DB connections only when needed (complex read/write, batch jobs). Otherwise, prefer RPC/functions or supabase-js.

## Local Development
- Supabase CLI provides local Postgres and PgBouncer as part of `supabase start`.
- The pooled URL is available in the generated `.env` or via dashboard. Prefer the pooled URL for local testing of serverless-like code.

## Troubleshooting
- Errors about prepared statements: ensure they’re disabled in the ORM/driver; check connection parameters.
- Unexpected transaction behavior: make sure your code does not depend on session state between statements.
- Connection spikes: verify pool configuration; set sane timeouts and reuse connections.
