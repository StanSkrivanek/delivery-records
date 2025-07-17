import { RecordService } from '$lib/db.server';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		return new Response(JSON.stringify({ error: 'Invalid record id' }), { status: 400 });
	}
	const data = await request.json();
	// Only allow updating certain fields
	const { loaded, collected, cutters, returned, image_path } = data;
	try {
		const updated = await RecordService.updateRecord(id, {
			loaded,
			collected,
			cutters,
			returned,
			image_path
		});
		if (!updated) {
			return new Response(JSON.stringify({ error: 'Record not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ success: true }));
	} catch {
		return new Response(JSON.stringify({ error: 'Failed to update record' }), { status: 500 });
	}
};
