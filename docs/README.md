# Fleet Delivery Records – Supabase Documentation

This folder contains implementation docs for our Supabase stack: architecture, connection pooling, authentication, security with Row-Level Security (RLS), and local setup.

- Supabase Overview and Architecture: [supabase-overview.md](./supabase-overview.md)
- Connection Pooling (Pool): [connection-pooling.md](./connection-pooling.md)
- Auth (features, flows, and data protection): [auth.md](./auth.md)
- Better Auth integration: [better-auth.md](./better-auth.md)
- Security and RLS Policies: [security-and-policies.md](./security-and-policies.md)
- Local Setup (pnpm, CLI, env): [local-setup.md](./local-setup.md)

Notes
- Accessibility will be handled later, per project plan.
- Replace any placeholders like {{ENV_VAR_NAME}} before running commands.
- This app currently uses a Postgres-native Better Auth layer; the Supabase Auth guide is provided for teams that choose to migrate to Supabase-managed Auth.
