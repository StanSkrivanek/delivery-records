import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';

// Initialize Postgres-backed auth (no ORM)
const auth = createBetterAuth(pgPool, { cookieName: 'session_id', sessionMaxAgeDays: 30 });

// Public routes that don't require authentication
// Use exact matches for root-like paths and prefix matches for sections
const publicExact = ['/', '/health'];
const publicPrefixes = ['/auth/', '/blog', '/contact'];

const authHandle: Handle = async ({ event, resolve }) => {
// Public route fast-path: if no session cookie and public, skip any DB work
	const pathname = event.url.pathname;
	const isPublicRoute = publicExact.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p));
	const sessionId = event.cookies.get('session_id');
	if (isPublicRoute && !sessionId) {
		return resolve(event);
	}

	// If we have a session cookie, try to validate it
	if (sessionId) {
		try {
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
		} catch {
			// Fail open for public routes if DB hiccups
			if (isPublicRoute) {
				return resolve(event);
			}
			// Otherwise, treat as unauthenticated
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	// Auth gate
	if (!isPublicRoute && !event.locals.user) {
		throw redirect(303, '/auth/login');
	}

	// Redirect logged-in users away from login page
	if (event.locals.user && event.url.pathname === '/auth/login') {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};

// Clean expired sessions periodically
const cleanupHandle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const response = await resolve(event);
	const dt = Date.now() - start;
	// Dev-only perf log for slow requests (>200ms)
	if (process.env.NODE_ENV !== 'production' && dt > 200) {
		console.log(`[perf] ${event.request.method} ${event.url.pathname} ${dt}ms`);
	}
	// Do cleanup in the background so it never blocks
	if (Math.random() < 0.01) {
		setTimeout(() => {
			auth.cleanExpiredSessions().catch(console.error);
		}, 0);
	}
	return response;
};

export const handle = sequence(cleanupHandle, authHandle);
