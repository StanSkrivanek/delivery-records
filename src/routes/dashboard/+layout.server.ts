import type { LayoutServerLoad } from './$types';
import { requireUser } from '$lib/server/authz';

export const load: LayoutServerLoad = async ({ locals }) => {
  requireUser(locals.user);
  return { user: locals.user };
};
