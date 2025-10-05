import type { LayoutServerLoad } from './$types';
import { requireRole } from '$lib/server/authz';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Allow only super_admin and org_admin to access /admin
  requireRole(locals.user, ['super_admin', 'org_admin']);
  return { user: locals.user };
};
