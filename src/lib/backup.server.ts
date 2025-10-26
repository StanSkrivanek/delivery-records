import { dev } from '$app/environment';
import fs from 'fs';
import path from 'path';

// Backup configuration
const BACKUP_DIR = '/Volumes/HD-700/SQL/delivery-backups';
const DB_PATH = dev ? 'database.db' : './database.db';
const IMAGES_DIR = 'static/images';
const IMAGES_BACKUP_NAME = 'images_backup';
const MAX_BACKUPS = 30; // Keep last 30 backups
const LAST_BACKUP_HASH_FILE = path.join(BACKUP_DIR, '.last_backup_hash.json');

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
 * Recursively copies a directory
 */
function copyDirectorySync(src: string, dest: string): void {
	// Create destination directory if it doesn't exist
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	// Read all files/folders in source directory
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			// Recursively copy subdirectory
			copyDirectorySync(srcPath, destPath);
		} else {
			// Copy file
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Recursively deletes a directory
 */
function deleteDirectorySync(dirPath: string): void {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
	}
}

/**
 * Calculates a simple hash of the database for change detection
 */
function getDatabaseHash(): string {
	try {
		if (!fs.existsSync(DB_PATH)) {
			return '';
		}
		const stats = fs.statSync(DB_PATH);
		// Use file size and modification time as a simple hash
		return `${stats.size}-${stats.mtimeMs}`;
	} catch (error) {
		console.error('Error calculating database hash:', error);
		return '';
	}
}

/**
 * Checks if database has changed since last backup
 */
function hasChangedSinceLastBackup(): boolean {
	try {
		const currentHash = getDatabaseHash();

		if (!fs.existsSync(LAST_BACKUP_HASH_FILE)) {
			// No previous backup recorded, consider it changed
			return true;
		}

		const lastBackupData = JSON.parse(fs.readFileSync(LAST_BACKUP_HASH_FILE, 'utf-8'));
		return lastBackupData.hash !== currentHash;
	} catch (error) {
		console.error('Error checking for changes:', error);
		// If we can't determine, assume changed to be safe
		return true;
	}
}

/**
 * Saves the current database hash to track changes
 */
function saveCurrentHash(): void {
	try {
		ensureBackupDirectory();
		const currentHash = getDatabaseHash();
		const data = {
			hash: currentHash,
			timestamp: new Date().toISOString()
		};
		fs.writeFileSync(LAST_BACKUP_HASH_FILE, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error('Error saving current hash:', error);
	}
}

/**
 * Backs up the images directory
 */
function backupImages(): { success: boolean; message: string; size?: string } {
	try {
		const imagesBackupPath = path.join(BACKUP_DIR, IMAGES_BACKUP_NAME);

		// Check if source images directory exists
		if (!fs.existsSync(IMAGES_DIR)) {
			return {
				success: false,
				message: 'Images directory not found'
			};
		}

		// Delete old images backup if it exists
		if (fs.existsSync(imagesBackupPath)) {
			deleteDirectorySync(imagesBackupPath);
		}

		// Copy entire images directory
		copyDirectorySync(IMAGES_DIR, imagesBackupPath);

		// Calculate total size
		const getDirectorySize = (dirPath: string): number => {
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
		};

		const size = getDirectorySize(imagesBackupPath);
		const sizeInMB = (size / (1024 * 1024)).toFixed(2);

		console.log(`Images backup updated: ${sizeInMB} MB`);

		return {
			success: true,
			message: `Images backed up successfully (${sizeInMB} MB)`,
			size: `${sizeInMB} MB`
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Images backup failed:', errorMessage);
		return {
			success: false,
			message: `Images backup failed: ${errorMessage}`
		};
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
 * Creates a backup of the database and images
 * @returns Object with success status, message, and backup filename
 */
export async function createBackup(): Promise<{
	success: boolean;
	message: string;
	filename?: string;
	path?: string;
	imagesBackedUp?: boolean;
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

		// Backup images
		const imagesResult = backupImages();

		// Cleanup old backups
		cleanupOldBackups();

		// Save current hash for change detection
		saveCurrentHash();

		const message = imagesResult.success
			? `Backup created: DB ${fileSizeInMB} MB, Images ${imagesResult.size}`
			: `Database backed up (${fileSizeInMB} MB), but images backup failed: ${imagesResult.message}`;

		console.log(`Database backup created: ${backupFilename} (${fileSizeInMB} MB)`);
		if (imagesResult.success) {
			console.log(`Images backup updated: ${imagesResult.size}`);
		}

		return {
			success: true,
			message,
			filename: backupFilename,
			path: backupPath,
			imagesBackedUp: imagesResult.success
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

/**
 * Checks if database has changed since last backup (exported for scheduler)
 */
export function checkForChanges(): boolean {
	return hasChangedSinceLastBackup();
}
