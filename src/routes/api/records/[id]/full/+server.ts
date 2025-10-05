import { RecordService } from '$lib/records.pg';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/authz';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		// Require authentication
		requireUser(locals.user);
		const recordId = parseInt(params.id);
		if (isNaN(recordId)) {
			throw error(400, 'Invalid record ID');
		}

		const record = await RecordService.getRecordWithVehicleUsageById(recordId);

		if (!record) {
			throw error(404, 'Record not found');
		}

		return json(record);
	} catch (err: any) {
		if (err?.code === 401) return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
		if (err?.code === 403) return json({ error: 'FORBIDDEN' }, { status: 403 });
		console.error('Get record with vehicle usage error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to get record data');
	}
};
