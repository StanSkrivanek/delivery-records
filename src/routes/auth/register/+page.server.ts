import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';
import bcrypt from 'bcrypt';

const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to home
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = ((data.get('email') as string) || '').trim().toLowerCase();
		const password = (data.get('password') as string) || '';
		const passwordConfirm = (data.get('password_confirm') as string) || '';
		const firstName = ((data.get('first_name') as string) || '').trim();
		const lastName = ((data.get('last_name') as string) || '').trim();

		if (!email || !password || !firstName || !lastName) {
			return fail(400, { error: 'All fields are required', email });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', email });
		}
		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwords do not match', email });
		}

		// Check for existing user
		const existing = await auth.getUserByEmail(email);
		if (existing) {
			return fail(400, { error: 'An account with this email already exists', email });
		}

		// Find an organization to associate with (use the first one by default)
		const orgRes = await pgPool.query(
			'select id from public.organizations order by id asc limit 1'
		);
		const organizationId = orgRes.rows?.[0]?.id ?? null;

		// Basic password complexity: at least 8 chars, letters and digits
		if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
			return fail(400, { error: 'Password must contain letters and digits', email });
		}
		// Hash password and create user as a driver by default
		const passwordHash = await bcrypt.hash(password, 12);
		const userId = await auth.registerUser({
			email,
			passwordHash,
			firstName,
			lastName,
			organizationId,
			role: 'driver'
		});

		// Create a session
		const ua = request.headers.get('user-agent') || undefined;
		const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || undefined;
		const { id: sessionId } = await auth.createSession(userId, { ip, userAgent: ua });

		// Set cookie
		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/dashboard');
	}
};
