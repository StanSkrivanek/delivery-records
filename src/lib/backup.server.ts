import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';

// Backup configuration
const BACKUP_DIR = '/Volumes/HD-700/SQL/delivery-backups';
const DB_PATH = dev ? 'database.db' : './database.db';
const MAX_BACKUPS = 30; // Keep last 30 backups

/**
 * Ensures the backup directory exists
 */
function ensureBackupDirectory(): void {
	try {
		if (!fs.existsSync(BACKUP_DIR)) {
			fs.mkdirSync(BACKUP_DIR, { recursive: true });
			console.log(`Created backup directory: ${BACKUP_DIR}`);
		}
	} catch (error) {
		throw new Error(`Failed to create backup directory: ${error}`);
	}
}

/**
 * Generates a timestamped backup filename
 */
function generateBackupFilename(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	return `database_backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.db`;
}

/**
 * Removes old backups keeping only the most recent MAX_BACKUPS files
 */
function cleanupOldBackups(): void {
	try {
		const files = fs
			.readdirSync(BACKUP_DIR)
			.filter((file) => file.startsWith('database_backup_') && file.endsWith('.db'))
			.map((file) => ({
				name: file,
				path: path.join(BACKUP_DIR, file),
				mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
			}))
			.sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

		// Remove excess backups
		if (files.length > MAX_BACKUPS) {
			const filesToDelete = files.slice(MAX_BACKUPS);
			filesToDelete.forEach((file) => {
				fs.unlinkSync(file.path);
				console.log(`Deleted old backup: ${file.name}`);
			});
		}
	} catch (error) {
		console.error('Error cleaning up old backups:', error);
	}
}

/**
 * Creates a backup of the database
 * @returns Object with success status, message, and backup filename
 */
export async function createBackup(): Promise<{
	success: boolean;
	message: string;
	filename?: string;
	path?: string;
}> {
	try {
		// Check if source database exists
		if (!fs.existsSync(DB_PATH)) {
			return {
				success: false,
				message: 'Database file not found'
			};
		}

		// Ensure backup directory exists
		ensureBackupDirectory();

		// Generate backup filename
		const backupFilename = generateBackupFilename();
		const backupPath = path.join(BACKUP_DIR, backupFilename);

		// Copy the database file
		fs.copyFileSync(DB_PATH, backupPath);

		// Verify the backup was created
		if (!fs.existsSync(backupPath)) {
			return {
				success: false,
				message: 'Backup file was not created'
			};
		}

		// Get file size for verification
		const stats = fs.statSync(backupPath);
		const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

		// Cleanup old backups
		cleanupOldBackups();

		console.log(`Database backup created: ${backupFilename} (${fileSizeInMB} MB)`);

		return {
			success: true,
			message: `Backup created successfully: ${backupFilename} (${fileSizeInMB} MB)`,
			filename: backupFilename,
			path: backupPath
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Backup failed:', errorMessage);
		return {
			success: false,
			message: `Backup failed: ${errorMessage}`
		};
	}
}

/**
 * Lists all available backups
 */
export function listBackups(): Array<{
	filename: string;
	path: string;
	size: string;
	created: Date;
}> {
	try {
		ensureBackupDirectory();

		const files = fs
			.readdirSync(BACKUP_DIR)
			.filter((file) => file.startsWith('database_backup_') && file.endsWith('.db'))
			.map((file) => {
				const filePath = path.join(BACKUP_DIR, file);
				const stats = fs.statSync(filePath);
				return {
					filename: file,
					path: filePath,
					size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
					created: stats.mtime
				};
			})
			.sort((a, b) => b.created.getTime() - a.created.getTime());

		return files;
	} catch (error) {
		console.error('Error listing backups:', error);
		return [];
	}
}

/**
 * Restores a backup by filename
 */
export async function restoreBackup(
	filename: string
): Promise<{ success: boolean; message: string }> {
	try {
		const backupPath = path.join(BACKUP_DIR, filename);

		if (!fs.existsSync(backupPath)) {
			return {
				success: false,
				message: 'Backup file not found'
			};
		}

		// Create a safety backup of the current database before restoring
		const safetyBackupFilename = `database_pre-restore_${Date.now()}.db`;
		const safetyBackupPath = path.join(BACKUP_DIR, safetyBackupFilename);
		fs.copyFileSync(DB_PATH, safetyBackupPath);

		// Restore the backup
		fs.copyFileSync(backupPath, DB_PATH);

		console.log(`Database restored from: ${filename}`);

		return {
			success: true,
			message: `Database restored successfully from ${filename}. Safety backup created: ${safetyBackupFilename}`
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Restore failed:', errorMessage);
		return {
			success: false,
			message: `Restore failed: ${errorMessage}`
		};
	}
}

/**
 * Deletes a specific backup file
 */
export async function deleteBackup(
	filename: string
): Promise<{ success: boolean; message: string }> {
	try {
		const backupPath = path.join(BACKUP_DIR, filename);

		if (!fs.existsSync(backupPath)) {
			return {
				success: false,
				message: 'Backup file not found'
			};
		}

		fs.unlinkSync(backupPath);

		console.log(`Backup deleted: ${filename}`);

		return {
			success: true,
			message: `Backup deleted successfully: ${filename}`
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Delete backup failed:', errorMessage);
		return {
			success: false,
			message: `Delete failed: ${errorMessage}`
		};
	}
}
