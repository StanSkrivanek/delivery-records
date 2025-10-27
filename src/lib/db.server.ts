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
		} catch (error) {
			console.error('Migration error:', error);
		}
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
