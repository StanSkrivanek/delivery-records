import { RecordService as rs } from '$lib/db.server';
// import { createImagePath, saveImageFile } from '$lib/utils';
// import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const records = await rs.getAllRecords();
    
    const monthly = await rs.getRecordsByCurrentMonth();

  
return {
        records,
        monthly
}






// 	// Extract unique years and months from the data
// 	const yearsSet = new Set<number>();
// 	const monthsSet = new Set<number>();

// 	records.forEach((record) => {
// 		if (record.entry_date || record.entry_date === null) {
// 			// Use entry_date if available, fallback to date_created for older records
// 			const dateString = record.entry_date || record.created_at;
// 			if (typeof dateString === 'string') {
// 				const date = new Date(dateString);
// 				yearsSet.add(date.getFullYear());
// 				monthsSet.add(date.getMonth() + 1); // getMonth() returns 0-11, so add 1
// 			}
// 		}
// 	});

// 	// Convert sets to sorted arrays
// 	const availableYears = Array.from(yearsSet).sort((a, b) => b - a); // Newest first
// 	const availableMonths = Array.from(monthsSet).sort((a, b) => a - b); // January to December

// 	// Get current date for defaults
// 	const now = new Date();
// 	const currentYear = now.getFullYear();
// 	const currentMonth = now.getMonth() + 1;

// 	// Set default year and month
// 	const defaultYear = availableYears.includes(currentYear)
// 		? currentYear
// 		: availableYears[0] || currentYear;
// 	const defaultMonth = availableMonths.includes(currentMonth)
// 		? currentMonth
// 		: availableMonths[0] || currentMonth;

// 	return {
// 		records,
// 		availableYears,
// 		availableMonths,
// 		defaultYear,
// 		defaultMonth
// 	};
// };

// export const actions: Actions = {
// 	create: async ({ request }) => {
// 		try {
// 			const formData = await request.formData();

// 			const loaded = Number(formData.get('loaded'));
// 			const collected = Number(formData.get('collected'));
// 			const cutters = Number(formData.get('cutters'));
// 			const returned = Number(formData.get('returned'));
// 			const missplaced = Number(formData.get('missplaced')) || 0;
// 			const expense = Number(formData.get('expense')) || 0; // Default to 0 if not provided
// 			const selectedDate = formData.get('selectedDate') as string;
// 			// const imageFile = formData.get('image') as File | null;

// 			// Validate required fields
// 			if (isNaN(loaded) || isNaN(collected) || isNaN(cutters) || isNaN(returned)) {
// 				return fail(400, { error: 'All numeric fields are required' });
// 			}

// 			if (loaded < 0 || collected < 0 || cutters < 0 || returned < 0) {
// 				return fail(400, { error: 'All values must be non-negative' });
// 			}

// 			// Validate date
// 			if (!selectedDate) {
// 				return fail(400, { error: 'Entry date is required' });
// 			}

// 			// Validate date format and that it's not in the future
// 			const entryDate = new Date(selectedDate);
// 			const today = new Date();
// 			today.setHours(23, 59, 59, 999); // Set to end of today

// 			if (isNaN(entryDate.getTime())) {
// 				return fail(400, { error: 'Invalid date format' });
// 			}

// 			if (entryDate > today) {
// 				return fail(400, { error: 'Entry date cannot be in the future' });
// 			}

// 			// Check if date is too far in the past (optional - adjust as needed)
// 			const oneYearAgo = new Date();
// 			oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

// 			if (entryDate < oneYearAgo) {
// 				return fail(400, { error: 'Entry date cannot be more than one year ago' });
// 			}

		
// 			// Save to database with custom date
// 			await RecordService.createRecord({
// 				loaded,
// 				collected,
// 				cutters,
// 				returned,
// 				missplaced,
// 				expense,
// 				entry_date: selectedDate
// 			});

// 			return { success: true };
// 		} catch (error) {
// 			console.error('Form submission error:', error);
// 			return fail(500, { error: 'An unexpected error occurred' });
// 		}
// 	}
};
