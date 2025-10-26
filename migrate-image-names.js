#!/usr/bin/env node

/**
 * ONE TIME SCRIPT
 * Migration script to rename existing images from timestamp format to DD-MM-YYYY format
 * and update the database references accordingly.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');

// Convert timestamp to DD-MM-YYYY format
function timestampToDateString(timestamp) {
	const date = new Date(parseInt(timestamp));
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}-${month}-${year}`;
}

// Generate random suffix for uniqueness
function generateRandomSuffix() {
	return Math.random().toString(36).substring(2, 8);
}

// Main migration function
function migrateImages() {
	console.log('Starting image migration...\n');

	// Get all records with image paths
	const records = db
		.prepare('SELECT id, image_path FROM records WHERE image_path IS NOT NULL')
		.all();

	console.log(`Found ${records.length} records with images\n`);

	let successCount = 0;
	let errorCount = 0;
	const errors = [];

	for (const record of records) {
		const oldPath = record.image_path;
		const fullOldPath = path.join(__dirname, 'static', oldPath);

		try {
			// Check if file exists
			if (!fs.existsSync(fullOldPath)) {
				console.log(`File not found: ${oldPath}`);
				errorCount++;
				errors.push({ id: record.id, path: oldPath, error: 'File not found' });
				continue;
			}

			// Parse the path to extract components
			const pathParts = oldPath.split(path.sep);
			const filename = pathParts[pathParts.length - 1];
			const month = pathParts[pathParts.length - 2];
			const year = pathParts[pathParts.length - 3];

			// Extract timestamp and extension
			const match = filename.match(/^(\d+)(\.\w+)$/);
			if (!match) {
				console.log(`Filename doesn't match timestamp pattern: ${filename}`);
				errorCount++;
				errors.push({ id: record.id, path: oldPath, error: 'Invalid filename format' });
				continue;
			}

			const timestamp = match[1];
			const extension = match[2];

			// Generate new filename
			const dateStr = timestampToDateString(timestamp);
			const randomSuffix = generateRandomSuffix();
			const newFilename = `${dateStr}_${randomSuffix}${extension}`;

			// Construct new path
			const newPath = path.join('images', year, month, newFilename);
			const fullNewPath = path.join(__dirname, 'static', newPath);

			// Rename the file
			fs.renameSync(fullOldPath, fullNewPath);

			// Update database
			db.prepare('UPDATE records SET image_path = ? WHERE id = ?').run(newPath, record.id);

			console.log(`Migrated: ${filename} → ${newFilename}`);
			successCount++;
		} catch (error) {
			console.error(`Error processing record ${record.id}: ${error.message}`);
			errorCount++;
			errors.push({ id: record.id, path: oldPath, error: error.message });
		}
	}

	console.log('\n' + '='.repeat(60));
	console.log('Migration Summary:');
	console.log(`  Total records: ${records.length}`);
	console.log(`  Successfully migrated: ${successCount}`);
	console.log(`  Errors: ${errorCount}`);

	if (errors.length > 0) {
		console.log('Errors encountered:');
		errors.forEach((err) => {
			console.log(`  - Record ${err.id}: ${err.error} (${err.path})`);
		});
	}

	console.log('='.repeat(60));
}

// Run migration
try {
	migrateImages();
	db.close();
	console.log('Migration completed successfully!');
	process.exit(0);
} catch (error) {
	console.error('Migration failed:', error);
	db.close();
	process.exit(1);
}
