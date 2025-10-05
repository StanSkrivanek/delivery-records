# Local Setup (pnpm, Supabase CLI, Env)

This guide explains how to run Supabase locally and integrate it with the app, using pnpm as requested.

## Prerequisites
- pnpm
- Node LTS
- Supabase CLI: `brew install supabase/tap/supabase`

## Start Supabase Locally
```sh path=null start=null
supabase init              # once per repo
supabase start             # starts local Postgres, APIs, Auth, Storage, Realtime, Pooler
```

The CLI writes local connection info and keys into `./supabase/.env` and `./.env` (if you choose). Never commit real secrets.

## Install Dependencies
```sh path=null start=null
pnpm add @supabase/supabase-js
# Optional library you mentioned
pnpm add better-auth
```

## Environment Variables
Create `.env.local` for the app (do not commit it):
```env path=null start=null
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY={{LOCAL_ANON_KEY}}
SUPABASE_SERVICE_ROLE_KEY={{LOCAL_SERVICE_ROLE_KEY}}  # server-only

# Direct DB URLs (optional, for scripts/ORMs)
SUPABASE_DB_DIRECT_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_DB_POOLED_URL=postgres://postgres:postgres@127.0.0.1:6543/postgres
```

## Example Scripts
Add to your package.json:
```json path=null start=null
{
  "scripts": {
    "dev:db:start": "supabase start",
    "dev:db:stop": "supabase stop",
    "db:migrate": "supabase migration up",
    "db:generate": "supabase gen types typescript --local > src/types/database.types.ts"
  }
}
```

## Verifying Auth Locally
```ts path=null start=null
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
const { data, error } = await supabase.from('profiles').select('*')
```

## Using the Pool Locally
- Prefer `SUPABASE_DB_POOLED_URL` (port 6543) for serverless-like code paths
- Disable prepared statements in your ORM/driver when using pooling

## Migrations and Seeding
- Use `supabase migration new` to create migrations
- Commit SQL files; they run in CI and environments consistently

## Troubleshooting
- `supabase status` to inspect local services
- Check Docker status if services fail to start
- Read logs: `supabase logs api --follow`
