import { RecordService } from '$lib/db.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const drivers = await RecordService.getAllDrivers();
		return json(drivers);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		return json({ error: 'Failed to fetch drivers' }, { status: 500 });
	}
};
