import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pgPool } from '$lib/db';
import { issuePasswordResetToken } from '$lib/auth';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(303, '/dashboard');
  return {};
};

export const actions: Actions = {
  default: async ({ request, getClientAddress, url }) => {
    const data = await request.formData();
    const email = ((data.get('email') as string) || '').trim().toLowerCase();
    if (!email) return fail(400, { error: 'Email required' });

    const { rows } = await pgPool.query('select id from public.users where lower(email) = lower($1) limit 1', [email]);

    // Always return the same message regardless of user existence
    const generic = { message: 'If the email exists, a reset link has been sent.' } as const;

    if (!rows.length) {
      return generic;
    }

    const userId = rows[0].id as number;
    try {
      const ip = getClientAddress?.() ?? null;
      const userAgent = request.headers.get('user-agent');
      const token = await issuePasswordResetToken(pgPool, userId, { ttlMinutes: 60, ip, userAgent });
      const resetUrl = `${url.origin}/auth/reset/${token}`;
      console.log('Password reset link:', resetUrl);
    } catch (e) {
      // Intentionally swallow errors to avoid user enumeration
    }

    return generic;
  }
};
