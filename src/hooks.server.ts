import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';

// Initialize Postgres-backed auth (no ORM)
const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

// Public routes that don't require authentication
const publicRoutes = ['/', '/health', '/auth/login', '/auth/register', '/auth/forgot', '/auth/reset', '/blog', '/contact'];

const authHandle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const session = await auth.getSession(sessionId);
		
		if (session) {
			const user = await auth.getUserById(session.user_id);
			if (user && user.is_active) {
				// Sliding session: refresh expiry and last_seen, refresh cookie
				await auth.updateSessionActivity(sessionId);
				event.locals.user = user;
				event.locals.session = { id: sessionId, ...session };
				// refresh cookie TTL
				event.cookies.set('session_id', sessionId, {
					path: '/', httpOnly: true, sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30
				});
			} else {
				// Invalid session, clear cookie
				event.cookies.delete('session_id', { path: '/' });
			}
		} else {
			// Expired session, clear cookie
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	// Check if route requires authentication
	const isPublicRoute = publicRoutes.some((route) => event.url.pathname.startsWith(route));
	
	if (!isPublicRoute && !event.locals.user) {
		// Redirect to login if not authenticated
		throw redirect(303, '/auth/login');
	}

	// If logged in and trying to access login page, redirect to home
if (event.locals.user && event.url.pathname === '/auth/login') {
		throw redirect(303, '/dashboard');
	}

	const response = await resolve(event);
	return response;
};

// Clean expired sessions periodically
const cleanupHandle: Handle = async ({ event, resolve }) => {
	// Run cleanup once every 100 requests (adjust as needed)
	if (Math.random() < 0.01) {
		auth.cleanExpiredSessions().catch(console.error);
	}
	return resolve(event);
};

export const handle = sequence(cleanupHandle, authHandle);
