#!/usr/bin/env node

/**
 * Manual database backup script
 * Usage: pnpm backup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKUP_DIR = '/Volumes/HD-700/SQL/delivery-backups';
const DB_PATH = path.join(__dirname, '..', 'database.db');

function ensureBackupDirectory() {
	if (!fs.existsSync(BACKUP_DIR)) {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });
		console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
	}
}

function generateBackupFilename() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	return `database_backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.db`;
}

function createBackup() {
	try {
		// Check if source database exists
		if (!fs.existsSync(DB_PATH)) {
			console.error('❌ Database file not found at:', DB_PATH);
			process.exit(1);
		}

		// Ensure backup directory exists
		ensureBackupDirectory();

		// Generate backup filename
		const backupFilename = generateBackupFilename();
		const backupPath = path.join(BACKUP_DIR, backupFilename);

		// Copy the database file
		console.log('📦 Creating backup...');
		fs.copyFileSync(DB_PATH, backupPath);

		// Verify the backup was created
		if (!fs.existsSync(backupPath)) {
			console.error('❌ Backup file was not created');
			process.exit(1);
		}

		// Get file size
		const stats = fs.statSync(backupPath);
		const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

		console.log('✅ Backup created successfully!');
		console.log(`   Filename: ${backupFilename}`);
		console.log(`   Location: ${BACKUP_DIR}`);
		console.log(`   Size: ${fileSizeInMB} MB`);
		console.log(`   Time: ${new Date().toLocaleString()}`);

		// List all backups
		const backups = fs
			.readdirSync(BACKUP_DIR)
			.filter((file) => file.startsWith('database_backup_') && file.endsWith('.db')).length;

		console.log(`\n📊 Total backups in directory: ${backups}`);
	} catch (error) {
		console.error('❌ Backup failed:', error.message);
		process.exit(1);
	}
}

// Run the backup
createBackup();
