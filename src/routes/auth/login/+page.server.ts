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
	login: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		// Validate inputs
		if (!email || !password) {
			return fail(400, { 
				error: 'Email and password are required',
				email 
			});
		}

		// Throttle: block after 5 failed attempts in the last 15 minutes per email or IP
		const ip = getClientAddress();
		const { rows: attemptRows } = await pgPool.query(
		  `select count(*)::int as cnt from public.auth_attempts
		   where (email = $1 or ip = $2)
		     and success = false
		     and attempted_at > now() - interval '15 minutes'`,
		  [email, ip]
		);
		if ((attemptRows?.[0]?.cnt ?? 0) >= 5) {
			return fail(429, { error: 'Too many attempts. Try again later.', email });
		}

		// Check if user exists
		const user = await auth.getUserByEmail(email);
		if (!user) {
			await pgPool.query(
			  `insert into public.auth_attempts (email, ip, success) values ($1, $2, false)`,
			  [email, ip]
			);
			return fail(400, { 
				error: 'Invalid email or password',
				email 
			});
		}

		// Check if user is active
		if (!user.is_active) {
			return fail(400, { 
				error: 'Your account has been deactivated. Please contact your administrator.',
				email 
			});
		}

		// Verify password
		const validPassword = await bcrypt.compare(password, user.password_hash!);
		if (!validPassword) {
			await pgPool.query(
			  `insert into public.auth_attempts (email, ip, success) values ($1, $2, false)`,
			  [email, ip]
			);
			return fail(400, { 
				error: 'Invalid email or password',
				email 
			});
		}

		// Log successful auth attempt
		await pgPool.query(
		  `insert into public.auth_attempts (email, ip, success) values ($1, $2, true)`,
		  [email, ip]
		);

		// Create session with context
		const ua = request.headers.get('user-agent') || undefined;
		const { id: sessionId } = await auth.createSession(user.id!, { ip, userAgent: ua });
		
		// Update last login
		await auth.touchLastLogin(user.id!);

		// Set cookie
		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(303, '/dashboard');
	}
};
