import { fail, redirect } from '@sveltejs/kit';
import { AuthService } from '$lib/db.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to home
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
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

		// Check if user exists
		const user = await AuthService.getUserByEmail(email);
		if (!user) {
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
		const validPassword = await AuthService.verifyPassword(password, user.password_hash!);
		if (!validPassword) {
			return fail(400, { 
				error: 'Invalid email or password',
				email 
			});
		}

		// Create session
		const sessionId = await AuthService.createSession(user.id!);
		
		// Update last login
		await AuthService.updateLastLogin(user.id!);

		// Set cookie
		cookies.set('session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(303, '/');
	}
};
