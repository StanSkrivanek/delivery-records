import { RecordService } from '$lib/db.server';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const parseNumber = (value: FormDataEntryValue | null, defaultValue = 0) => {
	if (value === null || value === undefined || value === '') {
		return defaultValue;
	}
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return NaN;
	}
	return parsed;
};

const sanitizeString = (value: FormDataEntryValue | null) =>
	typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ url }) => {
	const startDate = url.searchParams.get('startDate') ?? '';
	const endDate = url.searchParams.get('endDate') ?? '';
	const driver = url.searchParams.get('driver') ?? '';
	const vehicle = url.searchParams.get('vehicle') ?? '';

	const filters = {
		startDate,
		endDate,
		driver,
		vehicle
	};

	const entries = await RecordService.getDrivingLogEntries({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
		driver: driver || undefined,
		vehicle: vehicle || undefined
	});

	const { drivers, vehicles } = await RecordService.getDrivingLogDistinctValues();
	const summary = RecordService.calculateDrivingLogSummary(entries);

	return {
		entries,
		filters,
		drivers,
		vehicles,
		summary
	};
};

const buildEntryPayload = (formData: FormData) => {
	const entry_date = sanitizeString(formData.get('entry_date'));
	const driver = sanitizeString(formData.get('driver'));
	const vehicle = sanitizeString(formData.get('vehicle'));
	const start_time = sanitizeString(formData.get('start_time'));
	const end_time = sanitizeString(formData.get('end_time'));
	const start_odometer = parseNumber(formData.get('start_odometer'));
	const end_odometer = parseNumber(formData.get('end_odometer'));
	const total_driving_hours = parseNumber(formData.get('total_driving_hours'), 0);
	const total_working_hours = parseNumber(formData.get('total_working_hours'), 0);
	const break_minutes = parseNumber(formData.get('break_minutes'), 0);

	const values = {
		entry_date,
		driver,
		vehicle,
		start_time,
		end_time,
		start_odometer,
		end_odometer,
		total_driving_hours,
		total_working_hours,
		break_minutes
	};

	if (!entry_date) {
		return { error: 'Entry date is required', values };
	}

	if (!driver) {
		return { error: 'Driver is required', values };
	}

	if (!vehicle) {
		return { error: 'Vehicle is required', values };
	}

	if (!start_time) {
		return { error: 'Start time is required', values };
	}

	if (!end_time) {
		return { error: 'End time is required', values };
	}

	if (Number.isNaN(start_odometer) || Number.isNaN(end_odometer)) {
		return { error: 'Odometer readings must be numbers', values };
	}

	if (start_odometer < 0 || end_odometer < 0) {
		return { error: 'Odometer readings cannot be negative', values };
	}

	if (end_odometer < start_odometer) {
		return { error: 'End odometer cannot be less than start odometer', values };
	}

	if (Number.isNaN(total_driving_hours) || total_driving_hours < 0) {
		return { error: 'Total driving hours must be zero or a positive number', values };
	}

	if (Number.isNaN(total_working_hours) || total_working_hours < 0) {
		return { error: 'Total working hours must be zero or a positive number', values };
	}

	if (Number.isNaN(break_minutes) || break_minutes < 0) {
		return { error: 'Break time must be zero or a positive number', values };
	}

	return { entry: values };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const formData = await request.formData();
		const { entry, error, values } = buildEntryPayload(formData);

		if (error || !entry) {
			return fail(400, { error, values, intent: 'create' });
		}

		await RecordService.createDrivingLogEntry(entry);

		const query = url.searchParams.toString();
		const redirectTo = query ? `${url.pathname}?${query}` : url.pathname;
		throw redirect(303, redirectTo || '/driving-log');
	},
	update: async ({ request, url }) => {
		const formData = await request.formData();
		const idRaw = formData.get('id');
		const id = Number(idRaw);

		if (!idRaw || Number.isNaN(id)) {
			return fail(400, { error: 'Valid entry id is required for update', intent: 'update' });
		}

		const { entry, error, values } = buildEntryPayload(formData);

		if (error || !entry) {
			return fail(400, { error, values, intent: 'update', id });
		}

		await RecordService.updateDrivingLogEntry(id, entry);

		const query = url.searchParams.toString();
		const redirectTo = query ? `${url.pathname}?${query}` : url.pathname;
		throw redirect(303, redirectTo || '/driving-log');
	},
	delete: async ({ request, url }) => {
		const formData = await request.formData();
		const idRaw = formData.get('id');
		const id = Number(idRaw);

		if (!idRaw || Number.isNaN(id)) {
			return fail(400, { error: 'Valid entry id is required for deletion', intent: 'delete' });
		}

		await RecordService.deleteDrivingLogEntry(id);

		const query = url.searchParams.toString();
		const redirectTo = query ? `${url.pathname}?${query}` : url.pathname;
		throw redirect(303, redirectTo || '/driving-log');
	}
};
