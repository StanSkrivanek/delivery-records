// Placeholder Better Auth configuration using Postgres (no ORM)
// NOTE: This scaffolding avoids app breakage until hooks are updated.
//       Fill in secrets via .env.local and wire into hooks.server.ts when ready.

import type { Pool } from 'pg';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export interface BetterAuthConfig {
  cookieName?: string;
  sessionMaxAgeDays?: number;
}

export function createBetterAuth(pgPool: Pool, config: BetterAuthConfig = {}) {
  const cookieName = config.cookieName ?? 'ba_session';
  const sessionMaxAgeDays = config.sessionMaxAgeDays ?? 30;

  const ttlInterval = `${sessionMaxAgeDays} days`;

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
    async createSession(userId: number, ctx?: { ip?: string; userAgent?: string }) {
      const sessionId = crypto.randomUUID();
      await pgPool.query(
        `insert into public.sessions (id, user_id, expires_at, ip, user_agent, last_seen)
         values ($1, $2, now() + ($3 || ' days')::interval, $4, $5, now())`,
        [sessionId, userId, sessionMaxAgeDays, ctx?.ip ?? null, ctx?.userAgent ?? null]
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

    async updateSessionActivity(sessionId: string) {
      await pgPool.query(
        `update public.sessions
         set last_seen = now(), expires_at = now() + ($1 || ' days')::interval
         where id = $2`,
        [sessionMaxAgeDays, sessionId]
      );
    },

    async listSessions(userId: number) {
      const { rows } = await pgPool.query(
        `select id, created_at, last_seen, expires_at, ip, user_agent
         from public.sessions where user_id = $1
         order by coalesce(last_seen, created_at) desc`,
        [userId]
      );
      return rows;
    },

    async revokeSession(userId: number, sessionId: string) {
      await pgPool.query(`delete from public.sessions where id = $1 and user_id = $2`, [sessionId, userId]);
    },

    async revokeAllSessions(userId: number) {
      await pgPool.query(`delete from public.sessions where user_id = $1`, [userId]);
    },

    async touchLastLogin(userId: number) {
      await pgPool.query('update public.users set last_login_at = now() where id = $1', [userId]);
    }
  };
}

// Issue a password reset token (hash-only). Returns the raw token for emailing.
export async function issuePasswordResetToken(
  pgPool: Pool,
  userId: number,
  opts: { ttlMinutes?: number; ip?: string | null; userAgent?: string | null } = {}
): Promise<string> {
  const ttl = opts.ttlMinutes ?? 60;
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest(); // Buffer

  // Remove any existing unused tokens for this user
  await pgPool.query(
    `delete from public.password_reset_tokens
     where user_id = $1 and used_at is null and expires_at > now()`,
    [userId]
  );

  await pgPool.query(
    `insert into public.password_reset_tokens (user_id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, now() + ($3 || ' minutes')::interval, $4, $5)`,
    [userId, tokenHash, String(ttl), opts.ip ?? null, opts.userAgent ?? null]
  );

  return rawToken;
}

// Validate a password reset token and return the (token id, user id) if valid; otherwise null.
export async function validatePasswordResetToken(
  pgPool: Pool,
  rawToken: string
): Promise<{ token_id: number; user_id: number } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest();
  const { rows } = await pgPool.query(
    `select id as token_id, user_id
     from public.password_reset_tokens
     where token_hash = $1 and used_at is null and expires_at > now()
     limit 1`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

// Reset a user's password using a valid token, revoke all sessions, and mark token used.
export async function resetPasswordWithToken(
  pgPool: Pool,
  rawToken: string,
  newPassword: string
): Promise<{ userId: number } | null> {
  const rec = await validatePasswordResetToken(pgPool, rawToken);
  if (!rec) return null;

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pgPool.query('BEGIN');
  try {
    await pgPool.query('update public.users set password_hash = $1 where id = $2', [passwordHash, rec.user_id]);
    await pgPool.query('update public.password_reset_tokens set used_at = now() where id = $1', [rec.token_id]);
    await pgPool.query('delete from public.sessions where user_id = $1', [rec.user_id]);
    await pgPool.query('COMMIT');
  } catch (e) {
    await pgPool.query('ROLLBACK');
    throw e;
  }

  return { userId: rec.user_id };
}
