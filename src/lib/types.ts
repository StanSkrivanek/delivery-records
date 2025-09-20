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
