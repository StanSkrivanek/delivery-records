// Placeholder Better Auth configuration using Postgres (no ORM)
// NOTE: This scaffolding avoids app breakage until hooks are updated.
//       Fill in secrets via .env.local and wire into hooks.server.ts when ready.

import type { Pool } from 'pg';
import crypto from 'node:crypto';

export interface BetterAuthConfig {
  cookieName?: string;
  sessionMaxAgeDays?: number;
}

export function createBetterAuth(pgPool: Pool, config: BetterAuthConfig = {}) {
  const cookieName = config.cookieName ?? 'ba_session';
  const sessionMaxAgeDays = config.sessionMaxAgeDays ?? 30;

  return {
    // Create a new user with hashed password
    async registerUser(params: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      organizationId?: number;
      role?: 'super_admin' | 'org_admin' | 'depot_manager' | 'driver' | 'viewer';
    }) {
      const { email, passwordHash, firstName, lastName, organizationId, role = 'driver' } = params;
      const q = `insert into public.users (email, password_hash, first_name, last_name, organization_id, role, is_active)
                 values ($1,$2,$3,$4,$5,$6,true)
                 returning id`;
      const { rows } = await pgPool.query(q, [email, passwordHash, firstName, lastName, organizationId ?? null, role]);
      return rows[0]?.id as number;
    },

    // Validate credentials (expects caller to compare bcrypt hashes)
    async getUserByEmail(email: string) {
      const { rows } = await pgPool.query('select * from public.users where email = $1 limit 1', [email]);
      return rows[0] ?? null;
    },

    async getUserById(id: number) {
      const { rows } = await pgPool.query('select * from public.users where id = $1 limit 1', [id]);
      return rows[0] ?? null;
    },

    // Sessions
    async createSession(userId: number) {
      const sessionId = crypto.randomUUID();
      await pgPool.query(
        "insert into public.sessions (id, user_id, expires_at) values ($1, $2, now() + ($3 || ' days')::interval)",
        [sessionId, userId, sessionMaxAgeDays]
      );
      return { id: sessionId, cookieName };
    },

    async getSession(sessionId: string) {
      const { rows } = await pgPool.query(
        'select id, user_id, expires_at from public.sessions where id = $1 and expires_at > now() limit 1',
        [sessionId]
      );
      return rows[0] ?? null;
    },

    async deleteSession(sessionId: string) {
      await pgPool.query('delete from public.sessions where id = $1', [sessionId]);
    },

    async cleanExpiredSessions() {
      await pgPool.query('delete from public.sessions where expires_at < now()');
    },

    async touchLastLogin(userId: number) {
      await pgPool.query('update public.users set last_login_at = now() where id = $1', [userId]);
    }
  };
}
