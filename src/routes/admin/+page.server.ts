import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login');
  }
  if (!(locals.user.role === 'super_admin' || locals.user.role === 'org_admin')) {
    throw error(403, 'Access denied. Admin privileges required.');
  }
  return { user: locals.user };
};
