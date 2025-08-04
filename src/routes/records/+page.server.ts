import { RecordService } from '$lib/db.server';
import { createImagePath, saveImageFile } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const records = await RecordService.getAllRecords();
	console.log('🚀 ~ load ~ records:', records);

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
		defaultMonth
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		try {
			const formData = await request.formData();

			const loaded = Number(formData.get('loaded'));
			const collected = Number(formData.get('collected'));
			const cutters = Number(formData.get('cutters'));
			const returned = Number(formData.get('returned'));
			const missplaced = Number(formData.get('missplaced')) || 0;
			const expense = Number(formData.get('expense')) || 0; // Default to 0 if not provided
			const selectedDate = formData.get('selectedDate') as string;
			const imageFile = formData.get('image') as File | null;
			const odometer = Number(formData.get('odometer')) || 0;
			const noteRaw = formData.get('note');
			const note = typeof noteRaw === 'string' ? noteRaw : undefined;

			// Vehicle usage data
			const usage_mode = (formData.get('usage_mode') as string) || 'standard';
			const distance_manual = Number(formData.get('distance_manual')) || 0;
			const purpose = (formData.get('purpose') as string) || '';

			// Validate required fields
			if (isNaN(loaded) || isNaN(collected) || isNaN(cutters) || isNaN(returned)) {
				return fail(400, { error: 'All numeric fields are required' });
			}

			if (loaded < 0 || collected < 0 || cutters < 0 || returned < 0) {
				return fail(400, { error: 'All values must be non-negative' });
			}

			// Validate date
			if (!selectedDate) {
				return fail(400, { error: 'Entry date is required' });
			}

			// Validate date format and that it's not in the future
			const entryDate = new Date(selectedDate);
			const today = new Date();
			today.setHours(23, 59, 59, 999); // Set to end of today

			if (isNaN(entryDate.getTime())) {
				return fail(400, { error: 'Invalid date format' });
			}

			if (entryDate > today) {
				return fail(400, { error: 'Entry date cannot be in the future' });
			}

			// Check if date is too far in the past (optional - adjust as needed)
			const oneYearAgo = new Date();
			oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

			if (entryDate < oneYearAgo) {
				return fail(400, { error: 'Entry date cannot be more than one year ago' });
			}

			let imagePath: string | undefined;

			// Handle image upload if provided
			if (imageFile && imageFile.size > 0) {
				if (!imageFile.type.startsWith('image/')) {
					return fail(400, { error: 'Please upload a valid image file' });
				}

				if (imageFile.size > 5 * 1024 * 1024) {
					// 5MB limit
					return fail(400, { error: 'Image file must be smaller than 5MB' });
				}

				try {
					imagePath = createImagePath(imageFile);
					await saveImageFile(imageFile, imagePath);
				} catch (error) {
					console.error('Failed to save image:', error);
					return fail(500, { error: 'Failed to save image' });
				}
			}

			// Save to database with custom date
			const recordId = await RecordService.createRecord({
				loaded,
				collected,
				cutters,
				returned,
				missplaced,
				expense,
				odometer,
				image_path: imagePath,
				note,
				entry_date: selectedDate
			});

			// Save vehicle usage log with record_id
			await RecordService.createVehicleUsageLog({
				entry_date: selectedDate,
				usage_mode: usage_mode as 'standard' | 'no_used' | 'other',
				vehicle_id: 1, // Default vehicle ID
				odometer_end: usage_mode === 'standard' ? odometer : undefined,
				distance_manual: usage_mode !== 'standard' ? distance_manual : 0,
				purpose: usage_mode === 'other' ? purpose : undefined,
				comment: note,
				record_id: recordId
			});

			return { success: true };
		} catch (error) {
			console.error('Form submission error:', error);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
