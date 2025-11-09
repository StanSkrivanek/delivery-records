import { dev } from '$app/environment';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = dev ? 'database.db' : './database.db';
const db = new Database(dbPath);

// Initialize database schema with all fields
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loaded INTEGER NOT NULL,
    collected INTEGER NOT NULL,
    cutters INTEGER NOT NULL,
    returned INTEGER NOT NULL,
    missplaced INTEGER DEFAULT 0,
    expense REAL DEFAULT 0,
		expense_no_vat REAL DEFAULT 0,
    odometer INTEGER DEFAULT 0,
    image_path TEXT,
    note TEXT,
    entry_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Table for tracking vehicle usage
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicle_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date DATE NOT NULL,
    usage_mode TEXT NOT NULL CHECK (usage_mode IN ('standard', 'no_used', 'other')),
    vehicle_id INTEGER DEFAULT 1,
    odometer_end INTEGER,
    distance_manual INTEGER DEFAULT 0,
    purpose TEXT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    record_id INTEGER REFERENCES records(id)
  )
`);

// Create index if it doesn't exist
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_vehicle_usage_log_record_id ON vehicle_usage_log(record_id);
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS driving_log_entries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		entry_date DATE NOT NULL,
		driver TEXT NOT NULL,
		vehicle TEXT NOT NULL,
		start_time TEXT NOT NULL,
		end_time TEXT NOT NULL,
		start_odometer INTEGER NOT NULL,
		end_odometer INTEGER NOT NULL,
		total_driving_hours REAL DEFAULT 0,
		total_working_hours REAL DEFAULT 0,
		break_minutes INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_driving_log_entries_entry_date ON driving_log_entries(entry_date);
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_driving_log_entries_driver ON driving_log_entries(driver);
`);

// Table for drivers
db.exec(`
	CREATE TABLE IF NOT EXISTS drivers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		full_name TEXT NOT NULL,
		date_of_birth DATE NOT NULL,
		address TEXT NOT NULL,
		driver_license_number TEXT NOT NULL UNIQUE,
		driver_license_image_path TEXT,
		email TEXT,
		phone TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_drivers_full_name ON drivers(full_name);
`);

// Table for vehicles
db.exec(`
	CREATE TABLE IF NOT EXISTS vehicles (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		make TEXT NOT NULL,
		model TEXT NOT NULL,
		type TEXT NOT NULL,
		registration_number TEXT NOT NULL UNIQUE,
		color TEXT NOT NULL,
		initial_mileage INTEGER NOT NULL DEFAULT 0,
		current_mileage INTEGER NOT NULL DEFAULT 0,
		year INTEGER,
		vin TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
`);

// Table to link drivers to vehicles (many-to-many relationship)
db.exec(`
	CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
		vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
		assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(driver_id, vehicle_id)
	)
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_driver_vehicle_driver ON driver_vehicle_assignments(driver_id);
`);

db.exec(`
	CREATE INDEX IF NOT EXISTS idx_driver_vehicle_vehicle ON driver_vehicle_assignments(vehicle_id);
`);

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
	note?: string;
	entry_date: string;
	created_at?: string;
}
export interface OdometerReading {
	id: number;
	entry_date: string;
	odometer: number;
	previous_odometer: number | null;
	daily_difference: number | null;
	days_between: number | null;
	created_at?: string;
}

export interface DrivingLogEntry {
	id?: number;
	entry_date: string;
	driver: string;
	vehicle: string;
	start_time: string;
	end_time: string;
	start_odometer: number;
	end_odometer: number;
	total_driving_hours: number;
	total_working_hours: number;
	break_minutes: number;
	created_at?: string;
	updated_at?: string;
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

export class RecordService {
	static getAvailableYearsAndMonths() {
		throw new Error('Method not implemented.');
	}
	static async createRecord(record: Omit<Record, 'id' | 'created_at'>): Promise<number> {
		const stmt = db.prepare(`
      INSERT INTO records (loaded, collected, cutters, returned, missplaced, expense, expense_no_vat, odometer, image_path, note, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
			record.missplaced || 0,
			record.expense || 0,
			record.expense_no_vat || 0,
			record.odometer || 0,
			record.image_path || null,
			record.note || null,
			record.entry_date
		);

		return result.lastInsertRowid as number;
	}

	//----------------------------------------------------------------------------------- RECORD METHODS
	static async getAllRecords(): Promise<Record[]> {
		const stmt = db.prepare('SELECT * FROM records ORDER BY entry_date DESC, created_at DESC');
		return stmt.all() as Record[];
	}

	static async getLatestOdometer(): Promise<number | null> {
		const stmt = db.prepare(
			'SELECT odometer FROM records ORDER BY entry_date DESC, created_at DESC LIMIT 1'
		);
		const record = stmt.get() as Record | undefined;
		return record && typeof record.odometer === 'number' ? record.odometer : null;
	}

	static async getRecordById(id: number): Promise<Record | null> {
		const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
		return stmt.get(id) as Record | null;
	}

	static async getRecordWithVehicleUsageById(id: number): Promise<
		| (Record & {
				usage_mode?: 'standard' | 'no_used' | 'other';
				distance_manual?: number;
				purpose?: string;
		  })
		| null
	> {
		const stmt = db.prepare(`
			SELECT 
				r.*,
				v.usage_mode,
				v.distance_manual,
				v.purpose
			FROM records r 
			LEFT JOIN vehicle_usage_log v ON r.id = v.record_id OR (v.record_id IS NULL AND r.entry_date = v.entry_date)
			WHERE r.id = ?
		`);
		return stmt.get(id) as
			| (Record & {
					usage_mode?: 'standard' | 'no_used' | 'other';
					distance_manual?: number;
					purpose?: string;
			  })
			| null;
	}

	static async updateRecord(
		id: number,
		record: Partial<Omit<Record, 'id' | 'created_at'>>
	): Promise<Record> {
		const stmt = db.prepare(`
      UPDATE records 
      SET loaded = ?, collected = ?, cutters = ?, returned = ?, 
          missplaced = ?, expense = ?, expense_no_vat = ?, odometer = ?, image_path = ?, note = ?, entry_date = ?
      WHERE id = ?
    `);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
			record.missplaced || 0,
			record.expense || 0,
			record.expense_no_vat || 0,
			record.odometer || 0,
			record.image_path || null,
			record.note || null,
			record.entry_date,
			id
		);

		if (result.changes === 0) {
			throw new Error('Record not found');
		}

		// Return the updated record
		const updatedRecord = await this.getRecordById(id);
		if (!updatedRecord) {
			throw new Error('Failed to retrieve updated record');
		}

		return updatedRecord;
	}

	static async deleteRecord(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM records WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	static async getRecordsByDateRange(startDate: string, endDate: string): Promise<Record[]> {
		const stmt = db.prepare(`
      SELECT * FROM records 
      WHERE entry_date BETWEEN ? AND ? 
      ORDER BY entry_date DESC, created_at DESC
    `);
		return stmt.all(startDate, endDate) as Record[];
	}

	static async getRecordsByCurrentMonth() {
		const stmt = db.prepare(`
	  SELECT * FROM records
	  WHERE strftime('%Y-%m', entry_date) = strftime('%Y-%m', 'now')
	`);
		return stmt.all() as Record[];
	}

	static async getRecordsByCurrentYear() {
		const stmt = db.prepare(`
	  SELECT * FROM records
	  WHERE strftime('%Y', entry_date) = strftime('%Y', 'now')
	  ORDER BY entry_date DESC
	`);
		return stmt.all() as Record[];
	}

	static async getRecordsByMonth(year: number, month: number): Promise<Record[]> {
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
		return this.getRecordsByDateRange(startDate, endDate);
	}
	//----------------------------------------------------------------------------------- VEHICLE USAGE LOG
	static async createVehicleUsageLog(log: {
		entry_date: string;
		usage_mode: 'standard' | 'no_used' | 'other';
		vehicle_id?: number;
		odometer_end?: number;
		distance_manual?: number;
		purpose?: string;
		comment?: string;
		record_id?: number;
	}): Promise<number> {
		const stmt = db.prepare(`
		INSERT INTO vehicle_usage_log (
			entry_date, usage_mode, vehicle_id, odometer_end, distance_manual, purpose, comment, record_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`);

		const result = stmt.run(
			log.entry_date,
			log.usage_mode,
			log.vehicle_id || 1,
			log.odometer_end ?? null,
			log.distance_manual ?? 0,
			log.purpose || null,
			log.comment || null,
			log.record_id || null
		);

		return result.lastInsertRowid as number;
	}

	static async deleteVehicleUsageLogByDate(entry_date: string): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM vehicle_usage_log WHERE entry_date = ?');
		const result = stmt.run(entry_date);
		return result.changes > 0;
	}

	static async deleteVehicleUsageLogByRecordId(record_id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM vehicle_usage_log WHERE record_id = ?');
		const result = stmt.run(record_id);
		return result.changes > 0;
	}

	static async updateVehicleUsageLog(
		entry_date: string,
		log: {
			usage_mode: 'standard' | 'no_used' | 'other';
			vehicle_id?: number;
			odometer_end?: number;
			distance_manual?: number;
			purpose?: string;
			comment?: string;
		}
	): Promise<boolean> {
		const stmt = db.prepare(`
		UPDATE vehicle_usage_log 
		SET usage_mode = ?, vehicle_id = ?, odometer_end = ?, distance_manual = ?, purpose = ?, comment = ?
		WHERE entry_date = ?
	`);

		const result = stmt.run(
			log.usage_mode,
			log.vehicle_id || 1,
			log.odometer_end ?? null,
			log.distance_manual ?? 0,
			log.purpose || null,
			log.comment || null,
			entry_date
		);

		return result.changes > 0;
	}

	static async getVehicleUsageLogByDate(entry_date: string): Promise<{
		id: number;
		entry_date: string;
		usage_mode: 'standard' | 'no_used' | 'other';
		vehicle_id: number;
		odometer_end: number | null;
		distance_manual: number;
		purpose: string | null;
		comment: string | null;
		created_at: string;
	} | null> {
		const stmt = db.prepare('SELECT * FROM vehicle_usage_log WHERE entry_date = ? LIMIT 1');
		const result = stmt.get(entry_date);
		return result
			? (result as {
					id: number;
					entry_date: string;
					usage_mode: 'standard' | 'no_used' | 'other';
					vehicle_id: number;
					odometer_end: number | null;
					distance_manual: number;
					purpose: string | null;
					comment: string | null;
					created_at: string;
				})
			: null;
	}

	//----------------------------------------------------------------------------------- DRIVING LOG METHODS
	static async createDrivingLogEntry(
		entry: Omit<DrivingLogEntry, 'id' | 'created_at' | 'updated_at'>
	): Promise<number> {
		const stmt = db.prepare(`
			INSERT INTO driving_log_entries (
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
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const result = stmt.run(
			entry.entry_date,
			entry.driver,
			entry.vehicle,
			entry.start_time,
			entry.end_time,
			entry.start_odometer,
			entry.end_odometer,
			entry.total_driving_hours ?? 0,
			entry.total_working_hours ?? 0,
			entry.break_minutes ?? 0
		);

		return result.lastInsertRowid as number;
	}

	static async updateDrivingLogEntry(
		id: number,
		entry: Omit<DrivingLogEntry, 'id' | 'created_at' | 'updated_at'>
	): Promise<DrivingLogEntry> {
		const stmt = db.prepare(`
			UPDATE driving_log_entries
			SET entry_date = ?,
				driver = ?,
				vehicle = ?,
				start_time = ?,
				end_time = ?,
				start_odometer = ?,
				end_odometer = ?,
				total_driving_hours = ?,
				total_working_hours = ?,
				break_minutes = ?,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);

		const result = stmt.run(
			entry.entry_date,
			entry.driver,
			entry.vehicle,
			entry.start_time,
			entry.end_time,
			entry.start_odometer,
			entry.end_odometer,
			entry.total_driving_hours ?? 0,
			entry.total_working_hours ?? 0,
			entry.break_minutes ?? 0,
			id
		);

		if (result.changes === 0) {
			throw new Error('Driving log entry not found');
		}

		const updatedEntry = await this.getDrivingLogEntryById(id);
		if (!updatedEntry) {
			throw new Error('Failed to retrieve updated driving log entry');
		}

		return updatedEntry;
	}

	static async deleteDrivingLogEntry(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM driving_log_entries WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	static async getDrivingLogEntryById(id: number): Promise<DrivingLogEntry | null> {
		const stmt = db.prepare('SELECT * FROM driving_log_entries WHERE id = ?');
		const entry = stmt.get(id);
		return entry ? (entry as DrivingLogEntry) : null;
	}

	static async getDrivingLogEntries(filters?: {
		startDate?: string;
		endDate?: string;
		driver?: string;
		vehicle?: string;
	}): Promise<DrivingLogEntry[]> {
		let query = 'SELECT * FROM driving_log_entries WHERE 1=1';
		const params: (string | number)[] = [];

		if (filters?.startDate) {
			query += ' AND entry_date >= ?';
			params.push(filters.startDate);
		}

		if (filters?.endDate) {
			query += ' AND entry_date <= ?';
			params.push(filters.endDate);
		}

		if (filters?.driver) {
			query += ' AND driver = ?';
			params.push(filters.driver);
		}

		if (filters?.vehicle) {
			query += ' AND vehicle = ?';
			params.push(filters.vehicle);
		}

		query += ' ORDER BY entry_date DESC, start_time ASC';
		const stmt = db.prepare(query);
		return stmt.all(...params) as DrivingLogEntry[];
	}

	static async getDrivingLogDistinctValues(): Promise<{
		drivers: string[];
		vehicles: string[];
	}> {
		const driverRows = db
			.prepare(
				`
				SELECT DISTINCT driver
				FROM driving_log_entries
				WHERE driver IS NOT NULL AND TRIM(driver) != ''
				ORDER BY driver COLLATE NOCASE
			`
			)
			.all() as { driver: string }[];

		const vehicleRows = db
			.prepare(
				`
				SELECT DISTINCT vehicle
				FROM driving_log_entries
				WHERE vehicle IS NOT NULL AND TRIM(vehicle) != ''
				ORDER BY vehicle COLLATE NOCASE
			`
			)
			.all() as { vehicle: string }[];

		return {
			drivers: driverRows.map((row) => row.driver),
			vehicles: vehicleRows.map((row) => row.vehicle)
		};
	}

	static calculateDrivingLogSummary(entries: DrivingLogEntry[]): {
		totalDrivingHours: number;
		totalWorkingHours: number;
		totalBreakMinutes: number;
		totalDistance: number;
	} {
		return entries.reduce(
			(acc, entry) => {
				const distance = (entry.end_odometer ?? 0) - (entry.start_odometer ?? 0);
				return {
					totalDrivingHours: acc.totalDrivingHours + (entry.total_driving_hours ?? 0),
					totalWorkingHours: acc.totalWorkingHours + (entry.total_working_hours ?? 0),
					totalBreakMinutes: acc.totalBreakMinutes + (entry.break_minutes ?? 0),
					totalDistance: acc.totalDistance + Math.max(distance, 0)
				};
			},
			{ totalDrivingHours: 0, totalWorkingHours: 0, totalBreakMinutes: 0, totalDistance: 0 }
		);
	}
	//----------------------------------------------------------------------------------- ODOMETER METHODS

	/**
	 * Get odometer readings with daily differences for a specific month
	 * This version correctly handles cross-month boundaries for the first record
	 * @param year - Year (e.g., 2025)
	 * @param month - Month (1-12)
	 * @returns Array of odometer readings with calculated differences
	 */
	static async getOdometerDifferencesByMonth(
		year: number,
		month: number
	): Promise<OdometerReading[]> {
		const stmt = db.prepare(`
			WITH all_readings AS (
				-- Get all readings with their previous reading (across all months)
				SELECT 
					id,
					entry_date,
					odometer,
					LAG(odometer) OVER (ORDER BY entry_date, created_at) AS previous_odometer,
					LAG(entry_date) OVER (ORDER BY entry_date, created_at) AS previous_date
				FROM records 
				WHERE odometer > 0
				ORDER BY entry_date, created_at
			),
			filtered_readings AS (
				-- Filter to get only the target month readings
				SELECT *
				FROM all_readings
				WHERE strftime('%Y', entry_date) = ? 
					AND strftime('%m', entry_date) = ?
			)
			SELECT 
				id,
				entry_date,
				odometer,
				previous_odometer,
				CASE 
					WHEN previous_odometer IS NOT NULL 
					THEN odometer - previous_odometer 
					ELSE NULL 
				END AS daily_difference,
				CASE 
					WHEN previous_date IS NOT NULL 
					THEN julianday(entry_date) - julianday(previous_date)
					ELSE NULL 
				END AS days_between
			FROM filtered_readings
			ORDER BY entry_date, id
		`);

		const yearStr = year.toString();
		const monthStr = String(month).padStart(2, '0');

		return stmt.all(yearStr, monthStr) as OdometerReading[];
	}

	/**
	 * Get odometer readings with daily differences for current month
	 * @returns Array of odometer readings with calculated differences
	 */
	static async getOdometerDifferencesCurrentMonth(): Promise<OdometerReading[]> {
		const now = new Date();
		return this.getOdometerDifferencesByMonth(now.getFullYear(), now.getMonth() + 1);
	}

	/**
	 * Alternative method: Get odometer readings for a month with explicit previous month context
	 * This version shows the previous reading even if it's from a different month
	 * @param year - Year (e.g., 2025)
	 * @param month - Month (1-12)
	 * @returns Array of odometer readings with calculated differences
	 */
	static async getOdometerDifferencesWithContext(
		year: number,
		month: number
	): Promise<OdometerReading[]> {
		const stmt = db.prepare(`
			WITH target_month_readings AS (
				-- Get readings for the target month
				SELECT 
					id,
					entry_date,
					odometer
				FROM records 
				WHERE strftime('%Y', entry_date) = ? 
					AND strftime('%m', entry_date) = ?
					AND odometer > 0
				ORDER BY entry_date, created_at
			),
			previous_reading AS (
				-- Get the last reading from before the target month
				SELECT 
					odometer as previous_odometer,
					entry_date as previous_date
				FROM records 
				WHERE entry_date < (
					SELECT MIN(entry_date) 
					FROM target_month_readings
				)
				AND odometer > 0
				ORDER BY entry_date DESC, created_at DESC
				LIMIT 1
			),
			readings_with_previous AS (
				SELECT 
					tmr.id,
					tmr.entry_date,
					tmr.odometer,
					CASE 
						WHEN ROW_NUMBER() OVER (ORDER BY tmr.entry_date, tmr.id) = 1 
						THEN pr.previous_odometer
						ELSE LAG(tmr.odometer) OVER (ORDER BY tmr.entry_date, tmr.id)
					END AS previous_odometer,
					CASE 
						WHEN ROW_NUMBER() OVER (ORDER BY tmr.entry_date, tmr.id) = 1 
						THEN pr.previous_date
						ELSE LAG(tmr.entry_date) OVER (ORDER BY tmr.entry_date, tmr.id)
					END AS previous_date
				FROM target_month_readings tmr
				CROSS JOIN previous_reading pr
			)
			SELECT 
				id,
				entry_date,
				odometer,
				previous_odometer,
				CASE 
					WHEN previous_odometer IS NOT NULL 
					THEN odometer - previous_odometer 
					ELSE NULL 
				END AS daily_difference,
				CASE 
					WHEN previous_date IS NOT NULL 
					THEN julianday(entry_date) - julianday(previous_date)
					ELSE NULL 
				END AS days_between
			FROM readings_with_previous
			ORDER BY entry_date, id
		`);

		const yearStr = year.toString();
		const monthStr = String(month).padStart(2, '0');

		return stmt.all(yearStr, monthStr) as OdometerReading[];
	}

	/**
	 * Get total distance traveled in a specific month (accounting for cross-month boundaries)
	 * @param year - Year (e.g., 2025)
	 * @param month - Month (1-12)
	 * @returns Total distance traveled in the month
	 */
	static async getTotalDistanceByMonth(year: number, month: number): Promise<number> {
		const readings = await this.getOdometerDifferencesByMonth(year, month);
		return readings
			.filter((reading) => reading.daily_difference !== null && reading.daily_difference > 0)
			.reduce((total, reading) => total + (reading.daily_difference || 0), 0);
	}

	/**
	 * Get odometer statistics for a specific month (with proper cross-month calculation)
	 * @param year - Year (e.g., 2025)
	 * @param month - Month (1-12)
	 * @returns Object with odometer statistics
	 */
	static async getOdometerStatsByMonth(year: number, month: number) {
		const readings = await this.getOdometerDifferencesByMonth(year, month);
		const validDifferences = readings
			.map((r) => r.daily_difference)
			.filter((diff): diff is number => diff !== null && diff > 0);

		const totalDistance = validDifferences.reduce((sum, diff) => sum + diff, 0);
		const averageDaily = validDifferences.length > 0 ? totalDistance / validDifferences.length : 0;
		const maxDaily = validDifferences.length > 0 ? Math.max(...validDifferences) : 0;
		const minDaily = validDifferences.length > 0 ? Math.min(...validDifferences) : 0;

		const firstReading = readings.find((r) => r.odometer > 0);
		const lastReading = readings
			.slice()
			.reverse()
			.find((r) => r.odometer > 0);

		// Calculate the starting odometer for the month (could be from previous month)
		const startOdometer = firstReading?.previous_odometer || firstReading?.odometer || 0;
		const endOdometer = lastReading?.odometer || 0;

		return {
			totalDistance,
			averageDaily,
			maxDaily,
			minDaily,
			daysWithReadings: validDifferences.length,
			startOdometer,
			endOdometer,
			totalReadings: readings.length
		};
	}

	/**
	 * Get a summary view that shows month boundaries clearly
	 * @param year - Year (e.g., 2025)
	 * @param month - Month (1-12)
	 * @returns Object with month summary and boundary information
	 */
	static async getMonthSummaryWithBoundaries(year: number, month: number) {
		const readings = await this.getOdometerDifferencesByMonth(year, month);

		if (readings.length === 0) {
			return {
				monthReadings: readings,
				summary: {
					totalDistance: 0,
					firstReading: null,
					lastReading: null,
					previousMonthLastReading: null,
					crossMonthDistance: 0
				}
			};
		}

		const firstReading = readings[0];
		const lastReading = readings[readings.length - 1];

		// Get the last reading from the previous month
		const prevMonthStmt = db.prepare(`
			SELECT odometer, entry_date 
			FROM records 
			WHERE entry_date < ? 
				AND odometer > 0 
			ORDER BY entry_date DESC, created_at DESC 
			LIMIT 1
		`);

		const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
		const previousMonthLastReading = prevMonthStmt.get(startOfMonth) as
			| { odometer: number; entry_date: string }
			| undefined;

		// Calculate cross-month distance (distance from last reading of previous month to first reading of this month)
		const crossMonthDistance =
			previousMonthLastReading && firstReading
				? firstReading.odometer - previousMonthLastReading.odometer
				: 0;

		const totalDistance = readings
			.filter((r) => r.daily_difference !== null && r.daily_difference > 0)
			.reduce((sum, r) => sum + (r.daily_difference || 0), 0);

		return {
			monthReadings: readings,
			summary: {
				totalDistance,
				firstReading: firstReading
					? {
							date: firstReading.entry_date,
							odometer: firstReading.odometer,
							previousOdometer: firstReading.previous_odometer
						}
					: null,
				lastReading: lastReading
					? {
							date: lastReading.entry_date,
							odometer: lastReading.odometer
						}
					: null,
				previousMonthLastReading: previousMonthLastReading
					? {
							date: previousMonthLastReading.entry_date,
							odometer: previousMonthLastReading.odometer
						}
					: null,
				crossMonthDistance
			}
		};
	}

	//----------------------------------------------------------------------------------- INVOICE METHODS
	// get monthly sum of delibered ond collected parcels for invoice

	// static async getMonthlyInvoiceData(year: number, month: number): Promise<{
	// 	delivered: number;
	// 	collected: number;
	// }> {
	// 	const monthKey = `${year}-${String(month).padStart(2, '0')}`;

	// 	const deliveredRow = db
	// 	.prepare(
	// 		`
	// 		SELECT SUM(amount) as total
	// 		FROM invoices
	// 		WHERE status = 'delivered'
	// 		AND strftime('%Y-%m', created_at) = ?
	// 		`
	// 	)
	// 	.get(monthKey);

	// 	const collectedRow = db
	// 	.prepare(
	// 		`
	// 		SELECT SUM(amount) as total
	// 		FROM invoices
	// 		WHERE status = 'collected'
	// 		AND strftime('%Y-%m', created_at) = ?
	// 		`
	// 	)
	// 	.get(monthKey);

	// 	return {
	// 		delivered: (deliveredRow as { total: number | null } | undefined)?.total || 0,
	// 		collected: (collectedRow as { total: number | null } | undefined)?.total || 0
	// 	};
	// }

	//----------------------------------------------------------------------------------- MIGRATION METHODS
	static async migrateExistingRecords(): Promise<void> {
		try {
			const columns = db.prepare('PRAGMA table_info(records)').all() as { name: string }[];
			const hasEntryDate = columns.some((col) => col.name === 'entry_date');
			const hasMissplaced = columns.some((col: { name: string }) => col.name === 'missplaced');
			const hasExpense = columns.some((col: { name: string }) => col.name === 'expense');
			const hasExpenseNoVat = columns.some(
				(col: { name: string }) => col.name === 'expense_no_vat'
			);
			const hasOdometer = columns.some((col: { name: string }) => col.name === 'odometer');
			const hasNote = columns.some((col: { name: string }) => col.name === 'note');

			if (!hasEntryDate) {
				db.exec('ALTER TABLE records ADD COLUMN entry_date DATE');
				db.exec(`UPDATE records SET entry_date = DATE(created_at) WHERE entry_date IS NULL`);
				console.log('Added entry_date column and migrated existing records');
			}

			if (!hasMissplaced) {
				db.exec('ALTER TABLE records ADD COLUMN missplaced INTEGER DEFAULT 0');
				console.log('Added missplaced column');
			}

			if (!hasExpense) {
				db.exec('ALTER TABLE records ADD COLUMN expense REAL DEFAULT 0');
				console.log('Added expense column');
			}

			if (!hasExpenseNoVat) {
				db.exec('ALTER TABLE records ADD COLUMN expense_no_vat REAL DEFAULT 0');
				console.log('Added expense_no_vat column');
			}

			// Ensure odometer column exists
			if (!hasOdometer) {
				db.exec('ALTER TABLE records ADD COLUMN odometer INTEGER DEFAULT 0');
				console.log('Added odometer column');
			}
			if (!hasNote) {
				db.exec('ALTER TABLE records ADD COLUMN note TEXT');
				console.log('Added note column');
			}
			// Ensure vehicle_usage_log table exists
			const vehicleLogTable = db
				.prepare(
					`
  SELECT name FROM sqlite_master WHERE type='table' AND name='vehicle_usage_log'
`
				)
				.get();

			if (!vehicleLogTable) {
				db.exec(`
    CREATE TABLE vehicle_usage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date DATE NOT NULL,
      usage_mode TEXT NOT NULL CHECK (usage_mode IN ('standard', 'no_used', 'other')),
      vehicle_id INTEGER DEFAULT 1,
      odometer_end INTEGER,
      distance_manual INTEGER DEFAULT 0,
      purpose TEXT,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
				console.log('Created vehicle_usage_log table');
			}

			const drivingLogTable = db
				.prepare(
					`
	  SELECT name FROM sqlite_master WHERE type='table' AND name='driving_log_entries'
	`
				)
				.get();

			if (!drivingLogTable) {
				db.exec(`
			CREATE TABLE driving_log_entries (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				entry_date DATE NOT NULL,
				driver TEXT NOT NULL,
				vehicle TEXT NOT NULL,
				start_time TEXT NOT NULL,
				end_time TEXT NOT NULL,
				start_odometer INTEGER NOT NULL,
				end_odometer INTEGER NOT NULL,
				total_driving_hours REAL DEFAULT 0,
				total_working_hours REAL DEFAULT 0,
				break_minutes INTEGER DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);
		`);
				console.log('Created driving_log_entries table');
			}
		} catch (error) {
			console.error('Migration error:', error);
		}
	}

	//----------------------------------------------------------------------------------- DRIVER METHODS
	static async getAllDrivers(): Promise<Driver[]> {
		const stmt = db.prepare('SELECT * FROM drivers ORDER BY full_name ASC');
		return stmt.all() as Driver[];
	}

	static async getDriverById(id: number): Promise<Driver | null> {
		const stmt = db.prepare('SELECT * FROM drivers WHERE id = ?');
		return (stmt.get(id) as Driver) || null;
	}

	static async createDriver(
		driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>
	): Promise<number> {
		const stmt = db.prepare(`
			INSERT INTO drivers (full_name, date_of_birth, address, driver_license_number, driver_license_image_path, email, phone)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);

		const result = stmt.run(
			driver.full_name,
			driver.date_of_birth,
			driver.address,
			driver.driver_license_number,
			driver.driver_license_image_path || null,
			driver.email || null,
			driver.phone || null
		);

		return result.lastInsertRowid as number;
	}

	static async updateDriver(
		id: number,
		driver: Partial<Omit<Driver, 'id' | 'created_at' | 'updated_at'>>
	): Promise<boolean> {
		const updates: string[] = [];
		const values: unknown[] = [];

		if (driver.full_name !== undefined) {
			updates.push('full_name = ?');
			values.push(driver.full_name);
		}
		if (driver.date_of_birth !== undefined) {
			updates.push('date_of_birth = ?');
			values.push(driver.date_of_birth);
		}
		if (driver.address !== undefined) {
			updates.push('address = ?');
			values.push(driver.address);
		}
		if (driver.driver_license_number !== undefined) {
			updates.push('driver_license_number = ?');
			values.push(driver.driver_license_number);
		}
		if (driver.driver_license_image_path !== undefined) {
			updates.push('driver_license_image_path = ?');
			values.push(driver.driver_license_image_path);
		}
		if (driver.email !== undefined) {
			updates.push('email = ?');
			values.push(driver.email);
		}
		if (driver.phone !== undefined) {
			updates.push('phone = ?');
			values.push(driver.phone);
		}

		if (updates.length === 0) return false;

		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		const stmt = db.prepare(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`);
		const result = stmt.run(...values);

		return result.changes > 0;
	}

	static async deleteDriver(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM drivers WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	//----------------------------------------------------------------------------------- VEHICLE METHODS
	static async getAllVehicles(): Promise<Vehicle[]> {
		const stmt = db.prepare('SELECT * FROM vehicles ORDER BY make, model ASC');
		return stmt.all() as Vehicle[];
	}

	static async getVehicleById(id: number): Promise<Vehicle | null> {
		const stmt = db.prepare('SELECT * FROM vehicles WHERE id = ?');
		return (stmt.get(id) as Vehicle) || null;
	}

	static async createVehicle(
		vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
	): Promise<number> {
		const stmt = db.prepare(`
			INSERT INTO vehicles (make, model, type, registration_number, color, initial_mileage, current_mileage, year, vin)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const result = stmt.run(
			vehicle.make,
			vehicle.model,
			vehicle.type,
			vehicle.registration_number,
			vehicle.color,
			vehicle.initial_mileage,
			vehicle.current_mileage,
			vehicle.year || null,
			vehicle.vin || null
		);

		return result.lastInsertRowid as number;
	}

	static async updateVehicle(
		id: number,
		vehicle: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>
	): Promise<boolean> {
		const updates: string[] = [];
		const values: unknown[] = [];

		if (vehicle.make !== undefined) {
			updates.push('make = ?');
			values.push(vehicle.make);
		}
		if (vehicle.model !== undefined) {
			updates.push('model = ?');
			values.push(vehicle.model);
		}
		if (vehicle.type !== undefined) {
			updates.push('type = ?');
			values.push(vehicle.type);
		}
		if (vehicle.registration_number !== undefined) {
			updates.push('registration_number = ?');
			values.push(vehicle.registration_number);
		}
		if (vehicle.color !== undefined) {
			updates.push('color = ?');
			values.push(vehicle.color);
		}
		if (vehicle.initial_mileage !== undefined) {
			updates.push('initial_mileage = ?');
			values.push(vehicle.initial_mileage);
		}
		if (vehicle.current_mileage !== undefined) {
			updates.push('current_mileage = ?');
			values.push(vehicle.current_mileage);
		}
		if (vehicle.year !== undefined) {
			updates.push('year = ?');
			values.push(vehicle.year);
		}
		if (vehicle.vin !== undefined) {
			updates.push('vin = ?');
			values.push(vehicle.vin);
		}

		if (updates.length === 0) return false;

		updates.push('updated_at = CURRENT_TIMESTAMP');
		values.push(id);

		const stmt = db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`);
		const result = stmt.run(...values);

		return result.changes > 0;
	}

	static async deleteVehicle(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM vehicles WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	//----------------------------------------------------------------------------------- DRIVER-VEHICLE ASSIGNMENT METHODS
	static async assignDriverToVehicle(driverId: number, vehicleId: number): Promise<number> {
		const stmt = db.prepare(`
			INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id)
			VALUES (?, ?)
			ON CONFLICT(driver_id, vehicle_id) DO NOTHING
		`);

		const result = stmt.run(driverId, vehicleId);
		return result.lastInsertRowid as number;
	}

	static async unassignDriverFromVehicle(driverId: number, vehicleId: number): Promise<boolean> {
		const stmt = db.prepare(
			'DELETE FROM driver_vehicle_assignments WHERE driver_id = ? AND vehicle_id = ?'
		);
		const result = stmt.run(driverId, vehicleId);
		return result.changes > 0;
	}

	static async getVehiclesForDriver(driverId: number): Promise<Vehicle[]> {
		const stmt = db.prepare(`
			SELECT v.* FROM vehicles v
			INNER JOIN driver_vehicle_assignments dva ON v.id = dva.vehicle_id
			WHERE dva.driver_id = ?
			ORDER BY v.make, v.model ASC
		`);
		return stmt.all(driverId) as Vehicle[];
	}

	static async getDriversForVehicle(vehicleId: number): Promise<Driver[]> {
		const stmt = db.prepare(`
			SELECT d.* FROM drivers d
			INNER JOIN driver_vehicle_assignments dva ON d.id = dva.driver_id
			WHERE dva.vehicle_id = ?
			ORDER BY d.full_name ASC
		`);
		return stmt.all(vehicleId) as Driver[];
	}

	static async deleteAllRecords(): Promise<number> {
		const stmt = db.prepare('DELETE FROM records');
		const result = stmt.run();
		return result.changes;
	}

	static async resetAutoIncrement(): Promise<void> {
		db.exec("DELETE FROM sqlite_sequence WHERE name='records'");
	}

	static async clearAllData(): Promise<void> {
		await this.deleteAllRecords();
		await this.resetAutoIncrement();
	}
}

// Run migration on startup
RecordService.migrateExistingRecords();

// Ensure static/images directory exists
const imagesDir = path.join(process.cwd(), 'static', 'images');
if (!fs.existsSync(imagesDir)) {
	fs.mkdirSync(imagesDir, { recursive: true });
}

export default db;
