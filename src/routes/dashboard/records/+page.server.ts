// src/routes/dashboard/records/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Placeholder - will be implemented in Phase 3
	return {
		user: locals.user
	};
};
