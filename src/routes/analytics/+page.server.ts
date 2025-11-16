import { RecordService } from '$lib/db.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get all records from database
	const records = await RecordService.getAllRecords();

	// Extract unique years and months from the data
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

	// Get current date for defaults
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// Check URL parameters for year and month
	const urlYear = url.searchParams.get('year');
	const urlMonth = url.searchParams.get('month');

	// Set default year and month (prioritize URL params, then current date, then available data)
	const defaultYear = urlYear
		? parseInt(urlYear)
		: availableYears.includes(currentYear)
			? currentYear
			: availableYears[0] || currentYear;
	const defaultMonth = urlMonth
		? parseInt(urlMonth)
		: availableMonths.includes(currentMonth)
			? currentMonth
			: availableMonths[0] || currentMonth;

	return {
		records,
		availableYears,
		availableMonths,
		defaultYear,
		defaultMonth
	};
};
