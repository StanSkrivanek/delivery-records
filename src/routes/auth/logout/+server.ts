import { redirect } from '@sveltejs/kit';
import { AuthService } from '$lib/db.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const sessionId = cookies.get('session_id');
	
	if (sessionId) {
		await AuthService.deleteSession(sessionId);
	}
	
	cookies.delete('session_id', { path: '/' });
	
	throw redirect(303, '/auth/login');
};
