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
const IMAGES_DIR = path.join(__dirname, '..', 'static', 'images');
const IMAGES_BACKUP_NAME = 'images_backup';

function ensureBackupDirectory() {
	if (!fs.existsSync(BACKUP_DIR)) {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });
		console.log(`Created backup directory: ${BACKUP_DIR}`);
	}
}

function copyDirectorySync(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirectorySync(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

function getDirectorySize(dirPath) {
	let totalSize = 0;
	const entries = fs.readdirSync(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			totalSize += getDirectorySize(entryPath);
		} else {
			totalSize += fs.statSync(entryPath).size;
		}
	}
	return totalSize;
}

function backupImages() {
	try {
		const imagesBackupPath = path.join(BACKUP_DIR, IMAGES_BACKUP_NAME);

		if (!fs.existsSync(IMAGES_DIR)) {
			console.log('Images directory not found, skipping images backup');
			return false;
		}

		console.log('📸 Backing up images...');

		// Delete old images backup if it exists
		if (fs.existsSync(imagesBackupPath)) {
			fs.rmSync(imagesBackupPath, { recursive: true, force: true });
		}

		// Copy entire images directory
		copyDirectorySync(IMAGES_DIR, imagesBackupPath);

		// Calculate size
		const size = getDirectorySize(imagesBackupPath);
		const sizeInMB = (size / (1024 * 1024)).toFixed(2);

		console.log(`Images backed up successfully!`);
		console.log(`   Size: ${sizeInMB} MB`);

		return true;
	} catch (error) {
		console.error('Images backup failed:', error.message);
		return false;
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
			console.error('Database file not found at:', DB_PATH);
			process.exit(1);
		}

		// Ensure backup directory exists
		ensureBackupDirectory();

		// Generate backup filename
		const backupFilename = generateBackupFilename();
		const backupPath = path.join(BACKUP_DIR, backupFilename);

		// Copy the database file
		console.log('Creating database backup...');
		fs.copyFileSync(DB_PATH, backupPath);

		// Verify the backup was created
		if (!fs.existsSync(backupPath)) {
			console.error('Backup file was not created');
			process.exit(1);
		}

		// Get file size
		const stats = fs.statSync(backupPath);
		const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

		console.log('Database backup created successfully!');
		console.log(`Filename: ${backupFilename}`);
		console.log(`Location: ${BACKUP_DIR}`);
		console.log(`Size: ${fileSizeInMB} MB`);
		console.log(`Time: ${new Date().toLocaleString()}`);

		// Backup images
		console.log('');
		const imagesBackedUp = backupImages();

		// List all backups
		const backups = fs
			.readdirSync(BACKUP_DIR)
			.filter((file) => file.startsWith('database_backup_') && file.endsWith('.db')).length;

		console.log(`\nTotal database backups: ${backups}`);
		console.log(`Images backup: ${imagesBackedUp ? 'Up to date' : 'Not available'}`);
	} catch (error) {
		console.error('Backup failed:', error.message);
		process.exit(1);
	}
}

// Run the backup
createBackup();
