// SINGLE RECORD API HANDLER
// This file handles the API requests for a single delivery record.
// It includes PUT and DELETE methods to update and delete records respectively.

import { RecordService } from '$lib/db.server';
import { createImagePath, deleteImageFile, saveImageFile } from '$lib/utils';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const recordId = parseInt(params.id);
		if (isNaN(recordId)) {
			throw error(400, 'Invalid record ID');
		}

		// Get the existing record
		const existingRecord = await RecordService.getRecordById(recordId);
		if (!existingRecord) {
			throw error(404, 'Record not found');
		}

		const formData = await request.formData();

		// Extract form fields
		const loaded = Number(formData.get('loaded'));
		const collected = Number(formData.get('collected'));
		const cutters = Number(formData.get('cutters'));
		const returned = Number(formData.get('returned'));
		const missplaced = Number(formData.get('missplaced')) || 0;
		const expense = Number(formData.get('expense')) || 0;
		const expense_no_vat = Number(formData.get('expense_no_vat')) || 0;
		const odometer = Number(formData.get('odometer')) || 0;
		const note = (formData.get('note') as string) || '';
		const entryDate = formData.get('entry_date') as string;
		const imageFile = formData.get('image') as File | null;
		const existingImagePath = formData.get('existing_image_path') as string | null;

		// Vehicle usage data
		const usage_mode = (formData.get('usage_mode') as string) || 'standard';
		const distance_manual = Number(formData.get('distance_manual')) || 0;
		const purpose = (formData.get('purpose') as string) || '';

		// Validate required fields
		if (isNaN(loaded) || isNaN(collected) || isNaN(cutters) || isNaN(returned)) {
			throw error(400, 'All numeric fields are required');
		}

		if (loaded < 0 || collected < 0 || cutters < 0 || returned < 0) {
			throw error(400, 'All values must be non-negative');
		}

		if (!entryDate) {
			throw error(400, 'Entry date is required');
		}

		// Validate date
		const entryDateObj = new Date(entryDate);
		if (isNaN(entryDateObj.getTime())) {
			throw error(400, 'Invalid date format');
		}

		let finalImagePath = existingRecord.image_path;

		// Handle image upload
		if (imageFile && imageFile.size > 0) {
			// Validate image
			if (!imageFile.type.startsWith('image/')) {
				throw error(400, 'Please upload a valid image file');
			}

			if (imageFile.size > 5 * 1024 * 1024) {
				// 5MB limit
				throw error(400, 'Image file must be smaller than 5MB');
			}

			try {
				// Delete old image(s) if they exist
				if (existingRecord.image_path) {
					let oldImagePaths: string[] = [];
					try {
						oldImagePaths = JSON.parse(existingRecord.image_path);
						if (!Array.isArray(oldImagePaths)) {
							oldImagePaths = [existingRecord.image_path];
						}
					} catch {
						oldImagePaths = [existingRecord.image_path];
					}

					// Delete all old images
					for (const oldPath of oldImagePaths) {
						try {
							deleteImageFile(oldPath);
						} catch (e) {
							console.error(`Failed to delete old image ${oldPath}:`, e);
						}
					}
				}

				// Save new image
				const newImagePath = createImagePath(imageFile, 0);
				await saveImageFile(imageFile, newImagePath);
				finalImagePath = newImagePath;
			} catch (imageError) {
				console.error('Failed to save image:', imageError);
				throw error(500, 'Failed to save image');
			}
		} else if (existingImagePath) {
			// Keep existing image
			finalImagePath = existingImagePath;
		} else {
			// No image provided and no existing image to keep
			if (existingRecord.image_path) {
				let oldImagePaths: string[] = [];
				try {
					oldImagePaths = JSON.parse(existingRecord.image_path);
					if (!Array.isArray(oldImagePaths)) {
						oldImagePaths = [existingRecord.image_path];
					}
				} catch {
					oldImagePaths = [existingRecord.image_path];
				}

				// Delete all old images
				for (const oldPath of oldImagePaths) {
					try {
						deleteImageFile(oldPath);
					} catch (e) {
						console.error(`Failed to delete old image ${oldPath}:`, e);
					}
				}
			}
			finalImagePath = undefined;
		}

		// Update the record
		const updatedRecord = await RecordService.updateRecord(recordId, {
			loaded,
			collected,
			cutters,
			returned,
			missplaced,
			expense,
			expense_no_vat,
			odometer,
			note,
			entry_date: entryDate,
			image_path: finalImagePath
		});

		// Delete existing vehicle usage log entry for this record
		await RecordService.deleteVehicleUsageLogByRecordId(recordId);

		// Create new vehicle usage log entry
		await RecordService.createVehicleUsageLog({
			entry_date: entryDate,
			usage_mode: usage_mode as 'standard' | 'no_used' | 'other',
			vehicle_id: 1,
			odometer_end: usage_mode === 'standard' ? odometer : undefined,
			distance_manual: usage_mode !== 'standard' ? distance_manual : 0,
			purpose: usage_mode === 'other' ? purpose : undefined,
			comment: note,
			record_id: recordId
		});

		return json(updatedRecord);
	} catch (err) {
		console.error('Update record error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to update record');
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const recordId = parseInt(params.id);
		if (isNaN(recordId)) {
			throw error(400, 'Invalid record ID');
		}

		// Get the record to delete its image
		const existingRecord = await RecordService.getRecordById(recordId);
		if (!existingRecord) {
			throw error(404, 'Record not found');
		}

		// Delete the image file(s) if they exist
		if (existingRecord.image_path) {
			try {
				// Try to parse as JSON array (multiple images)
				let imagePaths: string[] = [];
				try {
					imagePaths = JSON.parse(existingRecord.image_path);
					if (!Array.isArray(imagePaths)) {
						// If it's not an array, treat it as a single path
						imagePaths = [existingRecord.image_path];
					}
				} catch {
					// If JSON parse fails, it's a single path (old format)
					imagePaths = [existingRecord.image_path];
				}

				// Delete all images
				for (const imagePath of imagePaths) {
					try {
						deleteImageFile(imagePath);
					} catch (imageError) {
						console.error(`Failed to delete image file ${imagePath}:`, imageError);
						// Continue with other images even if one fails
					}
				}
			} catch (imageError) {
				console.error('Failed to delete image files:', imageError);
				// Continue with record deletion even if image deletion fails
			}
		}

		// Delete associated vehicle usage log entries
		try {
			await RecordService.deleteVehicleUsageLogByRecordId(recordId);
		} catch (logError) {
			console.error('Failed to delete vehicle usage log:', logError);
			// Continue with record deletion even if log deletion fails
		}

		// Delete the record
		const success = await RecordService.deleteRecord(recordId);
		if (!success) {
			throw error(404, 'Record not found');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Delete record error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to delete record');
	}
};
