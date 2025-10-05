import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const body = {
		status: 'ok',
		now: Date.now()
	};
	return new Response(JSON.stringify(body), {
		headers: {
			'content-type': 'application/json',
			'cache-control': 'no-store'
		}
	});
};
