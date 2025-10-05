// export interface Record {
// 	id?: number;
// 	loaded: number;
// 	collected: number;
// 	cutters: number;
// 	returned: number;
// 	missplaced?: number;
// 	expense?: number;
// 	odometer?: number;
// 	image_path?: string;
// 	entry_date: string;
// 	created_at?: string;
// }

// export interface OdometerReading {
// 	id: number;
// 	entry_date: string;
// 	odometer: number;
// 	previous_odometer: number | null;
// 	daily_difference: number | null;
// 	days_between: number | null;
// }
export interface OdometerReading {
	id: number;
	entry_date: string;
	odometer: number;
	previous_odometer: number | null;
	daily_difference: number | null;
	days_between: number | null;
}

export interface OdometerStats {
	totalDistance: number;
	averageDaily: number;
	maxDaily: number;
	minDaily: number;
	daysWithReadings: number;
	startOdometer: number;
	endOdometer: number;
}

export interface User {
	id?: number;
	email: string;
	password_hash?: string;
	first_name: string;
	last_name: string;
	phone?: string;
	role: 'super_admin' | 'org_admin' | 'depot_manager' | 'driver' | 'viewer';
	is_active: boolean;
	organization_id?: number;
	created_at?: string;
	updated_at?: string;
	last_login_at?: string;
}

export interface Organization {
	id?: number;
	name: string;
	legal_name?: string;
	vat_number?: string;
	tax_id?: string;
	phone?: string;
	email?: string;
	address?: string;
	city?: string;
	postal_code?: string;
	country?: string;
	logo_url?: string;
	is_active: boolean;
	settings?: string; // JSON
	created_at?: string;
	updated_at?: string;
}

export interface Depot {
	id?: number;
	organization_id: number;
	name: string;
	code?: string;
	address?: string;
	city?: string;
	postal_code?: string;
	phone?: string;
	email?: string;
	manager_id?: number;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface Vehicle {
	id?: number;
	organization_id: number;
	depot_id?: number;
	license_plate: string;
	make?: string;
	model?: string;
	year?: number;
	vin?: string;
	initial_odometer?: number;
	current_odometer?: number;
	fuel_type?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
	is_active: boolean;
	notes?: string;
	created_at?: string;
	updated_at?: string;
}

export interface Record {
	id?: number;
	loaded: number;
	collected: number;
	cutters: number;
	returned: number;
	missplaced?: number;
	expense?: number;
	expense_no_vat?: number;
	odometer?: number;
	image_path?: string;
	entry_date: string;
	created_at?: string;
}
export interface VehicleUsageEntry {
	entry_date: string;
	usage_mode: 'standard' | 'no_used' | 'other';
	vehicle_id?: number;
	odometer_end?: number;
	distance_manual?: number;
	purpose?: string;
	comment?: string;
}
