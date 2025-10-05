// src/routes/invoice/+page.server.ts
import { RecordService } from '$lib/records.pg';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const records = await RecordService.getAllRecords();

	// Extract unique years and months from the data
	const yearsSet = new Set<number>();
	const monthsSet = new Set<number>();

	records.forEach((record) => {
		if (record.entry_date || record.created_at) {
			const dateString = record.entry_date || record.created_at;
			if (typeof dateString === 'string') {
				const date = new Date(dateString);
				yearsSet.add(date.getFullYear());
				monthsSet.add(date.getMonth() + 1);
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

	// Set default year and month
	const defaultYear = availableYears.includes(currentYear)
		? currentYear
		: availableYears[0] || currentYear;
	const defaultMonth = availableMonths.includes(currentMonth)
		? currentMonth
		: availableMonths[0] || currentMonth;

	return {
		availableYears,
		availableMonths,
		defaultYear,
		defaultMonth
	};
};
