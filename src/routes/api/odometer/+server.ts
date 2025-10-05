// src/routes/api/odometer/+server.ts
import { json } from '@sveltejs/kit';
import { RecordService } from '$lib/records.pg';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
	const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

	try {
		const [odometerReadings, stats] = await Promise.all([
			RecordService.getOdometerDifferencesByMonth(year, month),
			RecordService.getOdometerStatsByMonth(year, month)
		]);

		return json({
			odometerReadings,
			stats,
			selectedYear: year,
			selectedMonth: month
		});
	} catch (error) {
		console.error('Error loading odometer data:', error);
		return json(
			{
				error: 'Failed to load odometer data',
				odometerReadings: [],
				stats: {
					totalDistance: 0,
					averageDaily: 0,
					maxDaily: 0,
					minDaily: 0,
					daysWithReadings: 0,
					startOdometer: 0,
					endOdometer: 0
				}
			},
			{ status: 500 }
		);
	}
};
