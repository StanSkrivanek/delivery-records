import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pgPool } from '$lib/db';
import { createBetterAuth, resetPasswordWithToken, validatePasswordResetToken } from '$lib/auth';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;
	if (!token) return { invalid: true };
	const rec = await validatePasswordResetToken(pgPool, token);
	return { invalid: !rec };
};

export const actions: Actions = {
	default: async ({ request, params, getClientAddress, cookies }) => {
		const token = params.token;
		const data = await request.formData();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!password || password.length < 12) {
			return fail(400, { error: 'Password must be at least 12 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const res = await resetPasswordWithToken(pgPool, token!, password);
		if (!res) {
			return fail(400, { error: 'This link is invalid or has expired.' });
		}

		// Create a fresh session and set cookie
		const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });
		const ip = getClientAddress?.() ?? null;
		const userAgent = request.headers.get('user-agent') ?? undefined;
		const session = await auth.createSession(res.userId, { ip: ip ?? undefined, userAgent });

		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/dashboard');
	}
};
