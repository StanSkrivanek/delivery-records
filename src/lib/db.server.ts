import { dev } from '$app/environment';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = dev ? 'database.db' : './database.db';
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	loaded INTEGER NOT NULL,
	collected INTEGER NOT NULL,
	cutters INTEGER NOT NULL,
	returned INTEGER NOT NULL,
	image_path TEXT,
	date_created DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Record {
	id?: number;
	loaded: number;
	collected: number;
	cutters: number;
	returned: number;
	image_path?: string;
	date_created?: string;
}

export class RecordService {
	static async createRecord(record: Omit<Record, 'id' | 'date_created'>): Promise<number> {
		const stmt = db.prepare(`
	  INSERT INTO records (loaded, collected, cutters, returned, image_path)
	  VALUES (?, ?, ?, ?, ?)
	`);

		const result = stmt.run(
			record.loaded,
			record.collected,
			record.cutters,
			record.returned,
			record.image_path || null
		);

		return result.lastInsertRowid as number;
	}

	static async getAllRecords(): Promise<Record[]> {
		const stmt = db.prepare('SELECT * FROM records ORDER BY date_created ASC');
		return stmt.all() as Record[];
	}

	static async getRecordById(id: number): Promise<Record | null> {
		const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
		return stmt.get(id) as Record | null;
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
			data.loaded,
			data.collected,
			data.cutters,
			data.returned,
			data.image_path || null,
			id
		);
		return result.changes > 0;
	}

	static async deleteRecord(id: number): Promise<boolean> {
		const stmt = db.prepare('DELETE FROM records WHERE id = ?');
		const result = stmt.run(id);
		return result.changes > 0;
	}
}

// Ensure static/images directory exists
const imagesDir = path.join(process.cwd(), 'static', 'images');
if (!fs.existsSync(imagesDir)) {
	fs.mkdirSync(imagesDir, { recursive: true });
}

export default db;
