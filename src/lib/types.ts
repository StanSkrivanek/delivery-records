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

export interface Driver {
	id?: number;
	full_name: string;
	date_of_birth: string;
	address: string;
	driver_license_number: string;
	driver_license_image_path?: string;
	email?: string;
	phone?: string;
	created_at?: string;
	updated_at?: string;
}

export interface Vehicle {
	id?: number;
	make: string;
	model: string;
	type: string;
	registration_number: string;
	color: string;
	initial_mileage: number;
	current_mileage: number;
	year?: number;
	vin?: string;
	created_at?: string;
	updated_at?: string;
}

export interface DriverVehicleAssignment {
	id?: number;
	driver_id: number;
	vehicle_id: number;
	assigned_at?: string;
}
