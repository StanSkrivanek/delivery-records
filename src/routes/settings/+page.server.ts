import { RecordService } from '$lib/db.server';
import { createImagePath, deleteImageFile, saveImageFile } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const drivers = await RecordService.getAllDrivers();
	const vehicles = await RecordService.getAllVehicles();

	// Get vehicle assignments for each driver
	const driversWithVehicles = await Promise.all(
		drivers.map(async (driver) => {
			const assignedVehicles = await RecordService.getVehiclesForDriver(driver.id!);
			return {
				...driver,
				assignedVehicles
			};
		})
	);

	return {
		drivers: driversWithVehicles,
		vehicles
	};
};

export const actions: Actions = {
	createDriver: async ({ request }) => {
		const formData = await request.formData();

		const full_name = formData.get('full_name')?.toString().trim();
		const date_of_birth = formData.get('date_of_birth')?.toString().trim();
		const address = formData.get('address')?.toString().trim();
		const driver_license_number = formData.get('driver_license_number')?.toString().trim();
		const email = formData.get('email')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();
		const license_image = formData.get('license_image') as File | null;

		if (!full_name || !date_of_birth || !address || !driver_license_number) {
			return fail(400, { error: 'All required fields must be provided' });
		}

		let driver_license_image_path: string | undefined;

		if (license_image && license_image.size > 0) {
			try {
				const imagePath = createImagePath(license_image);
				await saveImageFile(license_image, imagePath);
				driver_license_image_path = imagePath;
			} catch (error) {
				console.error('Error saving license image:', error);
				return fail(500, { error: 'Failed to save license image' });
			}
		}

		try {
			const driverId = await RecordService.createDriver({
				full_name,
				date_of_birth,
				address,
				driver_license_number,
				driver_license_image_path,
				email: email || undefined,
				phone: phone || undefined
			});

			return { success: true, driverId, message: 'Driver created successfully' };
		} catch (error) {
			console.error('Error creating driver:', error);
			return fail(500, { error: 'Failed to create driver' });
		}
	},

	updateDriver: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { error: 'Driver ID is required' });
		}

		const full_name = formData.get('full_name')?.toString().trim();
		const date_of_birth = formData.get('date_of_birth')?.toString().trim();
		const address = formData.get('address')?.toString().trim();
		const driver_license_number = formData.get('driver_license_number')?.toString().trim();
		const email = formData.get('email')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();
		const license_image = formData.get('license_image') as File | null;
		const remove_image = formData.get('remove_image') === 'true';

		const updateData: Parameters<typeof RecordService.updateDriver>[1] = {};

		if (full_name) updateData.full_name = full_name;
		if (date_of_birth) updateData.date_of_birth = date_of_birth;
		if (address) updateData.address = address;
		if (driver_license_number) updateData.driver_license_number = driver_license_number;
		if (email) updateData.email = email;
		if (phone) updateData.phone = phone;

		// Handle image
		if (remove_image) {
			const existingDriver = await RecordService.getDriverById(id);
			if (existingDriver?.driver_license_image_path) {
				deleteImageFile(existingDriver.driver_license_image_path);
			}
			updateData.driver_license_image_path = null as unknown as string;
		} else if (license_image && license_image.size > 0) {
			const existingDriver = await RecordService.getDriverById(id);
			if (existingDriver?.driver_license_image_path) {
				deleteImageFile(existingDriver.driver_license_image_path);
			}

			try {
				const imagePath = createImagePath(license_image);
				await saveImageFile(license_image, imagePath);
				updateData.driver_license_image_path = imagePath;
			} catch (error) {
				console.error('Error saving license image:', error);
				return fail(500, { error: 'Failed to save license image' });
			}
		}

		try {
			const success = await RecordService.updateDriver(id, updateData);
			if (!success) {
				return fail(404, { error: 'Driver not found' });
			}
			return { success: true, message: 'Driver updated successfully' };
		} catch (error) {
			console.error('Error updating driver:', error);
			return fail(500, { error: 'Failed to update driver' });
		}
	},

	deleteDriver: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { error: 'Driver ID is required' });
		}

		try {
			const driver = await RecordService.getDriverById(id);
			if (driver?.driver_license_image_path) {
				deleteImageFile(driver.driver_license_image_path);
			}

			const success = await RecordService.deleteDriver(id);
			if (!success) {
				return fail(404, { error: 'Driver not found' });
			}

			return { success: true, message: 'Driver deleted successfully' };
		} catch (error) {
			console.error('Error deleting driver:', error);
			return fail(500, { error: 'Failed to delete driver' });
		}
	},

	createVehicle: async ({ request }) => {
		const formData = await request.formData();

		const make = formData.get('make')?.toString().trim();
		const model = formData.get('model')?.toString().trim();
		const type = formData.get('type')?.toString().trim();
		const registration_number = formData.get('registration_number')?.toString().trim();
		const color = formData.get('color')?.toString().trim();
		const initial_mileage = parseInt(formData.get('initial_mileage')?.toString() || '0');
		const current_mileage = parseInt(formData.get('current_mileage')?.toString() || '0');
		const year = formData.get('year')?.toString().trim();
		const vin = formData.get('vin')?.toString().trim();

		if (!make || !model || !type || !registration_number || !color) {
			return fail(400, { error: 'All required fields must be provided' });
		}

		if (isNaN(initial_mileage) || initial_mileage < 0) {
			return fail(400, { error: 'Initial mileage must be a non-negative number' });
		}

		if (isNaN(current_mileage) || current_mileage < 0) {
			return fail(400, { error: 'Current mileage must be a non-negative number' });
		}

		try {
			const vehicleId = await RecordService.createVehicle({
				make,
				model,
				type,
				registration_number,
				color,
				initial_mileage,
				current_mileage,
				year: year ? parseInt(year) : undefined,
				vin: vin || undefined
			});

			return { success: true, vehicleId, message: 'Vehicle created successfully' };
		} catch (error) {
			console.error('Error creating vehicle:', error);
			return fail(500, { error: 'Failed to create vehicle' });
		}
	},

	updateVehicle: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { error: 'Vehicle ID is required' });
		}

		const updateData: Parameters<typeof RecordService.updateVehicle>[1] = {};

		const make = formData.get('make')?.toString().trim();
		const model = formData.get('model')?.toString().trim();
		const type = formData.get('type')?.toString().trim();
		const registration_number = formData.get('registration_number')?.toString().trim();
		const color = formData.get('color')?.toString().trim();
		const initial_mileage = formData.get('initial_mileage')?.toString().trim();
		const current_mileage = formData.get('current_mileage')?.toString().trim();
		const year = formData.get('year')?.toString().trim();
		const vin = formData.get('vin')?.toString().trim();

		if (make) updateData.make = make;
		if (model) updateData.model = model;
		if (type) updateData.type = type;
		if (registration_number) updateData.registration_number = registration_number;
		if (color) updateData.color = color;
		if (initial_mileage) updateData.initial_mileage = parseInt(initial_mileage);
		if (current_mileage) updateData.current_mileage = parseInt(current_mileage);
		if (year) updateData.year = parseInt(year);
		if (vin) updateData.vin = vin;

		try {
			const success = await RecordService.updateVehicle(id, updateData);
			if (!success) {
				return fail(404, { error: 'Vehicle not found' });
			}
			return { success: true, message: 'Vehicle updated successfully' };
		} catch (error) {
			console.error('Error updating vehicle:', error);
			return fail(500, { error: 'Failed to update vehicle' });
		}
	},

	deleteVehicle: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			return fail(400, { error: 'Vehicle ID is required' });
		}

		try {
			const success = await RecordService.deleteVehicle(id);
			if (!success) {
				return fail(404, { error: 'Vehicle not found' });
			}

			return { success: true, message: 'Vehicle deleted successfully' };
		} catch (error) {
			console.error('Error deleting vehicle:', error);
			return fail(500, { error: 'Failed to delete vehicle' });
		}
	},

	assignVehicle: async ({ request }) => {
		const formData = await request.formData();
		const driverId = parseInt(formData.get('driver_id')?.toString() || '0');
		const vehicleId = parseInt(formData.get('vehicle_id')?.toString() || '0');

		if (!driverId || !vehicleId) {
			return fail(400, { error: 'Driver ID and Vehicle ID are required' });
		}

		try {
			await RecordService.assignDriverToVehicle(driverId, vehicleId);
			return { success: true, message: 'Vehicle assigned successfully' };
		} catch (error) {
			console.error('Error assigning vehicle:', error);
			return fail(500, { error: 'Failed to assign vehicle' });
		}
	},

	unassignVehicle: async ({ request }) => {
		const formData = await request.formData();
		const driverId = parseInt(formData.get('driver_id')?.toString() || '0');
		const vehicleId = parseInt(formData.get('vehicle_id')?.toString() || '0');

		if (!driverId || !vehicleId) {
			return fail(400, { error: 'Driver ID and Vehicle ID are required' });
		}

		try {
			const success = await RecordService.unassignDriverFromVehicle(driverId, vehicleId);
			if (!success) {
				return fail(404, { error: 'Assignment not found' });
			}
			return { success: true, message: 'Vehicle unassigned successfully' };
		} catch (error) {
			console.error('Error unassigning vehicle:', error);
			return fail(500, { error: 'Failed to unassign vehicle' });
		}
	}
};
