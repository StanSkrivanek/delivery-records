import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? {
			id: locals.user.id,
			email: locals.user.email,
			first_name: locals.user.first_name,
			last_name: locals.user.last_name,
			role: locals.user.role,
			organization_id: locals.user.organization_id
		} : null
	};
};
