import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { RecordService } from '$lib/db.server';
import { createImagePath, saveImageFile } from '$lib/utils';

export const load: PageServerLoad = async () => {
	const records = await RecordService.getAllRecords();

	return {
		records: records.slice(0, 10) // Show latest 10 records
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
			const imageFile = formData.get('image') as File | null;

			// Validate required fields
			if (isNaN(loaded) || isNaN(collected) || isNaN(cutters) || isNaN(returned)) {
				return fail(400, { error: 'All numeric fields are required' });
			}

			if (loaded < 0 || collected < 0 || cutters < 0 || returned < 0) {
				return fail(400, { error: 'All values must be non-negative' });
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

			// Save to database
			await RecordService.createRecord({
				loaded,
				collected,
				cutters,
				returned,
				image_path: imagePath
			});

			return { success: true };
		} catch (error) {
			console.error('Form submission error:', error);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
