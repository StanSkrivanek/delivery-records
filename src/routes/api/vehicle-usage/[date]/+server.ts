import { RecordService } from '$lib/db.server';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const date = params.date;
		if (!date) {
			throw error(400, 'Date parameter is required');
		}

		const vehicleUsage = await RecordService.getVehicleUsageLogByDate(date);

		if (!vehicleUsage) {
			return json(null);
		}

		return json(vehicleUsage);
	} catch (err) {
		console.error('Get vehicle usage error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to get vehicle usage data');
	}
};
