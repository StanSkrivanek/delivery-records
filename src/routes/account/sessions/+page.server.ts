import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';
import bcrypt from 'bcrypt';

const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/auth/login');
	const sessions = await auth.listSessions(locals.user.id!);
	return { sessions };
};

export const actions: Actions = {
	revoke: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/auth/login');
		const data = await request.formData();
		const sid = (data.get('session_id') as string) || '';
		if (!sid) return fail(400, { error: 'Missing session_id' });
		await auth.revokeSession(locals.user.id!, sid);
		return { ok: true };
	},
	revokeAll: async ({ locals }) => {
		if (!locals.user) throw redirect(303, '/auth/login');
		await auth.revokeAllSessions(locals.user.id!);
		return { ok: true };
	}
};
