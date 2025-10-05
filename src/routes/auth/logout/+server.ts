import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pgPool } from '$lib/db';
import { createBetterAuth } from '$lib/auth';

const auth = createBetterAuth(pgPool, { cookieName: 'session_id' });

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('session_id');
	if (sessionId) await auth.deleteSession(sessionId);
	cookies.delete('session_id', { path: '/' });
	throw redirect(303, '/');
};

// GET intentionally not supported to avoid CSRF via links/images.
// Use POST from a same-origin form for logout.
