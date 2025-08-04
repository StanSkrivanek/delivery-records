// src/routes/odometer/+page.server.ts
import { RecordService } from '$lib/db.server'; // Your server-side database service
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
	const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

	try {
		const [odometerReadings, stats] = await Promise.all([
			RecordService.getOdometerDifferencesByMonth(year, month),
			RecordService.getOdometerStatsByMonth(year, month)
		]);

		return {
			odometerReadings,
			stats,
			selectedYear: year,
			selectedMonth: month
		};
	} catch (error) {
		console.error('Error loading odometer data:', error);
		return {
			odometerReadings: [],
			stats: {
				totalDistance: 0,
				averageDaily: 0,
				maxDaily: 0,
				minDaily: 0,
				daysWithReadings: 0,
				startOdometer: 0,
				endOdometer: 0
			},
			selectedYear: year,
			selectedMonth: month,
			error: 'Failed to load odometer data'
		};
	}
};
