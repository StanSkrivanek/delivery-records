import { dev } from '$app/environment';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = dev ? 'database.db' : './database.db';
const db = new Database(dbPath);

// Initialize database schema with custom date support
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loaded INTEGER NOT NULL,
    collected INTEGER NOT NULL,
    cutters INTEGER NOT NULL,
    returned INTEGER NOT NULL,
	expense INTEGER DEFAULT 0,
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
	expense?: number;
	image_path?: string;
	entry_date: string;
	created_at?: string;
}

export class RecordService {
	static async createRecord(record: Omit<Record, 'id' | 'created_at'>): Promise<number> {
		const stmt = db.prepare(`
      INSERT INTO records (loaded, collected, cutters, returned, expense, image_path, entry_date)
      VALUES (?, ?, ?, ?, ?, ?, ? )
    `);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
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
	static async updateRecord(
		id: number,
		data: Partial<Omit<Record, 'id' | 'date_created'>>
	): Promise<boolean> {
		const stmt = db.prepare(`
				UPDATE records
				SET loaded = ?, collected = ?, cutters = ?, returned = ?, image_path = ?
				WHERE id = ?
			`);
		const result = stmt.run(
			data.loaded?.toString(),
			data.collected?.toString(),
			data.cutters?.toString(),
			data.returned?.toString(),
			data.expense?.toString(),
			data.image_path ?? null, // ensure null if not present
			id
		);
		return result.changes > 0;
	}
	static async deleteRecord(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM records WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}

	// Migration function to add entry_date column to existing records
	static async migrateExistingRecords(): Promise<void> {
		try {
			// Check if entry_date column exists
			const columns = db.prepare('PRAGMA table_info(records)').all() as { name: string }[];
			const hasEntryDate = columns.some((col) => col.name === 'entry_date');

			if (!hasEntryDate) {
				// Add the column
				db.exec('ALTER TABLE records ADD COLUMN entry_date DATE');

				// Update existing records to use created_at date for entry_date
				db.exec(`
          UPDATE records 
          SET entry_date = DATE(created_at) 
          WHERE entry_date IS NULL
        `);

				console.log('Successfully migrated existing records with entry_date');
			}
		} catch (error) {
			console.error('Migration error:', error);
		}
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

//  --------------------------------------------------------------------------------------
// import { dev } from '$app/environment';
// import Database from 'better-sqlite3';
// import fs from 'fs';
// import path from 'path';

// const dbPath = dev ? 'database.db' : './database.db';
// const db = new Database(dbPath);

// // --- Migration: convert numeric columns to TEXT if needed ---
// interface TableColumn {
// 	name: string;
// 	type: string;
// 	[key: string]: string | number | boolean | null;
// }
// const tableInfo = db.prepare('PRAGMA table_info(records)').all() as TableColumn[];
// const needsMigration = tableInfo.some(
// 	(col) => ['loaded', 'collected', 'cutters', 'returned'].includes(col.name) && col.type !== 'TEXT'
// );

// if (needsMigration) {
// 	db.transaction(() => {
// 		// Rename old table
// 		db.exec(`ALTER TABLE records RENAME TO records_old`);
// 		// Create new table with TEXT columns
// 		db.exec(`
// 			CREATE TABLE records (
// 				id INTEGER PRIMARY KEY AUTOINCREMENT,
// 				loaded TEXT NOT NULL,
// 				collected TEXT NOT NULL,
// 				cutters TEXT NOT NULL,
// 				returned TEXT NOT NULL,
// 				image_path TEXT,
// 				date_created DATETIME DEFAULT CURRENT_TIMESTAMP
// 			)
// 		`);
// 		// Copy data, casting numbers to strings
// 		db.exec(`
// 			INSERT INTO records (id, loaded, collected, cutters, returned, image_path, date_created)
// 			SELECT id, CAST(loaded AS TEXT), CAST(collected AS TEXT), CAST(cutters AS TEXT), CAST(returned AS TEXT), image_path, date_created
// 			FROM records_old
// 		`);
// 		// Drop old table
// 		db.exec(`DROP TABLE records_old`);
// 	})();
// }

// // Initialize database schema
// db.exec(`
//   CREATE TABLE IF NOT EXISTS records (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     loaded TEXT NOT NULL,
//     collected TEXT NOT NULL,
//     cutters TEXT NOT NULL,
//     returned TEXT NOT NULL,
//     image_path TEXT,
//     date_created DATETIME DEFAULT CURRENT_TIMESTAMP
//   )
// `);

// export interface Record {
// 	id?: number;
// 	loaded: number | string;
// 	collected: number | string;
// 	cutters: number | string;
// 	returned: number | string;
// 	image_path?: string;
// 	date_created?: string;
// }

// export class RecordService {
// 	static async createRecord(record: Omit<Record, 'id' | 'date_created'>): Promise<number> {
// 		const stmt = db.prepare(`
// 			INSERT INTO records (loaded, collected, cutters, returned, image_path)
// 			VALUES (?, ?, ?, ?, ?)
// 		`);
// 		const result = stmt.run(
// 			record.loaded.toString(),
// 			record.collected.toString(),
// 			record.cutters.toString(),
// 			record.returned.toString(),
// 			record.image_path ?? null // ensure null if not present
// 		);
// 		return result.lastInsertRowid as number;
// 	}

// 	static async getAllRecords(): Promise<Record[]> {
// 		const stmt = db.prepare('SELECT * FROM records ORDER BY date_created ASC');
// 		return stmt.all() as Record[];
// 	}

// 	static async getRecordById(id: number): Promise<Record | null> {
// 		const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
// 		return stmt.get(id) as Record | null;
// 	}

// 	static async updateRecord(
// 		id: number,
// 		data: Partial<Omit<Record, 'id' | 'date_created'>>
// 	): Promise<boolean> {
// 		const stmt = db.prepare(`
// 			UPDATE records
// 			SET loaded = ?, collected = ?, cutters = ?, returned = ?, image_path = ?
// 			WHERE id = ?
// 		`);
// 		const result = stmt.run(
// 			data.loaded?.toString(),
// 			data.collected?.toString(),
// 			data.cutters?.toString(),
// 			data.returned?.toString(),
// 			data.image_path ?? null, // ensure null if not present
// 			id
// 		);
// 		return result.changes > 0;
// 	}

// 	static async deleteRecord(id: number): Promise<boolean> {
// 		const stmt = db.prepare('DELETE FROM records WHERE id = ?');
// 		const result = stmt.run(id);
// 		return result.changes > 0;
// 	}
// }

// // Ensure static/images directory exists
// const imagesDir = path.join(process.cwd(), 'static', 'images');
// if (!fs.existsSync(imagesDir)) {
// 	fs.mkdirSync(imagesDir, { recursive: true });
// }

// export default db;
