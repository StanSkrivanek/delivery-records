import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is admin
	if (!locals.user || (locals.user.role !== 'super_admin' && locals.user.role !== 'org_admin')) {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	return {
		user: locals.user
	};
};
