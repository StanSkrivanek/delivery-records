import { RecordService } from '$lib/db.server';
import type { RequestHandler } from '@sveltejs/kit';

// UPDATE 
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


// DELETE 
export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) {
		return new Response(JSON.stringify({ error: 'Invalid record id' }), { status: 400 });
	}
	try {
		const deleted = await RecordService.deleteRecord(id);
		if (!deleted) {
			return new Response(JSON.stringify({ error: 'Record not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ success: true }));
	} catch {
		return new Response(JSON.stringify({ error: 'Failed to delete record' }), { status: 500 });
	}
};