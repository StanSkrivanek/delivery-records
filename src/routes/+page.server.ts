import { RecordService as rs } from '$lib/db.server';
// import { createImagePath, saveImageFile } from '$lib/utils';
// import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
// $inspect(rs.getMonthlyInvoiceData(currentYear, currentMonth), 'getMonthlyInvoiceData');
export const load: PageServerLoad = async ({ url }) => {
	// const records = await rs.getAllRecords();
	const yearParam = url.searchParams.get('year');
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;
	const selectedYear = yearParam ? parseInt(yearParam) : currentYear;

	// If viewing current year, show current month. Otherwise show first month with data from selected year
	let monthly;
	if (selectedYear === currentYear) {
		monthly = await rs.getRecordsByCurrentMonth();
	} else {
		// Get all records for the year to find which months have data
		const yearRecords = await rs.getRecordsByYear(selectedYear);
		// Show all records for the selected year in the chart
		monthly = yearRecords;
	}
	const yearly = await rs.getRecordsByYear(selectedYear);
	const getLatestOdometer = await rs.getLatestOdometer();

	// Get available years
	const allRecords = await rs.getAllRecords();
	const years = [
		...new Set(
			allRecords
				.filter((record) => record.entry_date) // Filter out records without dates
				.map((record) => new Date(record.entry_date).getFullYear())
				.filter((year) => !isNaN(year)) // Filter out invalid years
		)
	].sort((a, b) => b - a);

	// Ensure current year is always available
	if (!years.includes(currentYear)) {
		years.unshift(currentYear);
	}

	// Ensure selected year is in the list
	if (selectedYear !== currentYear && !years.includes(selectedYear)) {
		years.push(selectedYear);
		years.sort((a, b) => b - a);
	}

	return {
		// records,
		getLatestOdometer,
		monthly,
		yearly,
		selectedYear,
		availableYears: years
	};
};
