import Database from 'better-sqlite3';
import { dev } from '$app/environment';
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
    image_path TEXT,
    entry_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Record {
	id?: number;
	loaded: number;
	collected: number;
	cutters: number;
	returned: number;
	missplaced?: number;
	expense?: number;
	image_path?: string;
	entry_date: string;
	created_at?: string;
}

export class RecordService {
	static async createRecord(record: Omit<Record, 'id' | 'created_at'>): Promise<number> {
		const stmt = db.prepare(`
      INSERT INTO records (loaded, collected, cutters, returned, missplaced, expense, image_path, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
			record.missplaced || 0,
			record.expense || 0,
			record.image_path || null,
			record.entry_date
		);

		return result.lastInsertRowid as number;
	}

	static async getAllRecords(): Promise<Record[]> {
		const stmt = db.prepare('SELECT * FROM records ORDER BY entry_date DESC, created_at DESC');
		return stmt.all() as Record[];
	}

	static async getRecordById(id: number): Promise<Record | null> {
		const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
		return stmt.get(id) as Record | null;
	}

	static async updateRecord(
		id: number,
		record: Partial<Omit<Record, 'id' | 'created_at'>>
	): Promise<Record> {
		const stmt = db.prepare(`
      UPDATE records 
      SET loaded = ?, collected = ?, cutters = ?, returned = ?, 
          missplaced = ?, expense = ?, image_path = ?, entry_date = ?
      WHERE id = ?
    `);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
			record.missplaced || 0,
			record.expense || 0,
			record.image_path || null,
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

	static async getRecordsByMonth(year: number, month: number): Promise<Record[]> {
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
		return this.getRecordsByDateRange(startDate, endDate);
	}

	// Migration functions
	static async migrateExistingRecords(): Promise<void> {
		try {
			const columns = db.prepare('PRAGMA table_info(records)').all() as { name: string }[];
			const hasEntryDate = columns.some((col) => col.name === 'entry_date');
			const hasMissplaced = columns.some((col: { name: string }) => col.name === 'missplaced');
			const hasExpense = columns.some((col: { name: string }) => col.name === 'expense');

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

// import { dev } from '$app/environment';
// import Database from 'better-sqlite3';
// import fs from 'fs';
// import path from 'path';

// const dbPath = dev ? 'database.db' : './database.db';
// const db = new Database(dbPath);

// // Initialize database schema with custom date support
// db.exec(`
//   CREATE TABLE IF NOT EXISTS records (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     loaded INTEGER NOT NULL,
//     collected INTEGER NOT NULL,
//     cutters INTEGER NOT NULL,
//     returned INTEGER NOT NULL,
// 	missplaced INTEGER DEFAULT 0,
// 	expense INTEGER DEFAULT 0,
//     image_path TEXT,
//     entry_date DATE NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   )
// `);

// export interface Record {
// 	id?: number;
// 	loaded: number;
// 	collected: number;
// 	cutters: number;
// 	returned: number;
// 	missplaced?: number;
// 	expense?: number;
// 	image_path?: string;
// 	entry_date: string;
// 	created_at?: string;
// }

// export class RecordService {
// 	static async createRecord(record: Omit<Record, 'id' | 'created_at'>): Promise<number> {
// 		const stmt = db.prepare(`
//       INSERT INTO records (loaded, collected, cutters, returned, missplaced, expense, image_path, entry_date)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ? )
//     `);

// 		const result = stmt.run(
// 			record.loaded,
// 			record.collected,
// 			record.cutters,
// 			record.returned,
// 			record.missplaced || 0, // Default to 0 if not provided
// 			record.expense || 0,
// 			record.image_path || null,
// 			record.entry_date
// 		);

// 		return result.lastInsertRowid as number;
// 	}

// 	static async getAllRecords(): Promise<Record[]> {
// 		const stmt = db.prepare('SELECT * FROM records ORDER BY entry_date DESC, created_at DESC');
// 		return stmt.all() as Record[];
// 	}

// 	static async getRecordById(id: number): Promise<Record | null> {
// 		const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
// 		return stmt.get(id) as Record | null;
// 	}

// 	static async getRecordsByDateRange(startDate: string, endDate: string): Promise<Record[]> {
// 		const stmt = db.prepare(`
//       SELECT * FROM records
//       WHERE entry_date BETWEEN ? AND ?
//       ORDER BY entry_date DESC, created_at DESC
//     `);
// 		return stmt.all(startDate, endDate) as Record[];
// 	}

// 	static async getRecordsByMonth(year: number, month: number): Promise<Record[]> {
// 		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
// 		const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
// 		return this.getRecordsByDateRange(startDate, endDate);
// 	}

// 	static async updateRecord(
// 		id: number,
// 		record: Partial<Omit<Record, 'id' | 'created_at'>>
// 	): Promise<Record> {
// 		const stmt = db.prepare(`
//       UPDATE records
//       SET loaded = ?, collected = ?, cutters = ?, returned = ?,
//           missplaced = ?, expense = ?, image_path = ?, entry_date = ?
//       WHERE id = ?
//     `);

// 		const result = stmt.run(
// 			record.loaded,
// 			record.collected,
// 			record.cutters,
// 			record.returned,
// 			record.missplaced || 0,
// 			record.expense || 0,
// 			record.image_path || null,
// 			record.entry_date,
// 			id
// 		);

// 		if (result.changes === 0) {
// 			throw new Error('Record not found');
// 		}

// 		// Return the updated record
// 		const updatedRecord = await this.getRecordById(id);
// 		if (!updatedRecord) {
// 			throw new Error('Failed to retrieve updated record');
// 		}

// 		return updatedRecord;
// 	}
// 	// static async updateRecord(
// 	// 	id: number,
// 	// 	data: Partial<Omit<Record, 'id' | 'date_created'>>
// 	// ): Promise<boolean> {
// 	// 	const stmt = db.prepare(`
// 	// 			UPDATE records
// 	// 			SET loaded = ?, collected = ?, cutters = ?, returned = ?, missplaced = ?, expense = ?, image_path = ?, entry_date = ?
// 	// 			WHERE id = ?
// 	// 		`);
// 	// 	const result = stmt.run(
// 	// 		data.loaded?.toString(),
// 	// 		data.collected?.toString(),
// 	// 		data.cutters?.toString(),
// 	// 		data.returned?.toString(),
// 	// 		data.missplaced?.toString(),
// 	// 		data.expense?.toString(),
// 	// 		data.image_path ?? null, // ensure null if not present
// 	// 		data.entry_date ?? null,
// 	// 		id
// 	// 	);
// 	// 	return result.changes > 0;
// 	// }
// 	static async deleteRecord(id: number): Promise<boolean> {
// 		const stmt = db.prepare('DELETE FROM records WHERE id = ?');
// 		const result = stmt.run(id);
// 		return result.changes > 0;
// 	}

// 	// Migration function to add entry_date column to existing records
// 	static async migrateExistingRecords(): Promise<void> {
// 		try {
// 			// Check if entry_date column exists
// 			const columns = db.prepare('PRAGMA table_info(records)').all() as { name: string }[];
// 			const hasEntryDate = columns.some((col) => col.name === 'entry_date');

// 			if (!hasEntryDate) {
// 				// Add the column
// 				db.exec('ALTER TABLE records ADD COLUMN entry_date DATE');

// 				// Update existing records to use created_at date for entry_date
// 				db.exec(`
//           UPDATE records
//           SET entry_date = DATE(created_at)
//           WHERE entry_date IS NULL
//         `);

// 				// console.log('Successfully migrated existing records with entry_date');
// 			}
// 		} catch (error) {
// 			console.error('Migration error:', error);
// 		}
// 	}
// }

// // Run migration on startup
// RecordService.migrateExistingRecords();

// // Ensure static/images directory exists
// const imagesDir = path.join(process.cwd(), 'static', 'images');
// if (!fs.existsSync(imagesDir)) {
// 	fs.mkdirSync(imagesDir, { recursive: true });
// }

// export default db;
