import { RecordService } from '$lib/db.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const vehicles = await RecordService.getAllVehicles();
		return json(vehicles);
	} catch (error) {
		console.error('Error fetching vehicles:', error);
		return json({ error: 'Failed to fetch vehicles' }, { status: 500 });
	}
};
