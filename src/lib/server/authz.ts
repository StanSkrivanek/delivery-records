import type { User } from '$lib/types';

export type Role = User['role'];

const roleRank: Record<Role, number> = {
	super_admin: 5,
	org_admin: 4,
	depot_manager: 3,
	driver: 2,
	viewer: 1
};

export function hasRole(user: User | undefined, required: Role | Role[]): boolean {
	if (!user) return false;
	if (Array.isArray(required)) return required.includes(user.role);
	return user.role === required;
}

export function roleAtLeast(user: User | undefined, min: Role): boolean {
	if (!user) return false;
	return roleRank[user.role] >= roleRank[min];
}

export function requireUser(user: User | undefined): User {
	if (!user) {
		const err = new Error('UNAUTHENTICATED');
		(err as any).code = 401;
		throw err;
	}
	return user;
}

export function requireRole(user: User | undefined, required: Role | Role[]): User {
	const u = requireUser(user);
	if (!hasRole(u, required)) {
		const err = new Error('FORBIDDEN');
		(err as any).code = 403;
		throw err;
	}
	return u;
}

export function requireSameOrg(user: User | undefined, orgId: number | null | undefined): User {
	const u = requireUser(user);
	if (u.role === 'super_admin') return u;
	if (!u.organization_id || !orgId || u.organization_id !== orgId) {
		const err = new Error('FORBIDDEN');
		(err as any).code = 403;
		throw err;
	}
	return u;
}
