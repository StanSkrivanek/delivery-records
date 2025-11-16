import { RecordService } from '$lib/db.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const settings = await RecordService.getSquooshSettings();
		return json(settings);
	} catch (error) {
		console.error('Error fetching Squoosh settings:', error);
		return json({ error: 'Failed to fetch settings' }, { status: 500 });
	}
};
