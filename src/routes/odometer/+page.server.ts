// src/routes/odometer/+page.server.ts
import { RecordService as rs } from '$lib/db.server'; // Your server-side database service
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get current date for defaults
	const now = new Date();
	const records = await rs.getAllRecords();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;


	const odoByMonth = await rs.getOdometerDifferencesByMonth(currentYear, currentMonth);
	console.log("🚀 ~ load ~ odoByMonth:", odoByMonth)
	
	
	const yearsSet = new Set<number>();
	const monthsSet = new Set<number>();

		records.forEach((record) => {
			if (record.entry_date || record.entry_date === null) {
				// Use entry_date if available, fallback to date_created for older records
				const dateString = record.entry_date || record.created_at;
				if (typeof dateString === 'string') {
					const date = new Date(dateString);
					yearsSet.add(date.getFullYear());
					monthsSet.add(date.getMonth() + 1); // getMonth() returns 0-11, so add 1
				}
			}
		});

		// Convert sets to sorted arrays
		const availableYears = Array.from(yearsSet).sort((a, b) => b - a); // Newest first
		const availableMonths = Array.from(monthsSet).sort((a, b) => a - b); // January to December


		// Set default year and month
		const defaultYear = availableYears.includes(currentYear)
			? currentYear
			: availableYears[0] || currentYear;
		const defaultMonth = availableMonths.includes(currentMonth)
			? currentMonth
			: availableMonths[0] || currentMonth;
	return {
		records,
		availableYears,
		availableMonths,
		defaultYear,
		defaultMonth,
		odoByMonth
	};	

	// try {
	// 	const [odometerReadings, stats] = await Promise.all([
	// 		RecordService.getOdometerDifferencesByMonth(year, month),
	// 		RecordService.getOdometerStatsByMonth(year, month)
	// 	]);

	// 	return {
	// 		odometerReadings,
	// 		stats,
	// 		selectedYear: year,
	// 		selectedMonth: month
	// 	};
	// } catch (error) {
	// 	console.error('Error loading odometer data:', error);
	// 	return {
	// 		odometerReadings: [],
	// 		stats: {
	// 			totalDistance: 0,
	// 			averageDaily: 0,
	// 			maxDaily: 0,
	// 			minDaily: 0,
	// 			daysWithReadings: 0,
	// 			startOdometer: 0,
	// 			endOdometer: 0
	// 		},
	// 		selectedYear: year,
	// 		selectedMonth: month,
	// 		error: 'Failed to load odometer data'
	// 	};
	// }
};