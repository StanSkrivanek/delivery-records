import { listBackups } from '$lib/backup.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const backups = listBackups();

	return {
		backups
	};
};
